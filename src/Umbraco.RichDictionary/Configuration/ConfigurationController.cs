using Asp.Versioning;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Umbraco.RichDictionary.Api;

namespace Umbraco.RichDictionary.Configuration;

/// <summary>
/// The package configuration the back-office client needs, such as which editor to render.
/// </summary>
/// <param name="EditorMode">The editor used for dictionary values.</param>
public sealed record ConfigurationResponseModel(EditorMode EditorMode);

/// <summary>
/// Exposes the package configuration to the back-office client.
/// </summary>
[ApiVersion("1.0")]
[ApiExplorerSettings(GroupName = "Configuration")]
public sealed class ConfigurationController(IOptionsMonitor<RichDictionaryOptions> options)
    : RichDictionaryApiControllerBase
{
    /// <summary>
    /// Gets the current package configuration.
    /// </summary>
    /// <returns>The configuration, read on each request so changes to <c>appsettings.json</c> take effect without a restart.</returns>
    [HttpGet("configuration")]
    [ProducesResponseType<ConfigurationResponseModel>(StatusCodes.Status200OK)]
    public ConfigurationResponseModel GetConfiguration() => new(options.CurrentValue.EditorMode);
}
