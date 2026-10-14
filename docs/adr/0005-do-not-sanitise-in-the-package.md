# ADR 0005: Do not sanitise output in the package

- Status: Accepted
- Date: 2026-09-29

## Context

The HTML helpers output stored values as raw HTML. Dictionary values are written by backoffice
users, whom Umbraco already trusts to write raw HTML into rich text properties. Umbraco offers one
hook for sites that want to sanitise that HTML: `IHtmlSanitizer`, a no-op by default.

## Decision

- The package does not sanitise HTML itself.
- Every helper passes its output through Umbraco's `IHtmlSanitizer`, the same hook Umbraco uses
  for rich text. A site that registers a sanitiser gets its dictionary HTML sanitised too.

## Consequences

- Dictionary HTML is treated exactly like rich text HTML, with no second policy to configure.
- On a default site the output is not sanitised. The
  [sanitising guide](../how-to/sanitise-the-output.md) shows how to register a sanitiser.
