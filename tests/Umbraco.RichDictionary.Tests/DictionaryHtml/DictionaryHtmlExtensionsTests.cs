using System.Globalization;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using NSubstitute;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Core.Dictionary;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Core.Templates;
using Umbraco.Cms.Web.Common;
using Umbraco.Extensions;
using Umbraco.RichDictionary.Configuration;
using Umbraco.RichDictionary.DictionaryHtml;

namespace Umbraco.RichDictionary.Tests.DictionaryHtml;

/// <summary>
/// Serialises the tests that swap <see cref="StaticServiceProvider.Instance"/>, which is process-wide.
/// </summary>
[CollectionDefinition(Name, DisableParallelization = true)]
public sealed class StaticServiceProviderCollection
{
    public const string Name = "StaticServiceProvider";
}

[Collection(StaticServiceProviderCollection.Name)]
public sealed class DictionaryHtmlExtensionsTests : IDisposable
{
    private readonly IServiceProvider _previousProvider = StaticServiceProvider.Instance;

    public DictionaryHtmlExtensionsTests()
    {
        var options = Substitute.For<IOptionsMonitor<RichDictionaryOptions>>();
        options.CurrentValue.Returns(new RichDictionaryOptions { EditorMode = EditorMode.Rte });
        var sanitizer = Substitute.For<IHtmlSanitizer>();
        sanitizer.Sanitize(Arg.Any<string>()).Returns(call => call.Arg<string>());

        StaticServiceProvider.Instance = new ServiceCollection()
            .AddSingleton<IDictionaryHtmlConverter>(new DictionaryHtmlConverter(options, sanitizer))
            .BuildServiceProvider();
    }

    public void Dispose() => StaticServiceProvider.Instance = _previousProvider;

    /// <summary>A culture dictionary holding one translation; any other key returns "", as Umbraco's does.</summary>
    private static ICultureDictionary DictionaryWith(string key, string value)
    {
        var dictionary = Substitute.For<ICultureDictionary>();
        dictionary[Arg.Any<string>()].Returns(string.Empty);
        dictionary[key].Returns(value);
        return dictionary;
    }

    /// <summary>An <see cref="UmbracoHelper"/> whose dictionary lookups read from the given dictionaries.</summary>
    private static UmbracoHelper HelperWith(
        ICultureDictionary current,
        ICultureDictionary? specificCulture = null
    )
    {
        var factory = Substitute.For<ICultureDictionaryFactory>();
        factory.CreateDictionary().Returns(current);
        factory.CreateDictionary(Arg.Any<CultureInfo>()).Returns(specificCulture ?? current);
        return new UmbracoHelper(
            factory,
            Substitute.For<IUmbracoComponentRenderer>(),
            Substitute.For<IPublishedContentQuery>()
        );
    }

    [Fact]
    public void GetDictionaryHtml_WithPlainTextValue_ReturnsConvertedHtml()
    {
        // Arrange
        var umbraco = HelperWith(DictionaryWith("Footer.Address", "Acme Ltd\nLondon"));

        // Act
        var html = umbraco.GetDictionaryHtml("Footer.Address").ToString();

        // Assert
        Assert.Equal("<p>Acme Ltd<br>London</p>", html);
    }

    [Fact]
    public void GetDictionaryHtml_WithMissingKey_ReturnsEmpty()
    {
        // Arrange
        var umbraco = HelperWith(DictionaryWith("Footer.Address", "Acme Ltd"));

        // Act
        var html = umbraco.GetDictionaryHtml("Does.Not.Exist").ToString();

        // Assert
        Assert.Equal(string.Empty, html);
    }

    [Fact]
    public void GetDictionaryHtml_WithCulture_ReadsThatCulture()
    {
        // Arrange
        var umbraco = HelperWith(
            current: DictionaryWith("Nav.Home", "Home"),
            specificCulture: DictionaryWith("Nav.Home", "Hjem")
        );

        // Act
        var html = umbraco.GetDictionaryHtml("Nav.Home", new CultureInfo("da-DK")).ToString();

        // Assert
        Assert.Equal("<p>Hjem</p>", html);
    }

    [Fact]
    public void GetDictionaryInlineHtml_WithSingleParagraph_ReturnsUnwrappedHtml()
    {
        // Arrange
        var umbraco = HelperWith(DictionaryWith("Nav.Home", "<p><strong>Home</strong></p>"));

        // Act
        var html = umbraco.GetDictionaryInlineHtml("Nav.Home").ToString();

        // Assert
        Assert.Equal("<strong>Home</strong>", html);
    }

    [Fact]
    public void GetDictionaryInlineHtml_WithCulture_ReadsThatCulture()
    {
        // Arrange
        var umbraco = HelperWith(
            current: DictionaryWith("Nav.Home", "Home"),
            specificCulture: DictionaryWith("Nav.Home", "Hjem")
        );

        // Act
        var html = umbraco.GetDictionaryInlineHtml("Nav.Home", new CultureInfo("da-DK")).ToString();

        // Assert
        Assert.Equal("Hjem", html);
    }

    [Fact]
    public void GetHtml_OnCultureDictionary_ReturnsConvertedHtml()
    {
        // Arrange
        var dictionary = DictionaryWith("Common.TermsNote", "Prices < 10 & up");

        // Act
        var html = dictionary.GetHtml("Common.TermsNote").ToString();

        // Assert
        Assert.Equal("<p>Prices &lt; 10 &amp; up</p>", html);
    }

    [Fact]
    public void GetInlineHtml_OnCultureDictionary_ReturnsUnwrappedHtml()
    {
        // Arrange
        var dictionary = DictionaryWith("Common.ReadMore", "Read more");

        // Act
        var html = dictionary.GetInlineHtml("Common.ReadMore").ToString();

        // Assert
        Assert.Equal("Read more", html);
    }

    [Fact]
    public void GetHtml_WithoutRegisteredConverter_ThrowsInvalidOperationException()
    {
        // Arrange
        StaticServiceProvider.Instance = new ServiceCollection().BuildServiceProvider();
        var dictionary = DictionaryWith("Nav.Home", "Home");

        // Act
        var act = () => dictionary.GetHtml("Nav.Home");

        // Assert
        Assert.Throws<InvalidOperationException>(act);
    }
}
