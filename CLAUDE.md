# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Status

Feature-complete for a first version: the rich dictionary editor (`dictionary-editor` client slice) works in both modes, and the server-side HTML helpers (`DictionaryHtml` slice) render stored values for the front end.

## Commands

The .NET side is run from the repo root; the solution is `Umbraco.RichDictionary.slnx`.

```sh
dotnet build Umbraco.RichDictionary.slnx
dotnet test Umbraco.RichDictionary.slnx
dotnet test --filter "FullyQualifiedName~ConfigurationControllerTests"   # single class; use ~Method for one test
dotnet csharpier format .                                                # CSharpier, pinned in dotnet-tools.json (dotnet tool restore)
dotnet run --project src/Umbraco.RichDictionary.TestSite                 # https://localhost:44336/umbraco, admin@example.com / 1234567890
uv run scripts/smoke-package.py                                          # pre-release: pack, install the .nupkg on fresh 17.0.0 + newest 17.x sites, check both modes
```

`scripts/smoke-package.py` (#20) uses [umbraco-spawn-harness](https://github.com/worm-brain/umbraco-spawn-harness), pinned by tag in the script's PEP 723 header, so it needs `uv`, the .NET 10 SDK and Bun (it packs). It packs with a unique `-smoke.<timestamp>` version, installs that from a local folder (never nuget.org), checks `/server/information`, both package manifests, the served bundle, the configuration endpoint and the copied appsettings schema, then deletes the sites and the cached smoke version. `--umbraco <ver>` (repeatable) picks other versions, `--package <file.nupkg>` tests an existing package instead of packing, `--keep` leaves the temp folder. It takes several minutes and is not run in CI.

The client is run from `src/Umbraco.RichDictionary/Client`, using **Bun**, not npm:

```sh
bun install
bun run build          # tsc + vite -> ../wwwroot/App_Plugins/UmbracoRichDictionary (gitignored build output)
bun run watch          # vite rebuild on change; the running test site serves the new files
bun run test           # vitest (happy-dom); single file: bun run test src/entrypoints/entrypoint.test.ts
bun run test:browser   # component tests (*.browser.test.ts) in Playwright Chromium; first time: bunx playwright install chromium
bun run typecheck
bun run format         # prettier; format:check in CI
bun run generate-client  # regenerates src/api from the RUNNING test site's Swagger doc
```

- CI (`.github/workflows/ci.yml`) runs every check above plus a pack on each PR and push to `main`. Releasing: bump `<Version>` in the package csproj, run `uv run scripts/smoke-package.py`, merge, then push a matching tag (`v1.0.0-beta.1`); `release.yml` refuses a tag that doesn't match, then tests, packs and pushes the `.nupkg` and `.snupkg` to nuget.org through NuGet trusted publishing (no stored API key; needs the nuget.org trusted-publishing policy for `release.yml` and the `NUGET_USER` repository variable).
- The NuGet id is `Umbraco.Community.RichDictionary` (nuget.org reserves the `Umbraco.` prefix); the assembly, namespaces, `App_Plugins/UmbracoRichDictionary` path and Umbraco manifest id stay `Umbraco.RichDictionary`. The `buildTransitive` targets file must be named after the NuGet id, or NuGet won't import it.
- `dotnet pack` builds the client itself (`bun install --frozen-lockfile` + `bun run build`, via the `BuildClient` target in the package `.csproj`), so Bun must be on PATH to pack. An ordinary `dotnet build` does not touch the client; pass `-p:BuildClient=true` to make it. A no-build pack fails if the client output is missing rather than shipping without it.
- The test site discovers static web asset *folders* only when it starts. If `wwwroot/App_Plugins/UmbracoRichDictionary` didn't exist when the site started (e.g. a fresh clone), restart it after the first client build. After that, new or rehashed chunks are served straight away. C# changes always need a restart.
- `src/api` is generated code and is committed, so the client builds without a running site. Regenerate it after any change to a controller or response model; never hand-edit it.

## Layout

- `src/Umbraco.RichDictionary`: the NuGet package, a Razor Class Library. C# is organised by feature (`Configuration/`, ...). `Api/` holds the shared Management API plumbing: the base controller, which routes to `/umbraco/umbracorichdictionary/api/v1/...`, requires the `TreeAccessDictionary` policy, and has its own Swagger doc with short operation ids.
- `src/Umbraco.RichDictionary/Client`: the Lit/TS back-office client. `umbraco-package.json` loads `bundle.manifests.ts`, which spreads each feature folder's `manifests` array. `entrypoints/` excludes the core view we replace and configures the generated API client with the back-office auth token. `@umbraco-cms/*` is external at build time because the back-office provides it at runtime.
  - `dictionary-editor/`: our replacement for the core `Umb.WorkspaceView.Dictionary.Edit` view. `workspace-view.element.ts` is a port of the core view: one field per language, the same user-language read-only rules, and writes through the core `UMB_DICTIONARY_WORKSPACE_CONTEXT.setPropertyValue`. `translation-input.element.ts` is the single seam that picks the editor (core `umb-input-tiptap`, `umb-input-markdown`, or `uui-textarea`).
  - `dictionary-editor/tiptap-toolbar.ts`: picks the Tiptap extensions and toolbar (#9). With `RichDictionary:RichTextDataType` set, the server's configuration endpoint reads that data type through `IDataTypeService` and returns its raw `extensions`/`toolbar`; the client drops media/block/embed tools and any alias not registered as the right manifest type (with a console warning), and falls back to the built-in toolbar when nothing usable is left. The data type is read server-side on purpose: the core `GET /data-type/{id}` endpoint requires the `TreeAccessDocumentsOrMediaOrMembersOrContentTypes` policy, which Umbraco's default Translators group (Translation section only) doesn't have.
  - `configuration/editor-mode.ts`: fetches the package configuration once per session. Anything other than `"Rte"`/`"Markdown"` (including a failed request) falls back to a plain textarea, so a problem can never re-save values in the wrong format.
- `src/Umbraco.RichDictionary/DictionaryHtml`: `IDictionaryHtmlConverter` turns a stored value into HTML for the configured mode, then runs it through Umbraco's `IHtmlSanitizer` (a no-op unless the site registers one). The extension methods live in the `Umbraco.Extensions` namespace, which Umbraco's default `_ViewImports.cshtml` already imports: `@Umbraco.GetDictionaryHtml(key[, culture])` / `GetDictionaryInlineHtml` (unwraps a single `<p>` for links and buttons), plus `ICultureDictionary.GetHtml` / `GetInlineHtml`. They resolve the converter through `StaticServiceProvider`, so their tests run in a non-parallel xUnit collection. Markdig is referenced with a 0.41.0 floor so NuGet unifies it with the copy Umbraco 17.x ships (0.45.0 in 17.7).
- `src/Umbraco.RichDictionary/CliDeclaration`: `CliManifestReader` (an `IPackageManifestReader`) emits a second package manifest holding one `umbracoCli` extension, whose `meta.dictionaryValueFormat` follows `EditorMode` (`Rte` or unrecognised: `html`; `Markdown`: `markdown`). Management API clients read it from `/manifest/manifest` to learn what the dictionary values hold; the extension type and its vocabulary are defined in worm-brain/Umbraco.Cli#439. It is C# because a static `umbraco-package.json` can't read config. See the design note below.
- `src/Umbraco.RichDictionary.TestSite`: an Umbraco 17.7.0 site on SQLite that references the package project. It exists only for development. Its runtime state (`umbraco/`) is gitignored. Umbraco writes an `Imaging:HMACSecretKey` into its `appsettings.json` on first boot. `Views/testPage.cshtml` is a development page: it shows every dictionary item in every language, comparing core `GetDictionaryValue` with `GetDictionaryHtml`. Its `testPage` document type and the published root node exist only in the local database, so a fresh database needs them created again (in the back-office: a document type allowed at root, with the `Test Page` template as its default).
- `tests/Umbraco.RichDictionary.Tests`: xUnit + NSubstitute, with folders that mirror the package's feature folders. It pins Umbraco 17.7.0.

Package version: defined once, as `<Version>` in `Umbraco.RichDictionary.csproj`. The client build (`Client/scripts/umbraco-package-version.ts`, a Vite plugin) stamps it into the built `umbraco-package.json`; the `version` in `public/umbraco-package.json` is a placeholder that never ships. `dotnet pack` passes `$(PackageVersion)` as `RICH_DICTIONARY_VERSION`, so `-p:Version=...` reaches the manifest too. `allowTelemetry` is `true` deliberately (Umbraco's anonymous package-version telemetry). Licence: MIT (`LICENSE`); the repo `README.md` and `src/Umbraco.RichDictionary/icon.png` are packed into the `.nupkg`.

Umbraco Marketplace: listing comes from the `umbraco-marketplace` NuGet tag, and only stable versions are listed (prereleases never are). `umbraco-marketplace.json` at the repo root adds the category, screenshots and links; the Marketplace reads it from `main` via `PackageProjectUrl`, so changes go live without a release. Check it with https://marketplace.umbraco.com/validate.

Version policy: the package references Umbraco as `[17.0.0, 18.0.0)` so that any 17.x site can install it. The test site and tests pin the version we develop against. `NuGetAuditMode=direct` on the package project stops the transitive packages resolved at the 17.0.0 floor from producing audit noise.

17.0 floor (decided, #2): verified by installing the `.nupkg` on fresh 17.0.0 and 17.7.0 sites; the floor stays at 17.0.0. `scripts/smoke-package.py` repeats that install check against 17.0.0 and the newest 17.x. Every Tiptap extension and toolbar alias in the built-in toolbar is registered on 17.0. The client is compiled against the 17.7 back-office, though, so it must only call APIs that 17.0 has too: `UmbLanguageCollectionRepository.requestAllItems` (and core `fetchAllPages`) arrived after 17.0, which is why `dictionary-editor/languages.ts` pages through `requestCollection` itself. To check a change against the floor, copy the client somewhere, `bun add -d @umbraco-cms/backoffice@17.0.0` and run `tsc --noEmit` (only `browser-test-setup.ts` fails there, on a test-only import). 17.0's Tiptap logs a harmless core warning (`Duplicate extension names found: ['listItem']`) whenever BulletList and OrderedList are both enabled; 17.7 doesn't.

## What this is

Umbraco.RichDictionary is an **Umbraco 17** backoffice extension, shipped as a C# NuGet package plus a Lit/TypeScript client. It is a drop-in replacement for Umbraco's built-in **Translation** section (the Dictionary). It works the same way, but dictionary values are edited with a rich editor instead of a plain textarea.

- **Decision:** we replace only the core dictionary "Edit" workspace view, not the whole section. In 17.7 that view is the only place with plain textareas. The section's permission alias (`Umb.Section.Translation`) and its `/section/translation` path are hard-coded into the core tree, collection, search and workspace links. A separate section would mean re-implementing all of those, and user groups would lose access until they were granted the new section. So the section, tree, create/move/delete, import/export, search and permissions stay core and untouched.
- The editor can be configured as **`Rte`** (Tiptap) or **`Markdown`**, set once per site.
- The developer-facing API is unchanged. Existing Umbraco dictionary calls keep working. We only add *optional* extension methods that parse the stored value and return HTML.

## Hard constraints

- **No data changes.** Values stay in Umbraco's own dictionary storage as plain strings, holding HTML or Markdown depending on the configured mode. No custom tables, no migrations, no schema changes, and no re-writing of existing values on install.
- **Reversible.** Installing the package on a site with a fully populated dictionary must just work, with existing plain-text values displayed in the rich editor. Uninstalling must bring back the stock Translation section with nothing to clean up. The only visible leftover is that values edited while the package was installed now contain HTML/Markdown markup.
- **Don't fork the Umbraco API.** Use Umbraco's existing Management API endpoints and services for dictionary CRUD. Prefer re-using or extending core backoffice extensions (repositories, stores, workspace pieces) over re-implementing them. Only replace the parts needed to swap the value editor and hide the core section.

## Design notes and open questions

Things to settle as you build; record decisions here or as ADRs:

- **Hiding the core view:** the entry point calls `extensionRegistry.exclude("Umb.WorkspaceView.Dictionary.Edit")`. Don't use CSS or permission hacks. If an Umbraco upgrade renames that alias, both views will render, so `dictionary-editor/constants.test.ts` fails when the installed `@umbraco-cms/backoffice` stops registering it; update `CORE_DICTIONARY_EDIT_VIEW_ALIAS` in `constants.ts` then.
- **Saving with restricted languages (decided, #5):** the core dictionary save sends every translation, and the Management API rejects the whole update (403) if it names any language the user's groups don't grant, even unchanged. So a user without access to every language could never save (stock Umbraco has the same bug). The entry point swaps the core `Umb.Repository.Dictionary.Detail` for `dictionary-editor/dictionary-detail.repository.ts`, a subclass under the same alias whose `save` sends only editable translations; the API keeps the stored value of every language left out. It is the one core piece we replace besides the edit view; `constants.test.ts` guards its alias too. Uninstalling restores core behaviour (and the core bug).
- **No phantom edits:** opening an item must not dirty the workspace, or Umbraco prompts "discard changes?" on navigation. Tiptap receives legacy values as its initial `content` (no update event), and `translation-input` only dispatches `change` on user edits. See that file for the empty-editor (`<p></p>` vs `""`) loop guard. The component tests (`*.browser.test.ts`) cover both against the real core Tiptap editor.
- **Management API JSON:** our base controller must carry `[JsonOptionsName(Constants.JsonOptionsNames.BackOffice)]`. Without it, enums serialise as numbers while Swagger (and so `src/api`) promises strings.
- **Plain-text legacy values: one rule, implemented twice.** `dictionary-editor/tiptap-content.ts` (client) and `DictionaryHtmlConverter` (server) must agree, so a value renders the same in the editor and on the site. A value containing HTML markup (a tag or a character reference) passes through. Anything else is text: escape only `& < >`, turn blank lines into paragraphs and newlines into `<br>`. Their test cases mirror each other; change both together. In Markdown mode the editor shows values raw, and the server renders a single newline as `<br>`.
- **Sanitising (decided):** output is not sanitised by the package itself. It goes through Umbraco's `IHtmlSanitizer`, matching how Umbraco treats rich text written by back-office users.
- **Configuration is optional (decided):** with no `RichDictionary` section the site runs in `Rte` mode. An unrecognised `EditorMode` does not fail startup: `EditorModeConverter` (a `TypeConverter` on the enum, used by the configuration binder) binds it as `Rte`, and `EditorModeStartupCheck` logs one warning at startup naming the bad value. Names only, case-insensitive; numbers are rejected. The back-office endpoint and the HTML helpers both read the bound options, so they agree.
- **appsettings schema:** `appsettings-schema.Umbraco.RichDictionary.json` ships at the package root and `buildTransitive/Umbraco.Community.RichDictionary.targets` adds it as an `UmbracoJsonSchemaFiles` item, which Umbraco's build copies into the site and references from `appsettings-schema.json`. The test site imports that `.targets` directly (project references get no buildTransitive files). Add new settings to the schema as well as to `RichDictionaryOptions`. Umbraco only ever *adds* schema references: after uninstalling, the copied schema file and its `$ref` stay until someone deletes them (harmless, but the entry does not disappear on its own).
- **Language fallback:** the helpers read through `UmbracoHelper.GetDictionaryValue`, so they inherit core behaviour: a missing translation is empty, and language fallback is not applied.
- **Switching modes on a site that already has data (decided, #10):** changing `Rte` <-> `Markdown` after values have been saved leaves content in the other format. It is detected, not converted: `dictionary-editor/format-mismatch.ts` flags a value that clearly looks like the other format (Markdown `**bold**`, links or headings in `Rte` mode; Tiptap's block-wrapped HTML in `Markdown` mode), and `translation-input` shows a non-blocking warning under that field. The heuristics are deliberately conservative, and the stored value is never changed. A "convert this value" action may come later.
- **CLI declaration manifest (decided, #12):** checked against the 17.7.0 source and on the test site.
  - Umbraco never merges manifests by id: `PackageManifestService` concatenates every reader's output, and `/manifest/manifest` returns ours and the static one as separate entries. Ours reuses the static manifest's id and version, so clients attribute it to this package. Its name is empty on purpose, because the back-office Packages > Installed list shows every manifest that has a name (keyed by name).
  - `PackageManifestService` caches the combined list for 30 days in the `Production` runtime mode and 10 seconds otherwise. So in production an `EditorMode` change reaches clients only after a restart. The configuration endpoint and the HTML helpers are not cached.
  - The composer inserts the reader at index 0 instead of calling `AddSingleton` (the registration Umbraco's docs show). `PackagingService` (package telemetry, migration status) injects a single `IPackageManifestReader`, which DI resolves to the last registration, core's App_Plugins reader. Appending ours would hide every other package from it. `CliDeclarationComposerTests` guards this.
  - The back-office tolerates an extension type that nothing registers: its registry rejects only entries without a type or alias, or with a duplicate alias. Checked in both modes: no new console errors, and the dictionary editor loads.
- **Markdown parsing:** check what Umbraco 17 already references (e.g. for its own Markdown property editor) before adding a parser package. Tiptap is already part of the Umbraco 17 backoffice, so re-use the core Tiptap editor element or extensions instead of bundling a separate copy. `@umbraco-cms/backoffice` 17.7 also lists `marked` and `dompurify` among its peer dependencies, so client-side Markdown preview and sanitising don't need new packages.

## Architecture preferences

- Organise both the C# and Lit code by feature (vertical slices), not by technical layer.
- Keep the editor choice behind one seam: the section, tree and workspace shouldn't know which editor mode is active.
