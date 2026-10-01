# /// script
# requires-python = ">=3.9"
# dependencies = ["umbraco-spawn-harness @ git+https://github.com/worm-brain/umbraco-spawn-harness@v0.1.0"]
# ///
"""smoke-package.py - the pre-release check: install the packed .nupkg on fresh Umbraco sites.

  uv run scripts/smoke-package.py [--umbraco 17.0.0 --umbraco 17 ...] [--package <file.nupkg>] [--keep]

The test site references the package *project*, so it never sees what `dotnet pack` produces. This packs the
package (with a unique `-smoke.<timestamp>` version, so NuGet's global cache can't serve a stale copy), then for
each Umbraco version spawns a throwaway site with umbraco-spawn-harness, installs the .nupkg from the local folder
and checks it through the Management API, first in the default `Rte` mode (no RichDictionary config at all) and
then in `Markdown` mode. By default that is the 17.0.0 floor and the newest 17.x.

`--package` skips the pack and tests an existing .nupkg instead (one downloaded from nuget.org, say).
Exits 1 when any version fails. Sites go in a temp folder that is deleted afterwards; `--keep` leaves it there,
with the sites stopped (`umbraco-spawn-harness start <name> --root <folder>` brings one back).
"""
import argparse
import json
import os
import re
import shutil
import sys
import tempfile
import time
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

from umbraco_spawn_harness import (SpawnError, die, get_text, heading, nuget_global_packages, remove_tree, run, say,
                                   scaffold, utf8_stdio, warn)

REPO = Path(__file__).resolve().parent.parent
PROJECT = REPO / "src" / "Umbraco.RichDictionary"

# The ids the package uses inside Umbraco. They differ from the NuGet id (Umbraco.Community.RichDictionary)
# on purpose; see CLAUDE.md.
MANIFEST_ID = "Umbraco.RichDictionary"
CLI_EXTENSION_TYPE = "umbracoCli"
CONFIGURATION_PATH = "/umbraco/umbracorichdictionary/api/v1/configuration"
SCHEMA_FILE = "appsettings-schema.Umbraco.RichDictionary.json"

# EditorMode -> the `dictionaryValueFormat` the CLI declaration should advertise (CliManifestReader).
MODES = {"Rte": "html", "Markdown": "markdown"}
MODE_ENV = "RichDictionary__EditorMode"  # environment variables override appsettings.json in ASP.NET Core


class CheckFailed(Exception):
    """A smoke check found the installed package misbehaving (as opposed to the harness failing to spawn)."""


def check(condition, message):
    """Fail the current site's run with `message` unless `condition` holds.

    :param condition: the thing that should be true.
    :param message: what is wrong when it isn't.
    :raises CheckFailed: when `condition` is falsy.
    """
    if not condition:
        raise CheckFailed(message)


# ----------------------------------------------------------------- pack --
def pack(out_dir):
    """Pack the package into `out_dir` with a unique smoke version (this also builds the client, so needs Bun).

    :param out_dir: the folder for the .nupkg.
    :returns: the path of the .nupkg.
    :raises SpawnError: when reading the version or packing fails.
    """
    res = run(["dotnet", "msbuild", PROJECT, "-getProperty:Version"], capture_output=True)
    if res.returncode:
        raise SpawnError(f"Reading the package version failed:\n{(res.stdout + res.stderr).strip()[-2000:]}")
    base = res.stdout.strip()
    # SemVer: add a pre-release label, or extend the existing one (1.0.0-beta.2 -> 1.0.0-beta.2.smoke.<ts>).
    version = f"{base}{'.' if '-' in base else '-'}smoke.{time.strftime('%Y%m%d%H%M%S')}"

    say(f"Packing {version} (builds the client too)")
    log = out_dir / "pack.log"
    with open(log, "wb") as f:
        code = run(["dotnet", "pack", PROJECT, "-c", "Release", "-o", out_dir, f"-p:Version={version}", "-nologo"],
                   stdout=f, stderr=f).returncode
    if code:
        tail = "\n".join(log.read_text(encoding="utf-8", errors="replace").splitlines()[-30:])
        raise SpawnError(f"dotnet pack failed (full log: {log})\n{tail}")
    return next(out_dir.glob(f"*.{version}.nupkg"))


def read_nuspec(nupkg):
    """Read a .nupkg's package id and version from its .nuspec.

    :param nupkg: the .nupkg path.
    :returns: `(id, version)`.
    :raises SpawnError: when the file isn't a readable package.
    """
    try:
        with zipfile.ZipFile(nupkg) as z:
            name = next(n for n in z.namelist() if n.endswith(".nuspec") and "/" not in n)
            root = ET.fromstring(z.read(name))
    except (OSError, zipfile.BadZipFile, StopIteration, ET.ParseError) as e:
        raise SpawnError(f"{nupkg} is not a readable .nupkg ({e or 'no .nuspec'})") from None
    # The nuspec namespace varies between NuGet versions, so match on local names only.
    meta = {re.sub(r"^\{.*\}", "", el.tag): (el.text or "").strip() for el in root.iter()}
    return meta["id"], meta["version"]


def forget_cached_package(package_id, version):
    """Delete the smoke version from NuGet's global packages folder, so smoke runs don't pile up there.

    :param package_id: the NuGet id.
    :param version: the version that was installed.
    """
    cached = Path(nuget_global_packages()) / package_id.lower() / version.lower()
    if cached.is_dir():
        remove_tree(cached)


# --------------------------------------------------------------- checks --
def check_site(site, nupkg_version, mode):
    """Check the installed package on a running site, for one editor mode.

    :param site: the running `Site`.
    :param nupkg_version: the package version that was installed.
    :param mode: the editor mode the site was started with (`Rte` or `Markdown`).
    :raises CheckFailed: on the first check that fails.
    :raises SpawnError: when signing in fails.
    """
    api = site.admin_session()

    # The site really runs the Umbraco version it was spawned with (the package's [17.0.0, 18.0.0)
    # range must not have pulled in a newer Umbraco).
    info = api.json("GET", "/server/information")
    check(str(info.get("version", "")).startswith(site.umbraco_version),
          f"site runs Umbraco {info.get('version')}, expected {site.umbraco_version}")

    # Both of the package's manifests: the static one from App_Plugins (proves the static web assets shipped,
    # with the version stamped in) and the CLI declaration CliManifestReader adds.
    manifests = [m for m in api.json("GET", "/manifest/manifest") if m.get("id") == MANIFEST_ID]
    static = next((m for m in manifests if m.get("name")), None)
    check(static, "the static umbraco-package.json manifest is missing from /manifest/manifest")
    check(static.get("version") == nupkg_version,
          f"static manifest version is {static.get('version')!r}, expected {nupkg_version!r}")
    cli = next((e for m in manifests for e in m.get("extensions", []) if e.get("type") == CLI_EXTENSION_TYPE), None)
    check(cli, f"no {CLI_EXTENSION_TYPE} extension in /manifest/manifest")
    fmt = (cli.get("meta") or {}).get("dictionaryValueFormat")
    check(fmt == MODES[mode], f"dictionaryValueFormat is {fmt!r}, expected {MODES[mode]!r}")

    # The client entry point the static manifest names is actually served.
    bundle = next((e.get("js") for e in static.get("extensions", []) if e.get("type") == "bundle"), None)
    check(bundle, "the static manifest has no bundle extension")
    status, body = get_text(site.host + bundle)
    check(status == 200 and body.strip(), f"GET {bundle} returned HTTP {status}" + ("" if body.strip() else " (empty)"))

    # The package's own Management API endpoint, which reads the bound options.
    status, _, body = api.http.request("GET", site.host + CONFIGURATION_PATH,
                                       headers={"Authorization": f"Bearer {api.token}"})
    check(status == 200, f"GET {CONFIGURATION_PATH} returned HTTP {status}: {body[:200]}")
    editor_mode = json.loads(body).get("editorMode")
    check(editor_mode == mode, f"configuration endpoint reports editorMode {editor_mode!r}, expected {mode!r}")

    say(f"{mode}: manifests, bundle and configuration endpoint OK")


def check_schema(site):
    """Check the build copied the appsettings schema into the site (buildTransitive targets imported).

    :param site: the built `Site`.
    :raises CheckFailed: when the schema file or its reference is missing.
    """
    check((site.project / SCHEMA_FILE).is_file(), f"{SCHEMA_FILE} was not copied into the site")
    combined = site.project / "appsettings-schema.json"
    check(combined.is_file() and SCHEMA_FILE in combined.read_text(encoding="utf-8"),
          f"appsettings-schema.json does not reference {SCHEMA_FILE}")
    say("appsettings schema copied and referenced")


# ----------------------------------------------------------------- main --
def smoke(root, umbraco, nupkg, package_id, version):
    """Spawn one Umbraco version with the package installed and run every check in both modes.

    :param root: the sites folder.
    :param umbraco: the Umbraco version request (`17.0.0`, `17`, ...).
    :param nupkg: the .nupkg to install.
    :param package_id: its NuGet id.
    :param version: its version.
    :raises CheckFailed: when a check fails.
    :raises SpawnError: when spawning, building or starting the site fails.
    """
    site = scaffold(root, f"smoke-{umbraco}", umbraco)
    try:
        say(f"Installing {package_id} {version} into Umbraco {site.umbraco_version}")
        site.add_package(package_id, version, source=str(nupkg.parent))
        site.build()
        check_schema(site)
        for mode in MODES:
            # Rte runs with no RichDictionary configuration at all, which is also the default-config check.
            if mode == "Rte":
                os.environ.pop(MODE_ENV, None)
            else:
                os.environ[MODE_ENV] = mode
            site.start()
            check_site(site, version, mode)
            site.stop()
    finally:
        os.environ.pop(MODE_ENV, None)
        site.stop()


def main():
    utf8_stdio()
    p = argparse.ArgumentParser(prog="smoke-package.py", description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--umbraco", action="append", help="Umbraco version to test on (repeatable; default 17.0.0 and 17)")
    p.add_argument("--package", type=Path, help="Test this .nupkg instead of packing the working tree")
    p.add_argument("--keep", action="store_true", help="Keep the temp folder (sites stopped, logs intact)")
    a = p.parse_args()
    versions = a.umbraco or ["17.0.0", "17"]

    root = Path(tempfile.mkdtemp(prefix="richdictionary-smoke-"))
    failed = []
    package_id = version = None
    try:
        if a.package:
            nupkg = (root / "packages" / a.package.name)
            nupkg.parent.mkdir()
            shutil.copy2(a.package, nupkg)  # its own folder, so the install source holds only this package
        else:
            (root / "packages").mkdir()
            nupkg = pack(root / "packages")
        package_id, version = read_nuspec(nupkg)

        for umbraco in versions:
            heading(f"Umbraco {umbraco}")
            try:
                smoke(root / "sites", umbraco, nupkg, package_id, version)
            except (CheckFailed, SpawnError) as e:
                warn(f"Umbraco {umbraco}: {e}")
                failed.append(umbraco)
    except SpawnError as e:
        die(str(e))
    finally:
        if package_id and not a.package:
            forget_cached_package(package_id, version)
        if a.keep:
            print(f"\nKept {root}")
        else:
            remove_tree(root)

    print(f"\n{len(versions) - len(failed)}/{len(versions)} passed")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
