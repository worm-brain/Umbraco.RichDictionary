using Microsoft.Extensions.Options;
using NSubstitute;
using Umbraco.RichDictionary.Configuration;

namespace Umbraco.RichDictionary.Tests.Configuration;

public class ConfigurationControllerTests
{
    [Theory]
    [InlineData(EditorMode.Rte)]
    [InlineData(EditorMode.Markdown)]
    public void GetConfiguration_WithConfiguredMode_ReturnsThatMode(EditorMode mode)
    {
        // Arrange
        var options = Substitute.For<IOptionsMonitor<RichDictionaryOptions>>();
        options.CurrentValue.Returns(new RichDictionaryOptions { EditorMode = mode });
        var controller = new ConfigurationController(options);

        // Act
        var result = controller.GetConfiguration();

        // Assert
        Assert.Equal(mode, result.EditorMode);
    }

    [Fact]
    public void GetConfiguration_WithNothingConfigured_ReturnsRte()
    {
        // Arrange
        var options = Substitute.For<IOptionsMonitor<RichDictionaryOptions>>();
        options.CurrentValue.Returns(new RichDictionaryOptions());
        var controller = new ConfigurationController(options);

        // Act
        var result = controller.GetConfiguration();

        // Assert
        Assert.Equal(EditorMode.Rte, result.EditorMode);
    }
}
