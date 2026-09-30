using Microsoft.Extensions.Options;
using Umbraco.Cms.Core.Manifest;
using Umbraco.Cms.Infrastructure.Manifest;
using Umbraco.Extensions;
using Umbraco.RichDictionary.Configuration;

namespace Umbraco.RichDictionary.CliDeclaration;

/// <summary>
/// Tells Management API clients which format this site stores dictionary values in. It emits a second
/// package manifest, next to the static <c>umbraco-package.json</c>, holding one
/// <c>umbracoCli</c> extension whose <c>meta.dictionaryValueFormat</c> follows
/// <see cref="RichDictionaryOptions.EditorMode"/>. It is C# rather than JSON because a static manifest cannot
/// read configuration.
/// </summary>
/// <remarks>
/// Umbraco does not merge manifests by id: <c>GET /umbraco/management/api/v1/manifest/manifest</c> returns this
/// one and the static one as separate entries. It also caches the combined list, for 30 days in the
/// <c>Production</c> runtime mode and 10 seconds otherwise, so in production a changed <c>EditorMode</c> reaches
/// clients only after a restart.
/// </remarks>
/// <param name="options">Read on every call, so the value is current whenever Umbraco's cache refills.</param>
internal sealed class CliManifestReader(IOptionsMonitor<RichDictionaryOptions> options)
    : IPackageManifestReader
{
    /// <summary>
    /// The id of the static <c>umbraco-package.json</c>. Sharing it lets clients attribute the declaration to
    /// this package.
    /// </summary>
    private const string PackageId = "Umbraco.RichDictionary";

    /// <summary>
    /// The package version without build metadata, which is the value the client build stamps into
    /// <c>umbraco-package.json</c>. Null only if the assembly carries no version at all.
    /// </summary>
    private static readonly string? PackageVersion =
        typeof(CliManifestReader).Assembly.TryGetInformationalVersion(out var version)
            ? version
            : null;

    /// <summary>
    /// Builds the manifest from the current <see cref="RichDictionaryOptions.EditorMode"/>.
    /// </summary>
    /// <returns>A single manifest with a single <c>umbracoCli</c> extension.</returns>
    public Task<IEnumerable<PackageManifest>> ReadPackageManifestsAsync()
    {
        var manifest = new PackageManifest
        {
            Id = PackageId,
            // Deliberately empty: the back-office Packages > Installed list shows every manifest that has a
            // name, so a named second manifest would appear as a second installed package.
            Name = "",
            Version = PackageVersion,
            Extensions =
            [
                // A dictionary rather than a typed object, so the keys are written exactly as given whatever
                // naming policy the serializer uses.
                new Dictionary<string, object>
                {
                    ["type"] = "umbracoCli",
                    ["alias"] = "Umbraco.RichDictionary.Cli",
                    ["name"] = "Rich Dictionary",
                    ["meta"] = new Dictionary<string, string>
                    {
                        ["dictionaryValueFormat"] = ToDictionaryValueFormat(
                            options.CurrentValue.EditorMode
                        ),
                    },
                },
            ],
        };

        return Task.FromResult<IEnumerable<PackageManifest>>([manifest]);
    }

    /// <summary>
    /// Maps an editor mode to the CLI's <c>dictionaryValueFormat</c> vocabulary.
    /// </summary>
    /// <param name="mode">The configured mode.</param>
    /// <returns>
    /// <c>markdown</c> for <see cref="EditorMode.Markdown"/>; otherwise <c>html</c>, which also covers a value
    /// that is not a defined mode, because <see cref="EditorMode.Rte"/> is the package-wide fallback.
    /// </returns>
    private static string ToDictionaryValueFormat(EditorMode mode) =>
        mode switch
        {
            EditorMode.Markdown => "markdown",
            _ => "html",
        };
}
