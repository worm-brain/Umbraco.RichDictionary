# ADR 0014: Build one package per Umbraco major

- Status: Accepted
- Date: 2026-10-14

## Context

Umbraco 18 replaced Swashbuckle with Microsoft.AspNetCore.OpenApi, so the types a package uses to
register its API document on 17 do not exist on 18, and 18 offers
`AddBackOfficeOpenApiDocument` instead. Umbraco 18.0.0 also requires Markdig 1.1.3 or later. One
package cannot be compiled for both. The sibling `Umbraco.Community.*` packages ship one package
line per Umbraco major.

## Decision

- One source tree builds one package per major, selected by the global MSBuild property
  `UmbracoMajor` (default `17`; `-p:UmbracoMajor=18`). It must be a global property so it reaches
  project references and restore.
- `Directory.Build.props` defines `UMBRACO_17` or `UMBRACO_18` and gives non-17 builds their own
  `bin/u18` and `obj/u18` folders. `Directory.Packages.props` sets the range, the dev version and
  the Markdig floor per major.
- Major-specific code lives in paired `*.V17.cs` / `*.V18.cs` files wrapped in `#if UMBRACO_17` /
  `#if UMBRACO_18`, never inline `#if` in shared files. So far the only pair is
  `RichDictionaryApiDocument`.
- The package version follows the major: `17.x.y` for Umbraco 17 and `18.x.y` for 18. Local builds
  are `$(UmbracoMajor).0.0-dev`; a release tag's first number selects the major and sets the
  version.
- Each sample site belongs to one major. A solution build for the other major skips it, a direct
  build or run for the other major fails with the switch to use, and the site refuses to boot on
  the wrong Umbraco, so its database is never upgraded or downgraded by accident.

## Consequences

- Every 17/18 difference fails a build instead of a site. CI builds, tests and packs both majors.
- Two packages to release per version. `dotnet add package` without `--version` picks the newest
  version overall, which is the 18 line, so install instructions name the version.
- Both majors publish the API document with the same paths and operation ids, so the TypeScript
  client is generated once, from the 17 document. The client JavaScript does not depend on the
  major (`@umbraco-cms/*` is external).
