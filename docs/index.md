# Umbraco Rich Dictionary documentation

Umbraco Rich Dictionary lets you edit Umbraco dictionary values with a rich text or Markdown
editor instead of a plain textarea, on Umbraco 17 and 18. The pages below follow
[Diataxis](https://diataxis.fr/): pick the kind that matches what you are trying to do.

| If you want to... | Read |
| --- | --- |
| Try the package once, start to finish | [Tutorial](#tutorial) |
| Get one job done | [How-to guides](#how-to-guides) |
| Look up a setting, a helper or an endpoint | [Reference](#reference) |
| Understand how it works and why | [Explanation](#explanation) |

New here? Install the package (see the [README](../README.md#install)), then start with the
tutorial.

## Tutorial

- [Write and render your first rich value](tutorials/write-and-render-your-first-value.md): format
  a dictionary value in the backoffice and show it on a page as HTML.

## How-to guides

- [Choose the editor mode](how-to/choose-the-editor-mode.md): rich text or Markdown, and what to
  check when you change it.
- [Customise the toolbar](how-to/customise-the-toolbar.md): use the buttons of one of your rich
  text data types.
- [Render values as HTML](how-to/render-values-as-html.md): the view helpers and the converter.
- [Sanitise the output](how-to/sanitise-the-output.md): register an HTML sanitiser.
- [Uninstall the package](how-to/uninstall.md): what to remove and what stays.

## Reference

- [Configuration](reference/configuration.md): every `RichDictionary` setting and its default.
- [HTML helpers](reference/html-helpers.md): every helper and the converter interface.
- [Management API](reference/management-api.md): the declared value format and the package's own
  endpoint.

## Explanation

- [What the package changes](explanation/what-the-package-changes.md): what it replaces, where
  values are stored, permissions and languages.
- [How values are converted](explanation/how-values-are-converted.md): plain-text values, the two
  modes, and sanitising.

## Decisions

The [architecture decision records](adr/README.md) explain why the package is built the way it is.
