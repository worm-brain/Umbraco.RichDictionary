# How values are converted

The HTML helpers render a stored value according to the site's editor mode. The editor applies
the same rules, so a value looks the same in the backoffice and on the site.

## `Rte` mode

- A value that already contains HTML markup, such as a tag (`<p>`) or a character reference
  (`&copy;`), is output as stored.
- Anything else is treated as plain text, such as a value saved before the package was installed.
  `&`, `<` and `>` are escaped, blank lines become paragraphs, and single line breaks become
  `<br>`.

Plain text that happens to contain something tag-like, such as `<leave>`, counts as HTML. The
editor drops a tag it does not know, so saving that field loses it, and the site outputs it as a
raw element.

## `Markdown` mode

Values are rendered with Markdig, which Umbraco also references. A single line break
becomes `<br>` rather than a space, so plain-text values such as addresses keep their lines.

The editor shows the Markdown as stored.

## Values in the other mode's format

Changing the editor mode does not convert values. A value saved in the other format renders by the
current mode's rules: Markdown syntax shows as text in `Rte` mode, and HTML mostly passes through
in `Markdown` mode. The editor warns about values that look like the other format; see
[Choose the editor mode](../how-to/choose-the-editor-mode.md).

## Sanitising

The package does not sanitise output itself. Every helper passes its HTML through Umbraco's
`IHtmlSanitizer`, the same hook Umbraco uses for rich text.

By default that hook does nothing. Dictionary values are written by backoffice users, whom
Umbraco already trusts to write HTML into rich text, so dictionary HTML gets the same treatment as
rich text. A site that registers a sanitiser gets both sanitised; see
[Sanitise the output](../how-to/sanitise-the-output.md).

## Related

- [HTML helpers](../reference/html-helpers.md)
- [ADR 0004: One rule for plain-text values](../adr/0004-one-rule-for-plain-text-values.md)
- [ADR 0005: Do not sanitise output in the package](../adr/0005-do-not-sanitise-in-the-package.md)
