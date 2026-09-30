using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using NSubstitute;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Core.Security;
using Umbraco.RichDictionary.Configuration;
using Umbraco.RichDictionary.DictionaryHtml;

namespace Umbraco.RichDictionary.Tests.Configuration;

/// <summary>
/// Binds <c>appsettings</c> values through the real <see cref="ConfigurationComposer"/>, then reads them the way the
/// back-office endpoint and the HTML helpers do, so the zero-config default and the invalid-value fallback are
/// checked end to end.
/// </summary>
public class EditorModeConfigurationTests
{
    /// <summary>Options bound by the composer from the given settings (null: no RichDictionary section at all).</summary>
    private static IOptionsMonitor<RichDictionaryOptions> BindOptions(string? editorMode)
    {
        var settings = new Dictionary<string, string?>();
        if (editorMode is not null)
        {
            settings["RichDictionary:EditorMode"] = editorMode;
        }

        var services = new ServiceCollection();
        var builder = Substitute.For<IUmbracoBuilder>();
        builder.Services.Returns(services);
        builder.Config.Returns(new ConfigurationBuilder().AddInMemoryCollection(settings).Build());

        new ConfigurationComposer().Compose(builder);

        return services
            .BuildServiceProvider()
            .GetRequiredService<IOptionsMonitor<RichDictionaryOptions>>();
    }

    [Fact]
    public void GetConfiguration_WithNoRichDictionarySection_ReturnsRte()
    {
        // Arrange
        var controller = new ConfigurationController(BindOptions(editorMode: null));

        // Act
        var result = controller.GetConfiguration();

        // Assert
        Assert.Equal(EditorMode.Rte, result.EditorMode);
    }

    [Theory]
    [InlineData("Markdown")]
    [InlineData("markdown")]
    [InlineData(" MARKDOWN ")]
    public void GetConfiguration_WithMarkdownInAnyCase_ReturnsMarkdown(string configured)
    {
        // Arrange
        var controller = new ConfigurationController(BindOptions(configured));

        // Act
        var result = controller.GetConfiguration();

        // Assert
        Assert.Equal(EditorMode.Markdown, result.EditorMode);
    }

    [Theory]
    [InlineData("Nonsense")]
    [InlineData("")]
    [InlineData("1")]
    public void GetConfiguration_WithUnrecognisedValue_FallsBackToRte(string configured)
    {
        // Arrange
        var controller = new ConfigurationController(BindOptions(configured));

        // Act
        var result = controller.GetConfiguration();

        // Assert
        Assert.Equal(EditorMode.Rte, result.EditorMode);
    }

    [Fact]
    public void ToHtml_WithUnrecognisedValue_RendersInRteMode()
    {
        // Arrange
        var sanitizer = Substitute.For<IHtmlSanitizer>();
        sanitizer.Sanitize(Arg.Any<string>()).Returns(call => call.Arg<string>());
        var converter = new DictionaryHtmlConverter(BindOptions("Nonsense"), sanitizer);

        // Act
        var html = converter.ToHtml("**Welcome**").ToString();

        // Assert: Rte mode treats Markdown syntax as plain text, where Markdown mode would render <strong>.
        Assert.Equal("<p>**Welcome**</p>", html);
    }
}
