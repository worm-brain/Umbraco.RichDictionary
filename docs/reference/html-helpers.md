# HTML helpers

The helpers turn a stored dictionary value into HTML for the site's editor mode. All of them
return `IHtmlContent`, and all of them give empty output for a missing item or translation. Their
output goes through Umbraco's `IHtmlSanitizer`.

## `UmbracoHelper` extensions

In the `Umbraco.Extensions` namespace.

| Helper | Returns |
| --- | --- |
| `GetDictionaryHtml(string key)` | The value for the current culture as block HTML, such as one or more `<p>` elements. |
| `GetDictionaryHtml(string key, CultureInfo culture)` | The value for `culture` as block HTML. |
| `GetDictionaryInlineHtml(string key)` | The value for the current culture as inline HTML: a single paragraph loses its `<p>` wrapper; several paragraphs are returned unchanged. |
| `GetDictionaryInlineHtml(string key, CultureInfo culture)` | The value for `culture` as inline HTML. |

The current culture is the current UI culture, as for Umbraco's own `GetDictionaryValue(key)`.

## `ICultureDictionary` extensions

In the `Umbraco.Extensions` namespace. They use the dictionary's own culture.

| Helper | Returns |
| --- | --- |
| `GetHtml(string key)` | The value as block HTML. |
| `GetInlineHtml(string key)` | The value as inline HTML. |

## `IDictionaryHtmlConverter`

In the `Umbraco.Community.RichDictionary.DictionaryHtml` namespace, registered in dependency
injection. It converts a value you have already read.

| Member | Returns |
| --- | --- |
| `IHtmlContent ToHtml(string? value)` | Block HTML. |
| `IHtmlContent ToInlineHtml(string? value)` | Inline HTML, as `GetDictionaryInlineHtml`. |

## Related

- [Render values as HTML](../how-to/render-values-as-html.md)
- [How values are converted](../explanation/how-values-are-converted.md)
