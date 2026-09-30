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
```

The client is run from `src/Umbraco.RichDictionary/Client`, using **Bun**, not npm:

```sh
bun install
bun run build          # tsc + vite -> ../wwwroot/App_Plugins/UmbracoRichDictionary (gitignored build output)
bun run watch          # vite rebuild on change; the running test site serves the new files
bun run test           # vitest (happy-dom); single file: bun run test src/entrypoints/entrypoint.test.ts
bun run typecheck
bun run format         # prettier; format:check in CI
bun run generate-client  # regenerates src/api from the RUNNING test site's Swagger doc
```

- `dotnet pack` builds the client itself (`bun install --frozen-lockfile` + `bun run build`, via the `BuildClient` target in the package `.csproj`), so Bun must be on PATH to pack. An ordinary `dotnet build` does not touch the client; pass `-p:BuildClient=true` to make it. A no-build pack fails if the client output is missing rather than shipping without it.
- The test site discovers static web asset *folders* only when it starts. If `wwwroot/App_Plugins/UmbracoRichDictionary` didn't exist when the site started (e.g. a fresh clone), restart it after the first client build. After that, new or rehashed chunks are served straight away. C# changes always need a restart.
- `src/api` is generated code and is committed, so the client builds without a running site. Regenerate it after any change to a controller or response model; never hand-edit it.

## Layout

- `src/Umbraco.RichDictionary`: the NuGet package, a Razor Class Library. C# is organised by feature (`Configuration/`, ...). `Api/` holds the shared Management API plumbing: the base controller, which routes to `/umbraco/umbracorichdictionary/api/v1/...`, requires the `TreeAccessDictionary` policy, and has its own Swagger doc with short operation ids.
- `src/Umbraco.RichDictionary/Client`: the Lit/TS back-office client. `umbraco-package.json` loads `bundle.manifests.ts`, which spreads each feature folder's `manifests` array. `entrypoints/` excludes the core view we replace and configures the generated API client with the back-office auth token. `@umbraco-cms/*` is external at build time because the back-office provides it at runtime.
  - `dictionary-editor/`: our replacement for the core `Umb.WorkspaceView.Dictionary.Edit` view. `workspace-view.element.ts` is a port of the core view: one field per language, the same user-language read-only rules, and writes through the core `UMB_DICTIONARY_WORKSPACE_CONTEXT.setPropertyValue`. `translation-input.element.ts` is the single seam that picks the editor (core `umb-input-tiptap`, `umb-input-markdown`, or `uui-textarea`).
  - `configuration/editor-mode.ts`: fetches the editor mode once per session. Anything other than `"Rte"`/`"Markdown"` (including a failed request) falls back to a plain textarea, so a problem can never re-save values in the wrong format.
- `src/Umbraco.RichDictionary/DictionaryHtml`: `IDictionaryHtmlConverter` turns a stored value into HTML for the configured mode, then runs it through Umbraco's `IHtmlSanitizer` (a no-op unless the site registers one). The extension methods live in the `Umbraco.Extensions` namespace, which Umbraco's default `_ViewImports.cshtml` already imports: `@Umbraco.GetDictionaryHtml(key[, culture])` / `GetDictionaryInlineHtml` (unwraps a single `<p>` for links and buttons), plus `ICultureDictionary.GetHtml` / `GetInlineHtml`. They resolve the converter through `StaticServiceProvider`, so their tests run in a non-parallel xUnit collection. Markdig is referenced with a 0.41.0 floor so NuGet unifies it with the copy Umbraco 17.x ships (0.45.0 in 17.7).
- `src/Umbraco.RichDictionary.TestSite`: an Umbraco 17.7.0 site on SQLite that references the package project. It exists only for development. Its runtime state (`umbraco/`) is gitignored. Umbraco writes an `Imaging:HMACSecretKey` into its `appsettings.json` on first boot. `Views/testPage.cshtml` is a development page: it shows every dictionary item in every language, comparing core `GetDictionaryValue` with `GetDictionaryHtml`. Its `testPage` document type and the published root node exist only in the local database, so a fresh database needs them created again (in the back-office: a document type allowed at root, with the `Test Page` template as its default).
- `tests/Umbraco.RichDictionary.Tests`: xUnit + NSubstitute, with folders that mirror the package's feature folders. It pins Umbraco 17.7.0.

Version policy: the package references Umbraco as `[17.0.0, 18.0.0)` so that any 17.x site can install it. The test site and tests pin the version we develop against. `NuGetAuditMode=direct` on the package project stops the transitive packages resolved at the 17.0.0 floor from producing audit noise.

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

- **Hiding the core view:** the entry point calls `extensionRegistry.exclude("Umb.WorkspaceView.Dictionary.Edit")`. Don't use CSS or permission hacks. If an Umbraco upgrade renames that alias, both views will render, so check it against the installed client when upgrading.
- **No phantom edits:** opening an item must not dirty the workspace, or Umbraco prompts "discard changes?" on navigation. Tiptap receives legacy values as its initial `content` (no update event), and `translation-input` only dispatches `change` on user edits. See that file for the empty-editor (`<p></p>` vs `""`) loop guard.
- **Management API JSON:** our base controller must carry `[JsonOptionsName(Constants.JsonOptionsNames.BackOffice)]`. Without it, enums serialise as numbers while Swagger (and so `src/api`) promises strings.
- **Plain-text legacy values: one rule, implemented twice.** `dictionary-editor/tiptap-content.ts` (client) and `DictionaryHtmlConverter` (server) must agree, so a value renders the same in the editor and on the site. A value containing HTML markup (a tag or a character reference) passes through. Anything else is text: escape only `& < >`, turn blank lines into paragraphs and newlines into `<br>`. Their test cases mirror each other; change both together. In Markdown mode the editor shows values raw, and the server renders a single newline as `<br>`.
- **Sanitising (decided):** output is not sanitised by the package itself. It goes through Umbraco's `IHtmlSanitizer`, matching how Umbraco treats rich text written by back-office users.
- **Language fallback:** the helpers read through `UmbracoHelper.GetDictionaryValue`, so they inherit core behaviour: a missing translation is empty, and language fallback is not applied.
- **Switching modes on a site that already has data.** Changing `Rte` <-> `Markdown` after values have been saved leaves content in the other format. Decide whether that is detected, converted on read, or just documented.
- **Markdown parsing:** check what Umbraco 17 already references (e.g. for its own Markdown property editor) before adding a parser package. Tiptap is already part of the Umbraco 17 backoffice, so re-use the core Tiptap editor element or extensions instead of bundling a separate copy. `@umbraco-cms/backoffice` 17.7 also lists `marked` and `dompurify` among its peer dependencies, so client-side Markdown preview and sanitising don't need new packages.

## Architecture preferences

- Organise both the C# and Lit code by feature (vertical slices), not by technical layer.
- Keep the editor choice behind one seam: the section, tree and workspace shouldn't know which editor mode is active.
