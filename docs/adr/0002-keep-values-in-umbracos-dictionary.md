# ADR 0002: Keep values in Umbraco's own dictionary storage

- Status: Accepted
- Date: 2026-09-29

## Context

A rich value could live in a table of the package's own, next to the core translation. That would
need migrations, would split the truth between two places, and would leave data behind on
uninstall. Sites install the package onto dictionaries that already hold years of plain-text
values.

## Decision

- Values stay in Umbraco's own dictionary storage, as plain strings: HTML in `Rte` mode, Markdown
  in `Markdown` mode.
- No custom tables, no migrations, no schema changes, and no rewriting of existing values on
  install.
- Reads and writes go through Umbraco's existing Management API endpoints and services; the
  package does not fork the dictionary API.
- The developer-facing API is unchanged. `GetDictionaryValue` keeps returning the stored string;
  the package only adds optional helpers that render it as HTML.

## Consequences

- Installing onto a populated dictionary just works: existing plain-text values open in the rich
  editor ([ADR 0004](0004-one-rule-for-plain-text-values.md)).
- Uninstalling brings back the stock Translation editor with nothing to clean up. The only
  visible leftover is that values edited meanwhile contain HTML or Markdown markup.
- Any tool that reads the dictionary through Umbraco sees the stored HTML or Markdown, so the
  package declares which one it is ([ADR 0010](0010-declare-the-value-format.md)).
