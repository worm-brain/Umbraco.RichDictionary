# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Status

Scaffolded, with no dictionary features yet. The only real slice is `Configuration`: the `RichDictionary:EditorMode` option, which is served to the client through our own Management API.

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

- Run `bun run build` before `dotnet pack`. The package serves the client from `wwwroot`, and nothing in MSBuild builds it for you.
- The test site discovers new static web assets only when it starts. After the *first* client build (or after adding new output files), restart the site.
- `src/api` is generated code and is committed, so the client builds without a running site. Regenerate it after any change to a controller or response model; never hand-edit it.

## Layout

- `src/Umbraco.RichDictionary`: the NuGet package, a Razor Class Library. C# is organised by feature (`Configuration/`, ...). `Api/` holds the shared Management API plumbing: the base controller, which routes to `/umbraco/umbracorichdictionary/api/v1/...`, requires the `TreeAccessDictionary` policy, and has its own Swagger doc with short operation ids.
- `src/Umbraco.RichDictionary/Client`: the Lit/TS back-office client. `umbraco-package.json` loads `bundle.manifests.ts`, which spreads each feature folder's `manifests` array. `entrypoints/` configures the generated API client with the back-office auth token. `@umbraco-cms/*` is external at build time because the back-office provides it at runtime.
- `src/Umbraco.RichDictionary.TestSite`: an Umbraco 17.7.0 site on SQLite that references the package project. It exists only for development. Its runtime state (`umbraco/`) is gitignored. Umbraco writes an `Imaging:HMACSecretKey` into its `appsettings.json` on first boot.
- `tests/Umbraco.RichDictionary.Tests`: xUnit + NSubstitute, with folders that mirror the package's feature folders. It pins Umbraco 17.7.0.

Version policy: the package references Umbraco as `[17.0.0, 18.0.0)` so that any 17.x site can install it. The test site and tests pin the version we develop against. `NuGetAuditMode=direct` on the package project stops the transitive packages resolved at the 17.0.0 floor from producing audit noise.

## What this is

Umbraco.RichDictionary is an **Umbraco 17** backoffice extension, shipped as a C# NuGet package plus a Lit/TypeScript client. It is a drop-in replacement for Umbraco's built-in **Translation** section (the Dictionary). It works the same way, but dictionary values are edited with a rich editor instead of a plain textarea.

- The built-in Translation section is removed from the backoffice UI, and ours replaces it with the same features: tree, create/edit/delete, per-language values, import/export, search.
- The editor can be configured as **`Rte`** (Tiptap) or **`Markdown`**, set once per site.
- The developer-facing API is unchanged. Existing Umbraco dictionary calls keep working. We only add *optional* extension methods that parse the stored value and return HTML.

## Hard constraints

- **No data changes.** Values stay in Umbraco's own dictionary storage as plain strings, holding HTML or Markdown depending on the configured mode. No custom tables, no migrations, no schema changes, and no re-writing of existing values on install.
- **Reversible.** Installing the package on a site with a fully populated dictionary must just work, with existing plain-text values displayed in the rich editor. Uninstalling must bring back the stock Translation section with nothing to clean up. The only visible leftover is that values edited while the package was installed now contain HTML/Markdown markup.
- **Don't fork the Umbraco API.** Use Umbraco's existing Management API endpoints and services for dictionary CRUD. Prefer re-using or extending core backoffice extensions (repositories, stores, workspace pieces) over re-implementing them. Only replace the parts needed to swap the value editor and hide the core section.

## Design notes and open questions

Things to settle as you build; record decisions here or as ADRs:

- **Hiding the core section:** use the backoffice extension registry's exclude mechanism on the core Translation section/dictionary manifests from our entry point. Don't use CSS or permission hacks. Check the real manifest aliases against the installed Umbraco 17 client.
- **Plain-text legacy values** have to render correctly in both modes and through the HTML helpers. Watch for newlines and for `<` and `&` in text that was never meant to be HTML.
- **Switching modes on a site that already has data.** Changing `Rte` <-> `Markdown` after values have been saved leaves content in the other format. Decide whether that is detected, converted on read, or just documented.
- **HTML output helpers:** add extension methods alongside the existing dictionary access points (e.g. `UmbracoHelper`/`ICultureDictionary`) that return `IHtmlContent`. Decide whether output is sanitised.
- **Markdown parsing:** check what Umbraco 17 already references (e.g. for its own Markdown property editor) before adding a parser package. Tiptap is already part of the Umbraco 17 backoffice, so re-use the core Tiptap editor element or extensions instead of bundling a separate copy. `@umbraco-cms/backoffice` 17.7 also lists `marked` and `dompurify` among its peer dependencies, so client-side Markdown preview and sanitising don't need new packages.

## Architecture preferences

- Organise both the C# and Lit code by feature (vertical slices), not by technical layer.
- Keep the editor choice behind one seam: the section, tree and workspace shouldn't know which editor mode is active.
