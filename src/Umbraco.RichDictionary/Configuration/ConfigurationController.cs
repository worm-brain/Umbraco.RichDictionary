using System.Text.Json;
using Asp.Versioning;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Services;
using Umbraco.RichDictionary.Api;
using CoreConstants = Umbraco.Cms.Core.Constants;

namespace Umbraco.RichDictionary.Configuration;

/// <summary>
/// The package configuration the back-office client needs, such as which editor to render.
/// </summary>
/// <param name="EditorMode">The editor used for dictionary values.</param>
/// <param name="RichTextDataType">
/// The <see cref="RichDictionaryOptions.RichTextDataType"/> setting as configured, or null when it
/// is empty. Lets the client explain why <paramref name="RichTextEditor"/> is missing.
/// </param>
/// <param name="RichTextEditor">
/// The Tiptap configuration read from that data type. Null when the mode isn't
/// <see cref="EditorMode.Rte"/>, nothing is configured, or the setting doesn't match a rich text
/// data type; the client then uses its built-in toolbar.
/// </param>
public sealed record ConfigurationResponseModel(
    EditorMode EditorMode,
    string? RichTextDataType = null,
    RichTextEditorResponseModel? RichTextEditor = null
);

/// <summary>
/// The Tiptap settings of a site's rich text data type, as saved by Umbraco's data type editor.
/// Passed through unfiltered: the client drops the extensions and toolbar items that it doesn't
/// recognise or that don't belong in dictionary values.
/// </summary>
/// <param name="DataTypeId">The data type's key.</param>
/// <param name="Extensions">Tiptap extension aliases, e.g. <c>Umb.Tiptap.Bold</c>.</param>
/// <param name="Toolbar">Toolbar rows, each a list of button groups, each a list of toolbar extension aliases.</param>
public sealed record RichTextEditorResponseModel(
    Guid DataTypeId,
    IReadOnlyList<string> Extensions,
    IReadOnlyList<IReadOnlyList<IReadOnlyList<string>>> Toolbar
);

/// <summary>
/// Exposes the package configuration to the back-office client.
/// </summary>
/// <remarks>
/// The rich text data type is read here rather than by the client through the core data type
/// endpoint, because that endpoint requires access to a content or settings tree. Umbraco's default
/// Translators group only has the Translation section, so the client would get a 403.
/// </remarks>
[ApiVersion("1.0")]
[ApiExplorerSettings(GroupName = "Configuration")]
public sealed class ConfigurationController(
    IOptionsMonitor<RichDictionaryOptions> options,
    IDataTypeService dataTypeService,
    ILogger<ConfigurationController> logger
) : RichDictionaryApiControllerBase
{
    /// <summary>
    /// Gets the current package configuration.
    /// </summary>
    /// <returns>The configuration, read on each request so changes to <c>appsettings.json</c> take effect without a restart.</returns>
    [HttpGet("configuration")]
    [ProducesResponseType<ConfigurationResponseModel>(StatusCodes.Status200OK)]
    public async Task<ConfigurationResponseModel> GetConfiguration()
    {
        var current = options.CurrentValue;
        var dataTypeSetting = string.IsNullOrWhiteSpace(current.RichTextDataType)
            ? null
            : current.RichTextDataType.Trim();

        // Only the Tiptap editor has a toolbar, so Markdown mode skips the data type lookup.
        var richTextEditor =
            current.EditorMode == EditorMode.Rte && dataTypeSetting is not null
                ? await GetRichTextEditorAsync(dataTypeSetting)
                : null;

        return new ConfigurationResponseModel(current.EditorMode, dataTypeSetting, richTextEditor);
    }

    private async Task<RichTextEditorResponseModel?> GetRichTextEditorAsync(string dataTypeSetting)
    {
        var dataType = Guid.TryParse(dataTypeSetting, out var key)
            ? await dataTypeService.GetAsync(key)
            : await dataTypeService.GetAsync(dataTypeSetting);

        if (dataType is null)
        {
            logger.LogWarning(
                "RichDictionary:RichTextDataType {DataType} does not match a data type's key or name; using the default dictionary toolbar.",
                dataTypeSetting
            );
            return null;
        }

        if (dataType.EditorAlias != CoreConstants.PropertyEditors.Aliases.RichText)
        {
            logger.LogWarning(
                "RichDictionary:RichTextDataType {DataType} uses the {EditorAlias} property editor, not {RichText}; using the default dictionary toolbar.",
                dataTypeSetting,
                dataType.EditorAlias,
                CoreConstants.PropertyEditors.Aliases.RichText
            );
            return null;
        }

        var extensions = ReadConfiguration<string[]>(dataType, "extensions");
        var toolbar = ReadConfiguration<string[][][]>(dataType, "toolbar");
        if (extensions is null || toolbar is null)
        {
            logger.LogWarning(
                "RichDictionary:RichTextDataType {DataType} has no readable Tiptap extensions and toolbar; using the default dictionary toolbar.",
                dataTypeSetting
            );
            return null;
        }

        return new RichTextEditorResponseModel(dataType.Key, extensions, toolbar);
    }

    // ConfigurationData holds whatever the configuration serialiser produced (JsonElement, lists of
    // objects, arrays), so the value is round-tripped through JSON to get a typed shape.
    // Returns null when the value is missing or isn't that shape.
    private static T? ReadConfiguration<T>(IDataType dataType, string alias)
        where T : class
    {
        if (!dataType.ConfigurationData.TryGetValue(alias, out var value) || value is null)
        {
            return null;
        }

        try
        {
            return JsonSerializer.SerializeToElement(value).Deserialize<T>();
        }
        catch (Exception exception) when (exception is JsonException or NotSupportedException)
        {
            return null;
        }
    }
}
