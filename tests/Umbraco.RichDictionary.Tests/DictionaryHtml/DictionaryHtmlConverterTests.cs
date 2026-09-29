using Microsoft.Extensions.Options;
using NSubstitute;
using Umbraco.Cms.Core.Security;
using Umbraco.RichDictionary.Configuration;
using Umbraco.RichDictionary.DictionaryHtml;

namespace Umbraco.RichDictionary.Tests.DictionaryHtml;

public class DictionaryHtmlConverterTests
{
    /// <summary>A converter for the given mode, with a pass-through sanitiser (Umbraco's default).</summary>
    private static DictionaryHtmlConverter CreateConverter(
        EditorMode mode,
        IHtmlSanitizer? sanitizer = null
    )
    {
        var options = Substitute.For<IOptionsMonitor<RichDictionaryOptions>>();
        options.CurrentValue.Returns(new RichDictionaryOptions { EditorMode = mode });

        if (sanitizer is null)
        {
            sanitizer = Substitute.For<IHtmlSanitizer>();
            sanitizer.Sanitize(Arg.Any<string>()).Returns(call => call.Arg<string>());
        }

        return new DictionaryHtmlConverter(options, sanitizer);
    }

    // The Rte cases mirror the client's tiptap-content.test.ts: the site must render a value
    // exactly as the back-office editor shows it.
    [Theory]
    [InlineData("<p>Sign up to our <a href=\"/newsletter\">newsletter</a>.</p>")]
    [InlineData("&copy; 2026 <strong>Acme Ltd</strong>.")]
    [InlineData("Line one<br/>Line two")]
    [InlineData("Caf&eacute;")]
    [InlineData("&#169; 2026")]
    public void ToHtml_RteModeWithHtmlMarkup_ReturnsValueUnchanged(string value)
    {
        // Arrange
        var converter = CreateConverter(EditorMode.Rte);

        // Act
        var html = converter.ToHtml(value).ToString();

        // Assert
        Assert.Equal(value, html);
    }

    [Theory]
    [InlineData("Read more", "<p>Read more</p>")]
    [InlineData(
        "Prices from < £10 & free > £50",
        "<p>Prices from &lt; £10 &amp; free &gt; £50</p>"
    )]
    [InlineData("if a<b then", "<p>if a&lt;b then</p>")]
    [InlineData("Acme Ltd\n1 High Street\nLondon", "<p>Acme Ltd<br>1 High Street<br>London</p>")]
    [InlineData("No posts yet.\n\nCheck back soon!", "<p>No posts yet.</p><p>Check back soon!</p>")]
    [InlineData("One\r\nTwo\r\n\r\nThree", "<p>One<br>Two</p><p>Three</p>")]
    [InlineData("**Welcome** to the _blog_", "<p>**Welcome** to the _blog_</p>")]
    public void ToHtml_RteModeWithPlainText_EncodesAndKeepsLineBreaks(string value, string expected)
    {
        // Arrange
        var converter = CreateConverter(EditorMode.Rte);

        // Act
        var html = converter.ToHtml(value).ToString();

        // Assert
        Assert.Equal(expected, html);
    }

    [Theory]
    [InlineData(EditorMode.Rte, null)]
    [InlineData(EditorMode.Rte, "")]
    [InlineData(EditorMode.Markdown, null)]
    [InlineData(EditorMode.Markdown, "")]
    public void ToHtml_WithNoValue_ReturnsEmpty(EditorMode mode, string? value)
    {
        // Arrange
        var converter = CreateConverter(mode);

        // Act
        var html = converter.ToHtml(value).ToString();

        // Assert
        Assert.Equal(string.Empty, html);
    }

    [Theory]
    [InlineData(
        "**Welcome** to the _blog_",
        "<p><strong>Welcome</strong> to the <em>blog</em></p>"
    )]
    [InlineData("Acme Ltd\n1 High Street", "<p>Acme Ltd<br />\n1 High Street</p>")]
    [InlineData("Prices from < 10 & up", "<p>Prices from &lt; 10 &amp; up</p>")]
    [InlineData(
        "No posts yet.\n\nCheck back soon!",
        "<p>No posts yet.</p>\n<p>Check back soon!</p>"
    )]
    public void ToHtml_MarkdownMode_RendersMarkdown(string value, string expected)
    {
        // Arrange
        var converter = CreateConverter(EditorMode.Markdown);

        // Act
        var html = converter.ToHtml(value).ToString();

        // Assert
        Assert.Equal(expected, html);
    }

    [Fact]
    public void ToHtml_WithSiteSanitizer_ReturnsSanitizedHtml()
    {
        // Arrange
        var sanitizer = Substitute.For<IHtmlSanitizer>();
        sanitizer.Sanitize("<p>Hi<script>alert(1)</script></p>").Returns("<p>Hi</p>");
        var converter = CreateConverter(EditorMode.Rte, sanitizer);

        // Act
        var html = converter.ToHtml("<p>Hi<script>alert(1)</script></p>").ToString();

        // Assert
        Assert.Equal("<p>Hi</p>", html);
    }

    [Theory]
    [InlineData(EditorMode.Rte, "<p><strong>Home</strong></p>", "<strong>Home</strong>")]
    [InlineData(EditorMode.Rte, "Read more", "Read more")]
    [InlineData(EditorMode.Markdown, "**Home**", "<strong>Home</strong>")]
    public void ToInlineHtml_WithSingleParagraph_RemovesParagraphWrapper(
        EditorMode mode,
        string value,
        string expected
    )
    {
        // Arrange
        var converter = CreateConverter(mode);

        // Act
        var html = converter.ToInlineHtml(value).ToString();

        // Assert
        Assert.Equal(expected, html);
    }

    [Theory]
    [InlineData("<p>One</p><p>Two</p>")]
    [InlineData("&copy; 2026 <strong>Acme Ltd</strong>.")]
    [InlineData("<ul><li>One</li></ul>")]
    public void ToInlineHtml_WithoutSingleParagraph_ReturnsHtmlUnchanged(string value)
    {
        // Arrange
        var converter = CreateConverter(EditorMode.Rte);

        // Act
        var html = converter.ToInlineHtml(value).ToString();

        // Assert
        Assert.Equal(value, html);
    }
}
