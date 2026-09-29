using Microsoft.Extensions.DependencyInjection;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;

namespace Umbraco.RichDictionary.Configuration;

/// <summary>
/// Binds <see cref="RichDictionaryOptions"/> from configuration.
/// </summary>
public sealed class ConfigurationComposer : IComposer
{
    /// <summary>
    /// Registers <see cref="RichDictionaryOptions"/> against the <c>RichDictionary</c> configuration section.
    /// </summary>
    /// <param name="builder">The Umbraco builder being composed.</param>
    public void Compose(IUmbracoBuilder builder) =>
        builder
            .Services.AddOptions<RichDictionaryOptions>()
            .Bind(builder.Config.GetSection(RichDictionaryConstants.ConfigurationSection));
}
