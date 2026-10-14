# Umbraco Rich Dictionary

Edit Umbraco dictionary values with a rich text (Tiptap) or Markdown editor instead of a plain
textarea. The package drops into Umbraco's own Translation section: install it and every
dictionary item opens in Umbraco's rich text editor, with no configuration and no change to where
values are stored. Format copy without writing HTML by hand, render it on the site with one helper
call, or switch the whole site to Markdown.

## Install

One package line per Umbraco major: `17.x` for Umbraco 17, `18.x` for Umbraco 18.

```sh
# Umbraco 17
dotnet add package Umbraco.Community.RichDictionary --version "17.*"

# Umbraco 18
dotnet add package Umbraco.Community.RichDictionary --version "18.*"
```

Without `--version`, the newest overall is the `18.x` line.

## Quick start

1. Install the package and restart the site.
2. Open **Translation** in the backoffice and open a dictionary item: each language now has a rich
   text editor.
3. Render a value as HTML in a view: `@Umbraco.GetDictionaryHtml("Footer.Address")`.

No configuration is needed. Set `RichDictionary:EditorMode` to `Markdown` to use Markdown instead.

## Features

- Umbraco's own Tiptap rich text editor for each language, or its Markdown editor.
- The toolbar of one of your rich text data types, if you want other buttons.
- Plain-text values saved before install open as paragraphs; nothing is migrated.
- `GetDictionaryHtml`, `GetDictionaryInlineHtml` and `IDictionaryHtmlConverter` render values as
  HTML, through Umbraco's `IHtmlSanitizer`.
- Translators with access to some languages can save.
- Only the edit screen changes; uninstalling brings the stock editor back.

## Documentation

- [README with screenshots](https://github.com/worm-brain/Umbraco.RichDictionary#readme)
- [Documentation](https://github.com/worm-brain/Umbraco.RichDictionary/blob/main/docs/index.md)
- [Configuration reference](https://github.com/worm-brain/Umbraco.RichDictionary/blob/main/docs/reference/configuration.md)
- [Changelog](https://github.com/worm-brain/Umbraco.RichDictionary/blob/main/CHANGELOG.md)

## Support and licence

Questions and bugs: [GitHub issues](https://github.com/worm-brain/Umbraco.RichDictionary/issues).
MIT licence.
