# Sanitise the output

The package does not sanitise the HTML its helpers output. It passes it through Umbraco's
`IHtmlSanitizer`, the same hook Umbraco uses for rich text. By default that hook does nothing,
because backoffice users are trusted to write HTML.

To sanitise dictionary HTML, and rich text with it:

1. Implement `Umbraco.Cms.Core.Security.IHtmlSanitizer`, for example with an HTML sanitiser
   library.
2. Register it in a composer:

   ```csharp
   using Umbraco.Cms.Core.Composing;
   using Umbraco.Cms.Core.DependencyInjection;
   using Umbraco.Cms.Core.Security;
   using Umbraco.Extensions;

   public class HtmlSanitizerComposer : IComposer
   {
       public void Compose(IUmbracoBuilder builder) =>
           builder.Services.AddUnique<IHtmlSanitizer, MyHtmlSanitizer>();
   }
   ```

3. Restart the site.

Every helper and `IDictionaryHtmlConverter` now return sanitised HTML.

## Related

- [How values are converted](../explanation/how-values-are-converted.md)
- [Render values as HTML](render-values-as-html.md)
