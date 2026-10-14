# Write and render your first rich value

In this tutorial you format a dictionary value in the backoffice and show it on a page as HTML.
It takes about five minutes on a site with the package installed (see the
[README](../../README.md#install)).

## 1. Write the value

1. Sign in to the backoffice as a user with access to the **Translation** section.
2. Open **Translation**. On the **Dictionary** overview, choose **Create**.
3. Name the item `Footer.Address`.
4. In the field for your default language, choose **Bold**, type `Acme Ltd`, and choose **Bold**
   again.
5. Press Enter and type `1 High Street, London`.
6. Choose **Save**.

The editor is Umbraco's own rich text editor, with a toolbar for short copy. The value is stored
in Umbraco's dictionary as HTML:
`<p><strong>Acme Ltd</strong></p><p>1 High Street, London</p>`.

## 2. Show it on a page

Open the template or partial view where the address belongs and add:

```cshtml
<address>@Umbraco.GetDictionaryHtml("Footer.Address")</address>
```

No `@using` is needed: the helper is in the `Umbraco.Extensions` namespace, which the default
`_ViewImports.cshtml` already imports.

## 3. Check the result

Load the page. The address shows as two paragraphs, with the company name in bold. The page source
holds the stored HTML, not escaped markup.

`@Umbraco.GetDictionaryValue("Footer.Address")` still returns the raw stored string, so existing
views keep working until you switch them to the HTML helpers.

## Next steps

- [Render values as HTML](../how-to/render-values-as-html.md): inline values for links and
  buttons, other cultures, and code outside views.
- [Choose the editor mode](../how-to/choose-the-editor-mode.md): use Markdown instead.

## Related

- [HTML helpers](../reference/html-helpers.md)
- [How values are converted](../explanation/how-values-are-converted.md)
