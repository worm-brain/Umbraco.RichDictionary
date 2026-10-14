# Changelog

All notable user-visible changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

The first release of each package line: `17.0.0` for Umbraco 17 and `18.0.0` for Umbraco 18. The
package version now follows the Umbraco major, so `17.0.0` is the next version after `1.0.0`, and
it has breaking changes.

### Upgrading from 1.x

1. Install the line for your Umbraco major, for example
   `dotnet add package Umbraco.Community.RichDictionary --version "17.*"`.
2. In C# code that uses the package's types, such as `IDictionaryHtmlConverter`, change
   `using Umbraco.RichDictionary...` to `using Umbraco.Community.RichDictionary...`. Views that only
   call the HTML helpers need no change: the helpers are still in `Umbraco.Extensions`.
3. If anything refers to the package's extension aliases, for example code that excludes or
   overrides its edit view, or a tool that looks for `Umbraco.RichDictionary.Cli`, change
   `Umbraco.RichDictionary.*` to `Umbraco.Community.RichDictionary.*`.
4. If anything links to the package's static files, change `/App_Plugins/UmbracoRichDictionary/` to
   `/App_Plugins/UmbracoCommunityRichDictionary/`.
5. Delete the old `appsettings-schema.Umbraco.RichDictionary.json` from the site, and its `$ref` from
   `appsettings-schema.json`. Umbraco only ever adds schema references, so it does not remove them;
   the build adds the new `appsettings-schema.Umbraco.Community.RichDictionary.json`.

Configuration, stored values, the `umbracorichdictionary` API route and the HTML helpers are
unchanged.

### Added

- An Umbraco 18 package line, `18.x`, built from the same source as the Umbraco 17 line. It
  installs on every Umbraco 18 release from 18.0.0.

### Changed

- **Breaking:** versions follow the Umbraco major: `17.x` for Umbraco 17 and `18.x` for Umbraco 18.
- **Breaking:** the C# namespace is `Umbraco.Community.RichDictionary` instead of
  `Umbraco.RichDictionary`, matching the package id.
- **Breaking:** the backoffice files are served from `/App_Plugins/UmbracoCommunityRichDictionary/`
  instead of `/App_Plugins/UmbracoRichDictionary/`.
- **Breaking:** the manifest id is `Umbraco.Community.RichDictionary`, and the extension aliases are
  `Umbraco.Community.RichDictionary.Bundle`, `.Entrypoint`, `.WorkspaceView.Dictionary.Edit` and
  `.Cli`.
- **Breaking:** the appsettings schema file is `appsettings-schema.Umbraco.Community.RichDictionary.json`.
- The package shows as **Rich Dictionary** in **Packages > Installed**.
- The NuGet package has the title "Umbraco Rich Dictionary" and its own short readme.

## [1.0.0] - 2026-10-05

The first stable release, unchanged from `1.0.0-beta.2`.

## [1.0.0-beta.2] - 2026-10-01

### Added

- The package icon.

## [1.0.0-beta.1] - 2026-10-01

The first release, for Umbraco 17.

### Added

- Edit dictionary values with Umbraco's Tiptap rich text editor (`Rte` mode, the default) or its
  Markdown editor (`Markdown` mode), set by `RichDictionary:EditorMode`.
- Plain-text values saved before the package was installed open in the rich editor as paragraphs.
- `RichDictionary:RichTextDataType` uses the toolbar of one of your rich text data types.
- A warning under a value that looks like it is in the other mode's format.
- `GetDictionaryHtml`, `GetDictionaryInlineHtml`, `GetHtml`, `GetInlineHtml` and
  `IDictionaryHtmlConverter` render values as HTML, through Umbraco's `IHtmlSanitizer`.
- Users with access to some languages can save the languages they may edit.
- The package declares its value format to Management API clients in its manifest.
- A JSON schema for the `RichDictionary` settings.

