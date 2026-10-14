# ADR 0003: Re-use Umbraco's editors and Markdown library

- Status: Accepted
- Date: 2026-09-29

## Context

The rich editor, the Markdown editor and a Markdown parser could each be bundled into the
package. The Umbraco 17 backoffice already ships a Tiptap rich text editor (`umb-input-tiptap`)
and a Markdown editor (`umb-input-markdown`), and Umbraco itself references Markdig on the server.
`@umbraco-cms/backoffice` also lists `marked` and `dompurify` among its peer dependencies.

## Decision

- The editors are the core `umb-input-tiptap` and `umb-input-markdown` elements, configured by the
  package. `translation-input.element.ts` is the single place that picks one.
- The server renders Markdown with Markdig, referenced with a floor so NuGet unifies it with the
  copy Umbraco ships ([ADR 0011](0011-support-every-umbraco-17-release.md)).
- `@umbraco-cms/*` is external at build time: the backoffice provides it at runtime.
- Check what Umbraco already references before adding a package for anything the editors or the
  rendering need.

## Consequences

- The editors look and behave like the rest of the backoffice, and the client bundle stays small.
- Umbraco's own editor changes reach the package with each Umbraco update, which is why the
  component tests run against the real core editors.
