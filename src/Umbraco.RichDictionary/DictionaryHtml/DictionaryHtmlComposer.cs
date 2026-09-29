using Microsoft.Extensions.DependencyInjection;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;

namespace Umbraco.RichDictionary.DictionaryHtml;

/// <summary>
/// Registers <see cref="IDictionaryHtmlConverter"/>.
/// </summary>
public sealed class DictionaryHtmlComposer : IComposer
{
    /// <summary>
    /// Registers the converter as a singleton. It reads the editor mode on every call, so a change
    /// to <c>appsettings.json</c> takes effect without a restart.
    /// </summary>
    /// <param name="builder">The Umbraco builder being composed.</param>
    public void Compose(IUmbracoBuilder builder) =>
        builder.Services.AddSingleton<IDictionaryHtmlConverter, DictionaryHtmlConverter>();
}
