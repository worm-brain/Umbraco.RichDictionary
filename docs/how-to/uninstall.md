# Uninstall the package

1. Remove the package:

   ```sh
   dotnet remove package Umbraco.Community.RichDictionary
   ```

2. Switch any views that call `GetDictionaryHtml`, `GetDictionaryInlineHtml`, `GetHtml` or
   `GetInlineHtml`, or that inject `IDictionaryHtmlConverter`, back to `GetDictionaryValue`.
3. Restart the site.

The stock Translation editor comes back, and there is nothing in the database to clean up.

## What stays behind

- Values edited while the package was installed keep their HTML or Markdown markup. The stock
  textarea shows that markup as text.
- With runtime Razor compilation, the development default, a view that still calls a helper fails
  when the page is requested, not at build time.
- With central package management, `dotnet remove package` leaves the `PackageVersion` entry in
  `Directory.Packages.props`. It is harmless; delete it by hand.
- A leftover `RichDictionary` section in `appsettings.json` is ignored. Delete it when convenient.
- Umbraco does not remove the copied `appsettings-schema.Umbraco.Community.RichDictionary.json`
  from your site, or its `$ref` in `appsettings-schema.json`. Delete both by hand.

## Related

- [What the package changes](../explanation/what-the-package-changes.md)
