using Microsoft.Extensions.DependencyInjection;
using NSubstitute;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Core.Manifest;
using Umbraco.Cms.Infrastructure.Manifest;
using Umbraco.RichDictionary.CliDeclaration;
using Umbraco.RichDictionary.Configuration;

namespace Umbraco.RichDictionary.Tests.CliDeclaration;

public class CliDeclarationComposerTests
{
    /// <summary>Stands in for core's App_Plugins reader, which Umbraco registers before composers run.</summary>
    private sealed class CoreReader : IPackageManifestReader
    {
        public Task<IEnumerable<PackageManifest>> ReadPackageManifestsAsync() =>
            Task.FromResult<IEnumerable<PackageManifest>>([]);
    }

    /// <summary>A provider built the way a site builds it: core's reader first, then the composer.</summary>
    private static ServiceProvider ComposeAfterCoreReader()
    {
        var services = new ServiceCollection();
        services.AddOptions<RichDictionaryOptions>();
        services.AddSingleton<IPackageManifestReader, CoreReader>();
        var builder = Substitute.For<IUmbracoBuilder>();
        builder.Services.Returns(services);

        new CliDeclarationComposer().Compose(builder);

        return services.BuildServiceProvider();
    }

    [Fact]
    public void Compose_AfterCoreReader_AddsReaderToTheReaderCollection()
    {
        // Arrange
        using var provider = ComposeAfterCoreReader();

        // Act
        var readers = provider.GetServices<IPackageManifestReader>();

        // Assert
        Assert.Contains(readers, reader => reader is CliManifestReader);
    }

    [Fact]
    public void Compose_AfterCoreReader_LeavesCoreReaderAsTheSingleResolution()
    {
        // Arrange
        using var provider = ComposeAfterCoreReader();

        // Act
        var reader = provider.GetRequiredService<IPackageManifestReader>();

        // Assert: PackagingService injects one reader, so it must stay core's.
        Assert.IsType<CoreReader>(reader);
    }
}
