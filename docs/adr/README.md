# Architecture decision records

One file per decision, numbered in order, never renumbered. A superseded ADR stays in place with
`Status: Superseded by NNNN`.

Write a new ADR when a decision changes a contract, a dependency, a supported version, or
something an earlier ADR decided.

| ADR | Decision | Status |
| --- | --- | --- |
| [0001](0001-replace-only-the-dictionary-edit-view.md) | Replace only the core dictionary edit view | Accepted |
| [0002](0002-keep-values-in-umbracos-dictionary.md) | Keep values in Umbraco's own dictionary storage | Accepted |
| [0003](0003-reuse-umbracos-editors-and-markdown-library.md) | Re-use Umbraco's editors and Markdown library | Accepted |
| [0004](0004-one-rule-for-plain-text-values.md) | One rule for plain-text values, on the client and the server | Accepted |
| [0005](0005-do-not-sanitise-in-the-package.md) | Do not sanitise output in the package | Accepted |
| [0006](0006-one-editor-mode-per-site.md) | One editor mode per site, from optional configuration | Accepted |
| [0007](0007-save-only-editable-languages.md) | Save only the languages the user may edit | Accepted |
| [0008](0008-detect-values-in-the-other-format.md) | Detect, do not convert, values in the other mode's format | Accepted |
| [0009](0009-toolbar-from-a-rich-text-data-type.md) | Take the Tiptap toolbar from a rich text data type, read on the server | Accepted |
| [0010](0010-declare-the-value-format.md) | Declare the stored value format in the package manifest | Accepted |
| [0011](0011-support-every-umbraco-17-release.md) | Support every Umbraco 17 release from 17.0.0 | Accepted |
| [0012](0012-smoke-test-the-packed-package.md) | Smoke-test the packed package before every release | Accepted |
| [0013](0013-community-name-keeping-user-facing-names.md) | Use the Umbraco.Community.RichDictionary name, keeping user-facing names | Accepted |
| [0014](0014-one-package-per-umbraco-major.md) | Build one package per Umbraco major | Accepted |
| [0015](0015-e2e-suite-with-plain-playwright.md) | Run the e2e suite with plain Playwright, one test at a time | Accepted |
