# ADR 0011: Support every Umbraco 17 release from 17.0.0

- Status: Accepted
- Date: 2026-09-30
- Issue: #2

## Context

A package can declare a narrow Umbraco range (the version it was built with and up) or the whole
major. A wide range reaches more sites but means the package must work on the oldest release in
it. Installing the packed package on fresh 17.0.0 and 17.7.0 sites showed it works on both.

## Decision

- The package references Umbraco as `[17.0.0, 18.0.0)`, so any 17.x site can install it. The
  range is `UmbracoPackageRange` in `Directory.Packages.props`.
- The sample sites and tests run the version the project develops against (`UmbracoDevVersion`).
- The client is compiled against the newer backoffice, so it may only call APIs that 17.0.0 has
  too. CI typechecks it against `@umbraco-cms/backoffice@17.0.0`. For example,
  `UmbLanguageCollectionRepository.requestAllItems` arrived after 17.0, which is why
  `dictionary-editor/languages.ts` pages through `requestCollection` itself.
- Markdig is referenced with a floor, not a pin, so NuGet unifies it with the copy Umbraco ships.
- `NuGetAuditMode=direct` on the package project stops the transitive packages resolved at the
  floor from producing audit noise; consuming sites resolve and audit their own.

## Consequences

- The package smoke test installs the packed package on the floor and the newest release of the
  major before every release ([ADR 0012](0012-smoke-test-the-packed-package.md)).
- 17.0's Tiptap logs a harmless warning (`Duplicate extension names found: ['listItem']`) when
  bullet and numbered lists are both enabled; 17.7 does not.
- [ADR 0014](0014-one-package-per-umbraco-major.md) applies the same rule to Umbraco 18, from
  18.0.0, where the Markdig floor is 1.1.3.
