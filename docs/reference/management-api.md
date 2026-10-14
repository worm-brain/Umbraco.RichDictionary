# Management API

## The declared value format

The package declares the format it stores dictionary values in, so a tool that works with the
site through the Management API can tell whether they hold HTML or Markdown.
`GET /umbraco/management/api/v1/manifest/manifest` includes this extension:

```json
{
  "type": "umbracoCli",
  "alias": "Umbraco.Community.RichDictionary.Cli",
  "name": "Rich Dictionary",
  "meta": { "dictionaryValueFormat": "html" }
}
```

- `dictionaryValueFormat` is `html` in `Rte` mode, including an unrecognised `EditorMode`, and
  `markdown` in `Markdown` mode.
- It comes in its own manifest entry, next to the one from `umbraco-package.json`, with the same
  package id and version. The entry has no name, so it does not show up as a second package in
  **Packages > Installed**.
- Umbraco caches manifests. In the `Production` runtime mode, a change to `EditorMode` reaches
  these tools only after a restart. In the other runtime modes it takes up to 10 seconds.

## The configuration endpoint

The backoffice reads the package's configuration from one endpoint of its own:

| Method | Path | Returns |
| --- | --- | --- |
| `GET` | `/umbraco/umbracorichdictionary/api/v1/configuration` | `editorMode` (`Rte` or `Markdown`), `richTextDataType` (the setting, or null) and `richTextEditor` (the data type's key, Tiptap extensions and toolbar, or null) |

It needs the same permission as the core dictionary tree, access to the **Translation** section.
Its API document is `umbracorichdictionary`: on Umbraco 17 at
`/umbraco/swagger/umbracorichdictionary/swagger.json`, and on Umbraco 18 at
`/umbraco/openapi/umbracorichdictionary.json`.

## Related

- [Configuration](configuration.md)
- [What the package changes](../explanation/what-the-package-changes.md)
