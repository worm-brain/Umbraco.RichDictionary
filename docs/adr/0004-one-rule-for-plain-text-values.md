# ADR 0004: One rule for plain-text values, on the client and the server

- Status: Accepted
- Date: 2026-09-29

## Context

A site that installs the package already has plain-text values, saved by the stock textarea. In
`Rte` mode the editor and the site's HTML helpers must both decide whether a value is HTML or
plain text. If they decided differently, a value would look one way in the backoffice and another
on the site.

## Decision

One rule, implemented twice:

- A value containing HTML markup (a tag or a character reference) is HTML and passes through.
- Anything else is plain text: only `&`, `<` and `>` are escaped, blank lines become paragraphs
  and single line breaks become `<br>`.

The client (`dictionary-editor/tiptap-content.ts`) and the server (`DictionaryHtmlConverter`)
apply it, and their test cases mirror each other.

In `Markdown` mode the editor shows values as stored, and the server renders a single line break
as `<br>` rather than a space, so plain-text values such as addresses keep their lines.

## Consequences

- A value renders the same in the editor and on the site.
- A change to the rule changes both implementations and both sets of tests together.
- Plain text that happens to contain something tag-like, such as `<leave>`, counts as HTML.
  [How values are converted](../explanation/how-values-are-converted.md) describes the effect.
