# ADR 0012: Smoke-test the packed package before every release

- Status: Accepted
- Date: 2026-10-05
- Issue: #20

## Context

The sample sites reference the package *project*, so they never see what `dotnet pack` produces:
the static web assets, the stamped version, the appsettings schema and the `buildTransitive`
targets. A packing mistake would only show up on a customer's site.

## Decision

- `tests/package-smoke/smoke_nupkg.py`, a uv script using
  [umbraco-spawn-harness](https://github.com/worm-brain/umbraco-spawn-harness) at a pinned tag,
  installs the packed `.nupkg` from a local folder on fresh sites of the major's floor and its
  newest release.
- It checks, first with no configuration and then in `Markdown` mode: the running Umbraco
  version, both package manifests and the declared value format, the served bundle and its chunks,
  the configuration endpoint, and that the appsettings schema was copied and referenced.
- `release.yml` runs it on the packed artifacts between pack and publish.

## Consequences

- Nothing is published that does not install and boot on a clean site of each supported end of
  the range.
- The check takes several minutes, so it runs on release, not on every pull request.
