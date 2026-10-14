# ADR 0008: Detect, do not convert, values in the other mode's format

- Status: Accepted
- Date: 2026-09-30
- Issue: #10

## Context

Changing `EditorMode` after values have been saved leaves those values in the other format.
Converting them automatically would rewrite stored data, which
[ADR 0002](0002-keep-values-in-umbracos-dictionary.md) rules out, and HTML to Markdown is lossy.

## Decision

- Values are never converted. The stored value is never changed by the package.
- The editor flags a value that clearly looks like the other format
  (`dictionary-editor/format-mismatch.ts`): Markdown such as `**bold**`, links or headings in `Rte`
  mode, and the editor's block-wrapped HTML in `Markdown` mode. It shows a warning under that
  field, which does not block saving.
- The heuristics are deliberately conservative, so ordinary text is not flagged.

## Consequences

- An editor sees which values need fixing by hand after a mode change.
- A "convert this value" action may come later as its own decision.
