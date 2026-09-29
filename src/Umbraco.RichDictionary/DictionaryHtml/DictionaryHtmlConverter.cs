using System.Text.RegularExpressions;
using Markdig;
using Microsoft.AspNetCore.Html;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Core.Security;
using Umbraco.RichDictionary.Configuration;

namespace Umbraco.RichDictionary.DictionaryHtml;

/// <summary>
/// Turns a stored dictionary value into HTML according to the site's configured
/// <see cref="RichDictionaryOptions.EditorMode"/>. This is what the <c>GetDictionaryHtml</c>
/// extension methods use; inject it directly where no <c>UmbracoHelper</c> is available.
/// </summary>
public interface IDictionaryHtmlConverter
{
    /// <summary>
    /// Converts a stored value to block HTML, such as one or more <c>&lt;p&gt;</c> elements.
    /// </summary>
    /// <param name="value">The stored translation, as returned by Umbraco's own dictionary API.</param>
    /// <returns>The HTML, or <see cref="HtmlString.Empty"/> when the value is null or empty.</returns>
    IHtmlContent ToHtml(string? value);

    /// <summary>
    /// Like <see cref="ToHtml"/>, but when the result is a single paragraph its <c>&lt;p&gt;</c>
    /// wrapper is removed, so the value can sit inside inline markup such as a link or a button.
    /// A value with several paragraphs is returned unchanged.
    /// </summary>
    /// <param name="value">The stored translation, as returned by Umbraco's own dictionary API.</param>
    /// <returns>The HTML, or <see cref="HtmlString.Empty"/> when the value is null or empty.</returns>
    IHtmlContent ToInlineHtml(string? value);
}

/// <summary>
/// Default <see cref="IDictionaryHtmlConverter"/>.
/// </summary>
/// <remarks>
/// <para>
/// <b>Rte mode</b> applies the same rule as the back-office editor (<c>tiptap-content.ts</c>), so a
/// value renders the same on the site as in the editor. A value containing HTML markup (a tag or
/// a character reference) is output as-is. Anything else is plain text from the stock textarea:
/// it is HTML-encoded, blank lines become paragraphs and single line breaks become <c>&lt;br&gt;</c>.
/// </para>
/// <para>
/// <b>Markdown mode</b> renders with Markdig. A single line break renders as <c>&lt;br&gt;</c>
/// rather than a space, so plain-text values such as addresses keep their lines.
/// </para>
/// <para>
/// The result goes through Umbraco's <see cref="IHtmlSanitizer"/>. That is a no-op unless the site
/// registers its own, matching how Umbraco treats rich text. Dictionary values are written by
/// back-office users, whom Umbraco already trusts to write raw HTML into rich text properties.
/// </para>
/// </remarks>
internal sealed partial class DictionaryHtmlConverter(
    IOptionsMonitor<RichDictionaryOptions> options,
    IHtmlSanitizer sanitizer
) : IDictionaryHtmlConverter
{
    private static readonly MarkdownPipeline MarkdownPipeline = new MarkdownPipelineBuilder()
        .UseSoftlineBreakAsHardlineBreak()
        .Build();

    /// <inheritdoc />
    public IHtmlContent ToHtml(string? value) => new HtmlString(Convert(value));

    /// <inheritdoc />
    public IHtmlContent ToInlineHtml(string? value) =>
        new HtmlString(UnwrapSingleParagraph(Convert(value)));

    private string Convert(string? value)
    {
        if (string.IsNullOrEmpty(value))
        {
            return string.Empty;
        }

        var html = options.CurrentValue.EditorMode switch
        {
            EditorMode.Markdown => Markdown.ToHtml(value, MarkdownPipeline).TrimEnd(),
            _ => HtmlMarkup().IsMatch(value) ? value : PlainTextToHtml(value),
        };

        return sanitizer.Sanitize(html);
    }

    private static string PlainTextToHtml(string text)
    {
        var paragraphs = BlankLines().Split(text.ReplaceLineEndings("\n"));
        return string.Concat(
            paragraphs.Select(paragraph => $"<p>{EscapeHtml(paragraph).Replace("\n", "<br>")}</p>")
        );
    }

    // Only the characters that change meaning in HTML text, as the client does. A full encoder
    // (WebUtility.HtmlEncode) would also turn "£" or "ø" into numeric references: the same
    // rendering, but noisier markup that no longer matches what the editor saves.
    private static string EscapeHtml(string text) =>
        text.Replace("&", "&amp;").Replace("<", "&lt;").Replace(">", "&gt;");

    private static string UnwrapSingleParagraph(string html)
    {
        var match = SingleParagraph().Match(html);
        return
            match.Success
            && !match.Groups["inner"].Value.Contains("<p", StringComparison.OrdinalIgnoreCase)
            ? match.Groups["inner"].Value
            : html;
    }

    // Must match HTML_MARKUP in the client's tiptap-content.ts: an opening, closing or
    // self-closing tag, or a character reference such as &copy; or &#169;. A bare < or &
    // followed by a space ("Prices < 10 & up") matches neither.
    [GeneratedRegex(
        @"<\/?[a-z][a-z0-9-]*(\s[^<>]*)?\/?>|&(#\d+|#x[0-9a-f]+|[a-z][a-z0-9]*);",
        RegexOptions.IgnoreCase
    )]
    private static partial Regex HtmlMarkup();

    [GeneratedRegex(@"\n{2,}")]
    private static partial Regex BlankLines();

    [GeneratedRegex(
        @"^<p(\s[^>]*)?>(?<inner>.*)</p>$",
        RegexOptions.Singleline | RegexOptions.IgnoreCase
    )]
    private static partial Regex SingleParagraph();
}
