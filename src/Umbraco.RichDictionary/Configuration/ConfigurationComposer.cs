using Microsoft.Extensions.DependencyInjection;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Core.Notifications;

namespace Umbraco.RichDictionary.Configuration;

/// <summary>
/// Binds <see cref="RichDictionaryOptions"/> from configuration.
/// </summary>
public sealed class ConfigurationComposer : IComposer
{
    /// <summary>
    /// Registers <see cref="RichDictionaryOptions"/> against the <c>RichDictionary</c> configuration section, and a
    /// startup check that warns about an unrecognised <c>EditorMode</c>. The section is optional: without it the
    /// defaults apply.
    /// </summary>
    /// <param name="builder">The Umbraco builder being composed.</param>
    public void Compose(IUmbracoBuilder builder)
    {
        builder
            .Services.AddOptions<RichDictionaryOptions>()
            .Bind(builder.Config.GetSection(RichDictionaryConstants.ConfigurationSection));

        builder.AddNotificationHandler<
            UmbracoApplicationStartingNotification,
            EditorModeStartupCheck
        >();
    }
}
