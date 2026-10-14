# Configuration

Everything is optional. Without a `RichDictionary` section in `appsettings.json` the package runs
with the defaults below. Add the section only to change them:

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
| `EditorMode` | `Rte`: the Tiptap rich text editor, which stores HTML. `Markdown`: the Markdown editor, which stores Markdown. | `Rte` |
| `RichTextDataType` | The key (a GUID) or the name of a rich text data type whose toolbar and extensions the editor uses in `Rte` mode. | The built-in toolbar |

## `EditorMode`

- Set it once per site, before editors start saving values. See
  [Choose the editor mode](../how-to/choose-the-editor-mode.md).
- Names are not case-sensitive. Numbers are rejected.
- An unrecognised value does not stop the site. It falls back to `Rte`, and a warning naming the
  value is logged at startup.

## `RichTextDataType`

- Used in `Rte` mode only.
- Media, block and embed extensions and buttons are always left out.
- A value that does not match a rich text data type logs a warning, and the built-in toolbar is
  used. See [Customise the toolbar](../how-to/customise-the-toolbar.md).

## When changes take effect

- The backoffice reads the configuration once per session. After changing a setting, reload the
  backoffice.
- The HTML helpers and the package's configuration endpoint read the current value on each call.
- Management API clients read the value format from Umbraco's manifests, which Umbraco caches. In
  the `Production` runtime mode they see a change to `EditorMode` only after a restart. In the
  other runtime modes it takes up to 10 seconds.

## Schema

The package adds a JSON schema for the section to your site's `appsettings-schema.json` on build,
so both settings get IntelliSense and validation in your editor.

## Related

- [Choose the editor mode](../how-to/choose-the-editor-mode.md)
- [Customise the toolbar](../how-to/customise-the-toolbar.md)
