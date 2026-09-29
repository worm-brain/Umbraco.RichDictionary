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
