# ADR 0006: One editor mode per site, from optional configuration

- Status: Accepted
- Date: 2026-09-30
- Issue: #11

## Context

Some sites want rich text in their dictionary, others want Markdown. A value's format has to be
known to render it, and the dictionary stores only a string. Per-item or per-language modes would
need somewhere to store the choice, which [ADR 0002](0002-keep-values-in-umbracos-dictionary.md)
rules out.

## Decision

- The `RichDictionary:EditorMode` setting picks the editor for the whole site: `Rte` (the Tiptap
  rich text editor, storing HTML) or `Markdown` (the Markdown editor, storing Markdown).
- The whole `RichDictionary` section is optional. Without it the site runs in `Rte` mode.
- An unrecognised `EditorMode` does not stop the site. It binds as `Rte` (a `TypeConverter` on the
  enum), and one warning at startup names the bad value. Names are matched case-insensitively;
  numbers are rejected.
- The backoffice reads the mode from the package's configuration endpoint, and the HTML helpers
  read the same bound options, so the two always agree.
- If the client cannot read the configuration, or gets a mode it does not know, it falls back to a
  plain textarea, so a problem can never save a value in the wrong format.
- The package ships a JSON schema for the section (`appsettings-schema.Umbraco.Community.RichDictionary.json`),
  which Umbraco's build adds to the site's `appsettings-schema.json`. New settings go in the schema
  as well as in `RichDictionaryOptions`.

## Consequences

- One setting, and the whole site follows it. Changing it later leaves values in the old format
  ([ADR 0008](0008-detect-values-in-the-other-format.md)).
- Umbraco only ever adds schema references: after an uninstall the copied schema file and its
  `$ref` stay in the site until someone deletes them.
