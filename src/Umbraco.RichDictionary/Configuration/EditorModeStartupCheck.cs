using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Notifications;

namespace Umbraco.RichDictionary.Configuration;

/// <summary>
/// Logs a warning at startup when <c>RichDictionary:EditorMode</c> is set to a value that is not an
/// <see cref="EditorMode"/>. The site still starts, in <see cref="EditorMode.Rte"/> mode (see
/// <see cref="EditorModeConverter"/>); a missing or empty setting is the normal zero-configuration case and
/// logs nothing.
/// </summary>
/// <param name="configuration">The site configuration, read raw because the bound options have already fallen back.</param>
/// <param name="logger">Where the warning goes.</param>
internal sealed class EditorModeStartupCheck(
    IConfiguration configuration,
    ILogger<EditorModeStartupCheck> logger
) : INotificationHandler<UmbracoApplicationStartingNotification>
{
    private const string SettingKey =
        $"{RichDictionaryConstants.ConfigurationSection}:{nameof(RichDictionaryOptions.EditorMode)}";

    /// <summary>
    /// Checks the configured editor mode once, as Umbraco starts.
    /// </summary>
    /// <param name="notification">The startup notification; its content is not used.</param>
    public void Handle(UmbracoApplicationStartingNotification notification)
    {
        var value = configuration[SettingKey];
        if (string.IsNullOrWhiteSpace(value) || EditorModeConverter.TryParse(value, out _))
        {
            return;
        }

        logger.LogWarning(
            "{Setting} is set to {EditorMode}, which is not a recognised editor mode, so {Fallback} is used instead. Valid values: {ValidValues}.",
            SettingKey,
            value,
            EditorMode.Rte,
            string.Join(", ", Enum.GetNames<EditorMode>())
        );
    }
}
