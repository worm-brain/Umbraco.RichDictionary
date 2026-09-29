using System.Globalization;
using Microsoft.AspNetCore.Html;
using Microsoft.Extensions.DependencyInjection;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Core.Dictionary;
using Umbraco.Cms.Web.Common;
using Umbraco.RichDictionary.DictionaryHtml;

// Umbraco's convention for extension methods: this namespace is imported by the default
// _ViewImports.cshtml, so the helpers work in views with no extra @using.
namespace Umbraco.Extensions;

/// <summary>
/// HTML counterparts of <c>UmbracoHelper.GetDictionaryValue</c>. Values are read through Umbraco's
/// own dictionary API and converted by <see cref="IDictionaryHtmlConverter"/>.
/// </summary>
public static class RichDictionaryUmbracoHelperExtensions
{
    /// <summary>
    /// Gets a dictionary value for the current culture as block HTML.
    /// </summary>
    /// <param name="umbraco">The Umbraco helper.</param>
    /// <param name="key">The dictionary item key, e.g. <c>Footer.Address</c>.</param>
    /// <returns>The HTML, or empty when the item or its translation doesn't exist.</returns>
    public static IHtmlContent GetDictionaryHtml(this UmbracoHelper umbraco, string key) =>
        DictionaryHtmlServices.Converter.ToHtml(umbraco.GetDictionaryValue(key));

    /// <summary>
    /// Gets a dictionary value for a specific culture as block HTML.
    /// </summary>
    /// <param name="umbraco">The Umbraco helper.</param>
    /// <param name="key">The dictionary item key, e.g. <c>Footer.Address</c>.</param>
    /// <param name="culture">The culture to read the translation for.</param>
    /// <returns>The HTML, or empty when the item or its translation doesn't exist.</returns>
    public static IHtmlContent GetDictionaryHtml(
        this UmbracoHelper umbraco,
        string key,
        CultureInfo culture
    ) => DictionaryHtmlServices.Converter.ToHtml(umbraco.GetDictionaryValue(key, culture));

    /// <summary>
    /// Gets a dictionary value for the current culture as inline HTML: a single paragraph loses its
    /// <c>&lt;p&gt;</c> wrapper, so it can sit inside a link, a button or a heading.
    /// </summary>
    /// <param name="umbraco">The Umbraco helper.</param>
    /// <param name="key">The dictionary item key, e.g. <c>Nav.Home</c>.</param>
    /// <returns>The HTML, or empty when the item or its translation doesn't exist.</returns>
    public static IHtmlContent GetDictionaryInlineHtml(this UmbracoHelper umbraco, string key) =>
        DictionaryHtmlServices.Converter.ToInlineHtml(umbraco.GetDictionaryValue(key));

    /// <summary>
    /// Gets a dictionary value for a specific culture as inline HTML; see
    /// <see cref="GetDictionaryInlineHtml(UmbracoHelper, string)"/>.
    /// </summary>
    /// <param name="umbraco">The Umbraco helper.</param>
    /// <param name="key">The dictionary item key, e.g. <c>Nav.Home</c>.</param>
    /// <param name="culture">The culture to read the translation for.</param>
    /// <returns>The HTML, or empty when the item or its translation doesn't exist.</returns>
    public static IHtmlContent GetDictionaryInlineHtml(
        this UmbracoHelper umbraco,
        string key,
        CultureInfo culture
    ) => DictionaryHtmlServices.Converter.ToInlineHtml(umbraco.GetDictionaryValue(key, culture));
}

/// <summary>
/// HTML counterparts of the <see cref="ICultureDictionary"/> indexer, for code that works with a
/// culture dictionary rather than an <c>UmbracoHelper</c>.
/// </summary>
public static class RichDictionaryCultureDictionaryExtensions
{
    /// <summary>
    /// Gets a dictionary value as block HTML.
    /// </summary>
    /// <param name="dictionary">The culture dictionary to read from.</param>
    /// <param name="key">The dictionary item key, e.g. <c>Footer.Address</c>.</param>
    /// <returns>The HTML, or empty when the item or its translation doesn't exist.</returns>
    public static IHtmlContent GetHtml(this ICultureDictionary dictionary, string key) =>
        DictionaryHtmlServices.Converter.ToHtml(dictionary[key]);

    /// <summary>
    /// Gets a dictionary value as inline HTML: a single paragraph loses its <c>&lt;p&gt;</c> wrapper.
    /// </summary>
    /// <param name="dictionary">The culture dictionary to read from.</param>
    /// <param name="key">The dictionary item key, e.g. <c>Nav.Home</c>.</param>
    /// <returns>The HTML, or empty when the item or its translation doesn't exist.</returns>
    public static IHtmlContent GetInlineHtml(this ICultureDictionary dictionary, string key) =>
        DictionaryHtmlServices.Converter.ToInlineHtml(dictionary[key]);
}

/// <summary>
/// Extension methods can't take constructor dependencies, so they resolve the converter from
/// Umbraco's static service provider, the pattern Umbraco's own extension methods use.
/// </summary>
internal static class DictionaryHtmlServices
{
    /// <summary>
    /// The registered converter.
    /// </summary>
    /// <exception cref="InvalidOperationException">The package's composers have not run.</exception>
    public static IDictionaryHtmlConverter Converter =>
        StaticServiceProvider.Instance.GetRequiredService<IDictionaryHtmlConverter>();
}
