# What the package changes

## One screen

The package replaces the plain textareas on a dictionary item's edit screen, and nothing else.
The **Translation** section stays as Umbraco ships it: the tree, create, move, delete, import,
export, search and permissions are all core. The edit screen keeps its label, tab and address,
so links and bookmarks keep working.

In `Rte` mode each language gets Umbraco's own Tiptap rich text editor. In `Markdown` mode each
language gets Umbraco's Markdown editor.

## Where values are stored

Values stay in Umbraco's own dictionary storage, as plain strings: HTML in `Rte` mode, Markdown in
`Markdown` mode. There are no migrations, no custom tables and no rewriting of existing values on
install.

So installing onto a dictionary full of values just works: existing plain-text values open in the
rich editor as paragraphs, and your existing `GetDictionaryValue` calls keep returning the stored
string. Uninstalling brings back the stock editor, with nothing in the database to clean up.

## Permissions and languages

The package uses the core Translation section permissions. There is nothing extra to grant.

- A user whose groups grant only some languages can edit those languages. The other languages are
  shown read-only.
- Such users can save. The package sends only the languages they may edit, and the others keep
  their stored values. The stock editor sends every language, so Umbraco refuses the whole save.

## Missing translations

A missing translation renders as empty, and no language fallback is applied. This is the same as
Umbraco's `GetDictionaryValue`.

## Related

- [How values are converted](how-values-are-converted.md)
- [Uninstall the package](../how-to/uninstall.md)
- [ADR 0001: Replace only the core dictionary edit view](../adr/0001-replace-only-the-dictionary-edit-view.md)
- [ADR 0007: Save only the languages the user may edit](../adr/0007-save-only-editable-languages.md)
