# Render values as HTML

`GetDictionaryValue` still returns the raw stored string. To render a value as HTML, use the
package's helpers. They are in the `Umbraco.Extensions` namespace, which the default
`_ViewImports.cshtml` already imports, so no `@using` is needed.

Each helper returns `IHtmlContent`, so Razor outputs it without encoding it again. A missing item
or translation gives empty output.

## Where paragraphs are allowed

Use `GetDictionaryHtml`. It returns one or more block elements, usually `<p>`.

```cshtml
<address>@Umbraco.GetDictionaryHtml("Footer.Address")</address>
```

## Inside a link, a button or a heading

Use `GetDictionaryInlineHtml`. When the value is a single paragraph, its `<p>` wrapper is removed.
A value with several paragraphs is returned unchanged.

```cshtml
<a href="/">@Umbraco.GetDictionaryInlineHtml("Nav.Home")</a>
```

## For a specific culture

Pass the culture as the second argument:

```cshtml
@Umbraco.GetDictionaryHtml("Footer.Address", new System.Globalization.CultureInfo("da-DK"))
```

## From a culture dictionary

In code that already has an `ICultureDictionary` instead of an `UmbracoHelper`, use `GetHtml` and
`GetInlineHtml`. The dictionary's own culture is used.

```cshtml
@{
    var dictionary = Umbraco.CultureDictionary;
}
<h2>@dictionary.GetInlineHtml("Home.Title")</h2>
@dictionary.GetHtml("Home.Intro")
```

Outside views, get a culture dictionary from `ICultureDictionaryFactory.CreateDictionary()`.

## Anywhere else

Inject `IDictionaryHtmlConverter` where there is no `UmbracoHelper`, such as a view component, a
controller or an email template. It converts a value you have already read.

```csharp
using Microsoft.AspNetCore.Html;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Cms.Core.Dictionary;
using Umbraco.Community.RichDictionary.DictionaryHtml;

public class FooterViewComponent(
    ICultureDictionaryFactory dictionaryFactory,
    IDictionaryHtmlConverter converter) : ViewComponent
{
    public IViewComponentResult Invoke()
    {
        var value = dictionaryFactory.CreateDictionary()["Footer.Address"];
        IHtmlContent html = converter.ToHtml(value);
        return View(html);
    }
}
```

## Related

- [HTML helpers](../reference/html-helpers.md)
- [How values are converted](../explanation/how-values-are-converted.md)
- [Sanitise the output](sanitise-the-output.md)
