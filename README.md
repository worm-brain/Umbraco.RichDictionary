![Umbraco RichDictionary logo](https://raw.githubusercontent.com/worm-brain/Umbraco.RichDictionary/main/docs/images/logo.svg)

# Umbraco.Community.RichDictionary

Edit Umbraco dictionary values with a rich text (Tiptap) or Markdown editor instead of a plain textarea.

The **Translation** section stays exactly as Umbraco ships it: the tree, create, move, delete, import, export, search and permissions are all core. The package only replaces the plain textareas on a dictionary item's edit screen. Values stay in Umbraco's own dictionary storage as plain strings, so there are no migrations or custom tables, and your existing `GetDictionaryValue` calls keep working.

## Screenshots

**`Rte` mode** (the default): each language gets Umbraco's own Tiptap rich text editor.

![A dictionary item in Rte mode, with a Tiptap rich text editor for each language](https://raw.githubusercontent.com/worm-brain/Umbraco.RichDictionary/main/docs/images/editor-rte.png)

**`Markdown` mode**: each language gets Umbraco's Markdown editor.

![A dictionary item in Markdown mode, with a Markdown editor for each language](https://raw.githubusercontent.com/worm-brain/Umbraco.RichDictionary/main/docs/images/editor-markdown.png)

## Requirements

- Umbraco 17.x (.NET 10). Tested on fresh 17.0.0 and 17.7.0 sites.

## Install

```sh
dotnet add package Umbraco.Community.RichDictionary
```

Restart the site. No configuration is needed: dictionary items now open in the rich text editor, and existing plain-text values show up in it as paragraphs.

## Configuration

Everything is optional. Add a `RichDictionary` section to `appsettings.json` only to change the defaults:

```json
{
  "RichDictionary": {
    "EditorMode": "Rte",
    "RichTextDataType": "Dictionary Rich Text"
  }
}
```

| Setting | Values | Default |
| --- | --- | --- |
| `EditorMode` | `Rte`: Tiptap rich text editor, stores HTML. `Markdown`: Markdown editor, stores Markdown. | `Rte` |
| `RichTextDataType` | Key (GUID) or name of a rich text data type whose toolbar the editor uses in `Rte` mode. | Built-in toolbar |

- Choose `EditorMode` once per site, before editors start saving values. See [Switching editor mode](#switching-editor-mode).
- An unrecognised `EditorMode` (a typo such as `"RTE2"`) does not stop the site. It falls back to `Rte` and logs a warning at startup. Names are not case-sensitive.
- The package adds a JSON schema to your site's `appsettings-schema.json` on build, so both settings get IntelliSense and validation in your editor.
- The back-office reads the configuration once per session. After changing a setting, reload the back-office.

### Rich text toolbar

In `Rte` mode the editor has a built-in toolbar for short copy: bold, italic, underline, strike, subscript and superscript, bullet and numbered lists, links, clear formatting, undo/redo and source view.

To choose your own buttons, create a rich text data type in **Settings > Data Types**, design its toolbar there, and set `RichTextDataType` to its key or name. The dictionary editor then uses that data type's Tiptap extensions and toolbar. Its other settings (stylesheets, dimensions, blocks, media) are not used.

Media, blocks and embeds don't belong in dictionary values, so these are always removed, even if the data type has them:

- Extensions: `Umb.Tiptap.Image`, `Umb.Tiptap.MediaUpload`, `Umb.Tiptap.Figure`, `Umb.Tiptap.Embed`, `Umb.Tiptap.Block`
- Toolbar buttons: Media picker, Embedded media, Block picker

This means you can point it at your site's main rich text data type without media buttons appearing.

If the setting doesn't match a rich text data type, the server logs a warning and the built-in toolbar is used. Unknown toolbar items or extensions are skipped with a warning in the browser console. If no buttons are left, the built-in toolbar is used.

## Rendering values as HTML

`GetDictionaryValue` still returns the raw stored string. To render it as HTML, use the helpers below. They are in the `Umbraco.Extensions` namespace, which the default `_ViewImports.cshtml` already imports, so no `@using` is needed.

Each helper returns `IHtmlContent`, so Razor outputs it without encoding it again. A missing item or translation gives empty output.

### Block HTML: `GetDictionaryHtml`

Returns one or more block elements, usually `<p>`. Use it where paragraphs are allowed.

```cshtml
<address>@Umbraco.GetDictionaryHtml("Footer.Address")</address>

@* A specific culture *@
@Umbraco.GetDictionaryHtml("Footer.Address", new System.Globalization.CultureInfo("da-DK"))
```

### Inline HTML: `GetDictionaryInlineHtml`

Like `GetDictionaryHtml`, but when the value is a single paragraph its `<p>` wrapper is removed, so it can sit inside a link, a button or a heading. A value with several paragraphs is returned unchanged.

```cshtml
<a href="/">@Umbraco.GetDictionaryInlineHtml("Nav.Home")</a>

<button type="submit">@Umbraco.GetDictionaryInlineHtml("Form.Submit", new System.Globalization.CultureInfo("da-DK"))</button>
```

### From an `ICultureDictionary`: `GetHtml` and `GetInlineHtml`

For code that already has a culture dictionary instead of an `UmbracoHelper`. The dictionary's own culture is used.

```cshtml
@{
    var dictionary = Umbraco.CultureDictionary;
}
<h2>@dictionary.GetInlineHtml("Home.Title")</h2>
@dictionary.GetHtml("Home.Intro")
```

Outside views, get one from `ICultureDictionaryFactory.CreateDictionary()`.

### Anywhere else: inject `IDictionaryHtmlConverter`

The helpers use `Umbraco.RichDictionary.DictionaryHtml.IDictionaryHtmlConverter`, which is registered in DI. Inject it where there is no `UmbracoHelper`, such as a view component, a controller or an email template. It converts a value you have already read:

- `IHtmlContent ToHtml(string? value)`: block HTML.
- `IHtmlContent ToInlineHtml(string? value)`: inline HTML, as `GetDictionaryInlineHtml`.

```csharp
using Microsoft.AspNetCore.Html;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Cms.Core.Dictionary;
using Umbraco.RichDictionary.DictionaryHtml;

public class FooterViewComponent(
    ICultureDictionaryFactory dictionaryFactory,
    IDictionaryHtmlConverter converter) : ViewComponent
{
    public IViewComponentResult Invoke()
    {
        var value = dictionaryFactory.CreateDictionary()["Footer.Address"];
        IHtmlContent html = converter.ToHtml(value);
        return View(html);
    }
}
```

### How values are converted

**`Rte` mode**

- A value that already contains HTML markup (a tag such as `<p>`, or a character reference such as `&copy;`) is output as stored.
  Plain text that happens to contain something tag-like, such as `<leave>`, counts as HTML too: the editor drops a tag it doesn't know (so saving that field loses it), and the site outputs it as a raw element.
- Anything else is treated as plain text, such as values saved before the package was installed. `&`, `<` and `>` are escaped, blank lines become paragraphs, and single line breaks become `<br>`. The editor shows the value the same way, so it looks the same in the back-office and on the site.

**`Markdown` mode**

- Values are rendered with Markdig. A single line break becomes `<br>` rather than a space, so plain-text values such as addresses keep their lines.

### Sanitising

The package does not sanitise output itself. The HTML goes through Umbraco's `IHtmlSanitizer`, the same hook Umbraco uses for rich text. By default that does nothing, because back-office users are trusted to write HTML. To sanitise, implement `Umbraco.Cms.Core.Security.IHtmlSanitizer` and register it in a composer:

```csharp
builder.Services.AddUnique<IHtmlSanitizer, MyHtmlSanitizer>();
```

## Management API clients

The package declares the format it stores dictionary values in, so a tool that works with the site through the Management API can tell whether they hold HTML or Markdown. `GET /umbraco/management/api/v1/manifest/manifest` includes this extension:

```json
{
  "type": "umbracoCli",
  "alias": "Umbraco.RichDictionary.Cli",
  "name": "Rich Dictionary",
  "meta": { "dictionaryValueFormat": "html" }
}
```

- `dictionaryValueFormat` is `html` in `Rte` mode (including an unrecognised `EditorMode`) and `markdown` in `Markdown` mode.
- It comes in its own manifest entry, next to the one from `umbraco-package.json`, with the same package id and version. The entry has no name, so it doesn't show up as a second package in **Packages > Installed**.
- Umbraco caches manifests. In the `Production` runtime mode, a change to `EditorMode` reaches these tools only after a restart. In the other runtime modes it takes up to 10 seconds.

## Permissions

The package uses the core Translation section permissions. There is nothing extra to grant.

- A user whose groups grant only some languages can edit those languages. The other languages are shown read-only.
- Such users can save. The package sends only the languages they may edit, and the others keep their stored values. (The stock editor sends every language, so Umbraco refuses the whole save.)

## Caveats

### Switching editor mode

Changing `EditorMode` after values have been saved does not convert anything. Values saved in the other format stay as they are:

- In `Rte` mode, a Markdown value shows its syntax as plain text in the editor and on the site.
- In `Markdown` mode, an HTML value shows its tags as text in the editor. On the site, Markdown passes most HTML through, so it often still renders.

The editor shows a warning under a value that looks like it is in the other format. Check and fix those values before saving them.

### Missing translations

A missing translation renders as empty, and no language fallback is applied. This is the same as Umbraco's `GetDictionaryValue`.

### Uninstalling

Remove the package and restart. The stock Translation editor comes back, and there is nothing in the database to clean up. Afterwards:

- Values edited while the package was installed keep their HTML or Markdown markup. The stock textarea shows that markup as text.
- Views that call `GetDictionaryHtml`, `GetDictionaryInlineHtml`, `GetHtml` or `GetInlineHtml`, or inject `IDictionaryHtmlConverter`, stop compiling. With runtime Razor compilation (the development default) that shows up when the page is requested, not at build time. Switch them back to `GetDictionaryValue`.
- With central package management, `dotnet remove package` leaves the `PackageVersion` entry in `Directory.Packages.props`. It's harmless; delete it by hand.
- A leftover `RichDictionary` section in `appsettings.json` is ignored. Delete it when convenient.
- Umbraco does not remove the copied `appsettings-schema.Umbraco.RichDictionary.json` from your site, or its `$ref` in `appsettings-schema.json`. Delete both by hand.

## Contributing

Issues and pull requests are welcome at [github.com/worm-brain/Umbraco.RichDictionary](https://github.com/worm-brain/Umbraco.RichDictionary).

## Licence

[MIT](https://github.com/worm-brain/Umbraco.RichDictionary/blob/main/LICENSE)
