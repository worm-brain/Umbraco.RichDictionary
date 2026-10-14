using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;

namespace Umbraco.Community.RichDictionary.Api;

/// <summary>
/// Registers the package's API document so that its endpoints show up in the back-office API UI
/// and the TypeScript client can be generated from them (<c>bun run generate</c>).
/// </summary>
/// <remarks>
/// Registering an API document differs between Umbraco majors (Swashbuckle in 17,
/// Microsoft.AspNetCore.OpenApi in 18), so <see cref="RichDictionaryApiDocument.Register"/> has one
/// implementation per major. See https://docs.umbraco.com/umbraco-cms/tutorials/creating-a-backoffice-api.
/// </remarks>
public sealed class RichDictionaryApiComposer : IComposer
{
    /// <summary>
    /// Adds the API document with its back-office security requirements.
    /// </summary>
    /// <param name="builder">The Umbraco builder being composed.</param>
    public void Compose(IUmbracoBuilder builder) => RichDictionaryApiDocument.Register(builder);
}

/// <summary>
/// Registers the package's API document. Implemented once per Umbraco major, in
/// <c>RichDictionaryApiDocument.V17.cs</c> and <c>RichDictionaryApiDocument.V18.cs</c>.
/// </summary>
internal static partial class RichDictionaryApiDocument
{
    /// <summary>
    /// The document title shown in the back-office API UI.
    /// </summary>
    internal const string Title = "Umbraco Rich Dictionary Management API";

    /// <summary>
    /// Adds the document and its back-office security requirements.
    /// </summary>
    /// <param name="builder">The Umbraco builder being composed.</param>
    internal static partial void Register(IUmbracoBuilder builder);
}
