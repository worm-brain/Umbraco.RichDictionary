# Umbraco.RichDictionary

A drop-in replacement for the Umbraco 17 **Translation** section that edits dictionary values with a rich text (Tiptap) or Markdown editor instead of a plain textarea.

- Uses Umbraco's own dictionary storage. There are no migrations or custom tables, and uninstalling brings the stock Translation section back.
- Existing dictionary APIs keep working. The package adds optional helpers that return the stored value as HTML.

> Status: early scaffold. The replacement section is not built yet.

## Configuration

```json
{
  "RichDictionary": {
    "EditorMode": "Rte"
  }
}
```

`EditorMode` is `Rte` (Tiptap, stores HTML; the default) or `Markdown` (stores Markdown).

### Rich text toolbar

In `Rte` mode the editor has a built-in toolbar for short copy: bold, italic, underline, strike, sub/superscript, lists, links, clear formatting, undo/redo and source view. To choose your own, create a rich text data type in **Settings > Data Types**, design its toolbar there, and point the package at it by key or by name:

```json
{
  "RichDictionary": {
    "EditorMode": "Rte",
    "RichTextDataType": "Dictionary Rich Text"
  }
}
```

The dictionary editor then uses that data type's Tiptap extensions and toolbar. Its other settings (stylesheets, dimensions, blocks, media) are not used. Media, blocks and embeds don't belong in dictionary values, so these are always removed: the `Umb.Tiptap.Image`, `Umb.Tiptap.MediaUpload`, `Umb.Tiptap.Figure`, `Umb.Tiptap.Embed` and `Umb.Tiptap.Block` extensions, and the Media picker, Embedded media and Block picker toolbar buttons.

If the setting doesn't match a rich text data type, the server logs a warning and the built-in toolbar is used. Unknown toolbar items or extensions are skipped with a warning in the browser console. If no buttons are left, the built-in toolbar is used.

## Development

Requires the .NET 10 SDK and [Bun](https://bun.sh).

```sh
# Client (from src/Umbraco.RichDictionary/Client)
bun install
bun run build       # builds into ../wwwroot/App_Plugins/UmbracoRichDictionary
bun run watch       # rebuilds on change

# Test site (from the repo root)
dotnet run --project src/Umbraco.RichDictionary.TestSite
```

The test site installs itself unattended on first run, using SQLite. It runs at https://localhost:44336/umbraco; log in with `admin@example.com` / `1234567890`.
