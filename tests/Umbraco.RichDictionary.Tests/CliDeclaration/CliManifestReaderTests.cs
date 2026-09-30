using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using NSubstitute;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Core.Manifest;
using Umbraco.RichDictionary.CliDeclaration;
using Umbraco.RichDictionary.Configuration;

namespace Umbraco.RichDictionary.Tests.CliDeclaration;

public class CliManifestReaderTests
{
    /// <summary>
    /// The camelCase web defaults, like the Management API's back-office JSON options, so the tests see the
    /// extension as a client would.
    /// </summary>
    private static readonly JsonSerializerOptions ApiJson = new(JsonSerializerDefaults.Web);

    /// <summary>Options bound by the real composer from the given setting (null: no RichDictionary section).</summary>
    private static IOptionsMonitor<RichDictionaryOptions> BindOptions(string? editorMode)
    {
        var settings = new Dictionary<string, string?>();
        if (editorMode is not null)
        {
            settings["RichDictionary:EditorMode"] = editorMode;
        }

        var services = new ServiceCollection();
        var builder = Substitute.For<IUmbracoBuilder>();
        builder.Services.Returns(services);
        builder.Config.Returns(new ConfigurationBuilder().AddInMemoryCollection(settings).Build());

        new ConfigurationComposer().Compose(builder);

        return services
            .BuildServiceProvider()
            .GetRequiredService<IOptionsMonitor<RichDictionaryOptions>>();
    }

    /// <summary>Options whose current value has the given mode, bypassing configuration binding.</summary>
    private static IOptionsMonitor<RichDictionaryOptions> OptionsWith(EditorMode mode)
    {
        var options = Substitute.For<IOptionsMonitor<RichDictionaryOptions>>();
        options.CurrentValue.Returns(new RichDictionaryOptions { EditorMode = mode });
        return options;
    }

    private static async Task<PackageManifest> ReadSingleManifest(
        IOptionsMonitor<RichDictionaryOptions> options
    ) => Assert.Single(await new CliManifestReader(options).ReadPackageManifestsAsync());

    /// <summary>The declared value, read from the serialised extension the way a client reads it.</summary>
    private static string? DeclaredFormat(PackageManifest manifest)
    {
        var extension = JsonSerializer.SerializeToElement(
            Assert.Single(manifest.Extensions),
            ApiJson
        );
        return extension.GetProperty("meta").GetProperty("dictionaryValueFormat").GetString();
    }

    [Theory]
    [InlineData(null, "html")]
    [InlineData("Rte", "html")]
    [InlineData("Markdown", "markdown")]
    [InlineData("Nonsense", "html")]
    public async Task ReadPackageManifestsAsync_WithConfiguredEditorMode_DeclaresMatchingFormat(
        string? editorMode,
        string expectedFormat
    )
    {
        // Arrange
        var options = BindOptions(editorMode);

        // Act
        var manifest = await ReadSingleManifest(options);

        // Assert
        Assert.Equal(expectedFormat, DeclaredFormat(manifest));
    }

    [Fact]
    public async Task ReadPackageManifestsAsync_WithUndefinedEditorMode_DeclaresHtml()
    {
        // Arrange
        var options = OptionsWith((EditorMode)99);

        // Act
        var manifest = await ReadSingleManifest(options);

        // Assert
        Assert.Equal("html", DeclaredFormat(manifest));
    }

    [Fact]
    public async Task ReadPackageManifestsAsync_AfterEditorModeChanges_DeclaresTheNewFormat()
    {
        // Arrange
        var options = Substitute.For<IOptionsMonitor<RichDictionaryOptions>>();
        options.CurrentValue.Returns(
            new RichDictionaryOptions { EditorMode = EditorMode.Rte },
            new RichDictionaryOptions { EditorMode = EditorMode.Markdown }
        );
        var reader = new CliManifestReader(options);
        await reader.ReadPackageManifestsAsync();

        // Act
        var manifest = Assert.Single(await reader.ReadPackageManifestsAsync());

        // Assert
        Assert.Equal("markdown", DeclaredFormat(manifest));
    }

    [Fact]
    public async Task ReadPackageManifestsAsync_EmitsOneUmbracoCliExtension()
    {
        // Arrange
        var options = OptionsWith(EditorMode.Markdown);

        // Act
        var manifest = await ReadSingleManifest(options);

        // Assert
        Assert.Equal(
            """[{"type":"umbracoCli","alias":"Umbraco.RichDictionary.Cli","name":"Rich Dictionary","meta":{"dictionaryValueFormat":"markdown"}}]""",
            JsonSerializer.Serialize(manifest.Extensions, ApiJson)
        );
    }

    [Fact]
    public async Task ReadPackageManifestsAsync_EmitsPrivateUnnamedManifestUnderThePackageId()
    {
        // Arrange
        var options = OptionsWith(EditorMode.Rte);

        // Act
        var manifest = await ReadSingleManifest(options);

        // Assert: the id matches umbraco-package.json; no name keeps it out of Packages > Installed; private
        // means it is served by /manifest/manifest and /manifest/private, not the anonymous /manifest/public.
        Assert.Equal(
            ("Umbraco.RichDictionary", "", false),
            (manifest.Id, manifest.Name, manifest.AllowPublicAccess)
        );
    }
}
