# ADR 0009: Take the Tiptap toolbar from a rich text data type, read on the server

- Status: Accepted
- Date: 2026-09-30
- Issue: #9

## Context

Sites want to choose the rich text buttons in the dictionary, and they already design toolbars
in rich text data types. The client could read a data type through the core
`GET /data-type/{id}` endpoint, but that needs the
`TreeAccessDocumentsOrMediaOrMembersOrContentTypes` policy, which Umbraco's default Translators
group (Translation section only) does not have.

## Decision

- The `RichDictionary:RichTextDataType` setting names a rich text data type, by key or name.
- The package's configuration endpoint reads that data type on the server through
  `IDataTypeService` and returns its raw Tiptap `extensions` and `toolbar`.
- The client (`dictionary-editor/tiptap-toolbar.ts`) always drops media, block and embed tools,
  and any alias that is not registered as the right kind of extension, with a console warning. It
  falls back to the built-in toolbar when nothing usable is left, or when the setting does not
  match a rich text data type (the server logs a warning then).
- Without the setting, a built-in toolbar for short copy is used.

## Consequences

- A site can point the dictionary at its main rich text data type without media buttons
  appearing.
- The data type's other settings (stylesheets, dimensions, blocks, media) are not used.
