namespace Umbraco.RichDictionary;

/// <summary>
/// Package-wide constants shared by the API, configuration and composers.
/// </summary>
public static class RichDictionaryConstants
{
    /// <summary>
    /// Name of the package's Swagger document and the route segment of its Management API.
    /// </summary>
    public const string ApiName = "umbracorichdictionary";

    /// <summary>
    /// The <c>appsettings.json</c> section that <see cref="Configuration.RichDictionaryOptions"/> binds to.
    /// </summary>
    public const string ConfigurationSection = "RichDictionary";
}
