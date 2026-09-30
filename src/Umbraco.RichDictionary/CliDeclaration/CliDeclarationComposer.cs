using Microsoft.Extensions.DependencyInjection;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Infrastructure.Manifest;

namespace Umbraco.RichDictionary.CliDeclaration;

/// <summary>
/// Registers <see cref="CliManifestReader"/>, which declares the site's dictionary value format to Management
/// API clients.
/// </summary>
public sealed class CliDeclarationComposer : IComposer
{
    /// <summary>
    /// Adds the reader at the front of the service collection rather than appending it.
    /// </summary>
    /// <remarks>
    /// Umbraco reads manifests from two kinds of consumer. <c>PackageManifestService</c> (the manifest endpoint
    /// and the back-office) takes every <see cref="IPackageManifestReader"/>, so position does not matter to it.
    /// <c>PackagingService</c> (package telemetry and migration status) takes a single one, which DI resolves to
    /// the last registration: core's App_Plugins reader. Appending with <c>AddSingleton</c>, as Umbraco's docs
    /// show, would make that service see only this manifest and lose every other package on the site.
    /// </remarks>
    /// <param name="builder">The Umbraco builder being composed.</param>
    public void Compose(IUmbracoBuilder builder) =>
        builder.Services.Insert(
            0,
            ServiceDescriptor.Singleton<IPackageManifestReader, CliManifestReader>()
        );
}
