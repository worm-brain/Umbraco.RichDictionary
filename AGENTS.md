# AGENTS.md

Instructions for anyone, person or agent, changing the code in this repository. This is the
canonical instructions file; tool-specific files such as `CLAUDE.md` point here. Contributions
follow [CONTRIBUTING.md](CONTRIBUTING.md): ideas and issues are welcome from anyone, and pull
requests are issue-first and invitation-only.

## What this is

`Umbraco.Community.RichDictionary` is an Umbraco 17/18 backoffice extension that edits dictionary
values with a rich text (Tiptap) or Markdown editor instead of a plain textarea. It replaces only
the core dictionary edit view and keeps values in Umbraco's own dictionary storage as HTML or
Markdown, so it installs onto a populated dictionary and uninstalls cleanly. It adds HTML helpers
that render stored values on the site, and declares the value format to Management API clients. It
ships one NuGet package per Umbraco major: `17.x` and `18.x`. The decisions behind it are in
[docs/adr/](docs/adr/README.md).

## Working rules

- Verify Umbraco and SDK APIs against the installed version before use; never invent aliases,
  routes, element names or members. When docs and the installed package disagree, the package wins.
- Record decisions in `docs/adr/` (see its README): a change to a contract, a dependency, a
  supported version or something an earlier ADR decided gets a new ADR.
- Organise by feature folder, not technical layer, in C# and in the client.
- Never change stored values or add tables or migrations (ADR 0002). Replace only what is needed
  to swap the value editor (ADR 0001).
- Tooling: Bun, Vite, Vitest and Prettier for the client; xUnit v3, NSubstitute and CSharpier for
  .NET.
- One package per Umbraco major (ADR 0014): `dotnet build` targets 17, `-p:UmbracoMajor=18`
  targets 18. Major-specific code goes in paired `*.V17.cs` / `*.V18.cs` files, never inline
  `#if`. Build and test both majors before committing anything that touches Umbraco APIs.
- The client is compiled against the newer backoffice but must only use APIs the floor (17.0.0,
  18.0.0) has; CI typechecks against both floors (ADR 0011).
- Run the tests before every commit and read the build summary. Stop any running sample site first:
  a locked DLL shows up as build errors.
- C# members carry XML doc comments, exported TypeScript carries TSDoc, and new or changed code
  comes with tests (`MethodName_Scenario_ExpectedBehaviour` names in .NET).
- Conventional Commits, ASCII only.
- Every user-visible change adds a line under `## [Unreleased]` in `CHANGELOG.md` and updates the
  `docs/` page that describes it (CONTRIBUTING.md has the docs style guide).
- Branches: `main` plus one short-lived branch per pull request. Both majors build from `main`.

## Commands

```sh
# .NET: format check, build and test for Umbraco 17; add -p:UmbracoMajor=18 for 18
dotnet tool restore && dotnet csharpier check .
dotnet build -warnaserror
dotnet test --solution Umbraco.Community.RichDictionary.slnx
dotnet test --filter-class "*.ConfigurationControllerTests"   # one class; --filter-method for one test

# Client, in src/Umbraco.Community.RichDictionary/Client
bun install
bun run format:check && bun run typecheck && bun run test && bun run test:browser && bun run build
bun run e2e                # Playwright against both sample sites, on ports 44444 (17) and 44454 (18)
bun run docs:screenshots   # retake docs/images/editor-*.png from the Umbraco 17 sample site
bun run generate           # regenerate src/api/ from the running Umbraco 17 sample site

# Sample sites; build the client first, because its output is gitignored
dotnet run --project samples/RichDictionary.Site17                      # https://localhost:44440/umbraco
dotnet run --project samples/RichDictionary.Site18 -p:UmbracoMajor=18   # https://localhost:44450/umbraco

# Package smoke test (ADR 0012): pack one major, then install it on fresh sites
dotnet pack src/Umbraco.Community.RichDictionary -o artifacts/17 -p:UmbracoMajor=17 -p:Version=17.0.0-alpha.0
uv run tests/package-smoke/smoke_nupkg.py --packages artifacts/17 --major 17
```

The sample sites install themselves on first run (SQLite) and sign in with `admin@example.com` /
`1234567890` (development only, set in `appsettings.Development.json`). The same file sets a fixed,
development-only `Umbraco:CMS:Imaging:HMACSecretKey`, because without one the unattended install
writes a generated key into `appsettings.json`; never commit a key there. Each site runs on one
Umbraco major: a solution build for the other major skips it, and building or running it on its own
for the other major fails with the switch to use. A site discovers static web asset folders only
when it starts, so restart it after the first client build on a fresh clone.

To release, move the `## [Unreleased]` entries under `## [17.x.y] and [18.x.y] - <date>` in the
commit you tag, then push the tags `v17.x.y` and `v18.x.y`. `release.yml` runs the security gate,
tests, packs, smoke-tests the packed package, publishes to nuget.org and creates the GitHub
Release from that CHANGELOG section. A suffix (`v17.1.0-beta.1`) makes a pre-release.

## Project facts

- **Server** (`src/Umbraco.Community.RichDictionary/`), one folder per feature: `Configuration`
  (options, the configuration endpoint, the startup check), `DictionaryHtml` (the converter and the
  HTML helpers), `CliDeclaration` (the `umbracoCli` manifest) and `Api` (the base controller and
  the API document per major).
- **API:** routes under `/umbraco/umbracorichdictionary/api/v1/`, with the `TreeAccessDictionary`
  policy. The API document is named `umbracorichdictionary`. The base controller must keep
  `[JsonOptionsName(Constants.JsonOptionsNames.BackOffice)]`, or enums serialise as numbers while
  the document promises strings.
- **Names:** the package id, assembly, namespaces, manifest id and extension aliases use
  `Umbraco.Community.RichDictionary`. The `RichDictionary` configuration section, the
  `umbracorichdictionary` route and the `rich-dictionary-*` element tags keep their original names
  (ADR 0013). The `buildTransitive` targets file must be named after the package id.
- **Client** (`src/Umbraco.Community.RichDictionary/Client/src/`), one folder per feature:
  `dictionary-editor` (the workspace view, the translation input, the toolbar, languages and the
  repository swap), `configuration` (the configuration fetch) and `entrypoints`. `src/api/` is
  generated by `@hey-api/openapi-ts`; never hand-edit it.
- Vite builds the client into `wwwroot/App_Plugins/UmbracoCommunityRichDictionary/`. The manifest
  `public/umbraco-package.json` has the id `Umbraco.Community.RichDictionary`; the build stamps its
  version from `RICH_DICTIONARY_VERSION`, which `dotnet pack` sets.
- The package defines no context of its own: the workspace view writes through the core
  `UMB_DICTIONARY_WORKSPACE_CONTEXT`. It defines no CSS custom properties; colours and sizes come
  from UUI tokens.
- `translation-input.element.ts` is the one place that picks the editor (`umb-input-tiptap`,
  `umb-input-markdown` or `uui-textarea`). Opening an item must not mark the workspace as changed:
  the editors dispatch `change` only on user edits.
- `tiptap-content.ts` (client) and `DictionaryHtmlConverter` (server) implement the same
  plain-text rule; change both together (ADR 0004).
- Lit and UUI come through `@umbraco-cms/backoffice/*`; elements extend `UmbLitElement`.

## Gotchas

- `dotnet pack` builds the client itself, so Bun must be on PATH to pack. An ordinary build does
  not touch the client; pass `-p:BuildClient=true` to make it.
- Umbraco 17.7 and 18.2 still bring vulnerable transitive packages, and the NuGet audit fails the
  build. The sample sites and tests reference patched `System.Security.Cryptography.*` versions,
  and the sample sites suppress the SixLabors.ImageSharp advisories, each with a comment; remove
  them once Umbraco ships the fixes.
- The component tests' Rte cases time out against `@umbraco-cms/backoffice` 18.0.0, whose Tiptap
  editor waits for a server setting the test page does not serve. They pass against 18.2, and a
  real 18.0.0 site works.
- Each sample site's `Views/testPage.cshtml` compares `GetDictionaryValue` with
  `GetDictionaryHtml` for every item. Its document type and root node exist only in the local
  database, so create them again on a fresh one.
- `umbraco-marketplace.json` is read from `main` by the Umbraco Marketplace, so changes to it go
  live without a release. Check it with https://marketplace.umbraco.com/validate.
