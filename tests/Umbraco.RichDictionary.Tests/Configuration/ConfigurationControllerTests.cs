using System.Text.Json;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using NSubstitute;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Services;
using Umbraco.RichDictionary.Configuration;
using CoreConstants = Umbraco.Cms.Core.Constants;

namespace Umbraco.RichDictionary.Tests.Configuration;

public class ConfigurationControllerTests
{
    private static readonly Guid DictionaryRteKey = Guid.Parse(
        "6a1f3c52-0a4b-4a8e-9c1d-2f5e7b8c9d01"
    );

    private readonly IDataTypeService _dataTypeService = Substitute.For<IDataTypeService>();

    [Theory]
    [InlineData(EditorMode.Rte)]
    [InlineData(EditorMode.Markdown)]
    public async Task GetConfiguration_WithConfiguredMode_ReturnsThatMode(EditorMode mode)
    {
        // Arrange
        var controller = CreateController(new RichDictionaryOptions { EditorMode = mode });

        // Act
        var result = await controller.GetConfiguration();

        // Assert
        Assert.Equal(mode, result.EditorMode);
    }

    [Fact]
    public async Task GetConfiguration_WithNothingConfigured_ReturnsRteWithoutRichTextEditor()
    {
        // Arrange
        var controller = CreateController(new RichDictionaryOptions());

        // Act
        var result = await controller.GetConfiguration();

        // Assert
        Assert.Equal(new ConfigurationResponseModel(EditorMode.Rte), result);
    }

    [Fact]
    public async Task GetConfiguration_WithDataTypeKey_ReturnsItsToolbarAndExtensions()
    {
        // Arrange
        var dataType = RichTextDataType();
        _dataTypeService.GetAsync(DictionaryRteKey).Returns(dataType);
        var controller = CreateController(
            new RichDictionaryOptions { RichTextDataType = DictionaryRteKey.ToString() }
        );

        // Act
        var result = await controller.GetConfiguration();

        // Assert
        Assert.Equivalent(
            new RichTextEditorResponseModel(
                DictionaryRteKey,
                ["Umb.Tiptap.Bold", "Umb.Tiptap.Link"],
                [
                    [
                        ["Umb.Tiptap.Toolbar.Bold"],
                        ["Umb.Tiptap.Toolbar.Link"],
                    ],
                ]
            ),
            result.RichTextEditor,
            strict: true
        );
    }

    [Fact]
    public async Task GetConfiguration_WithDataTypeName_ReturnsThatDataTypesToolbar()
    {
        // Arrange
        var dataType = RichTextDataType();
        _dataTypeService.GetAsync("Dictionary RTE").Returns(dataType);
        var controller = CreateController(
            new RichDictionaryOptions { RichTextDataType = " Dictionary RTE " }
        );

        // Act
        var result = await controller.GetConfiguration();

        // Assert
        Assert.Equal(DictionaryRteKey, result.RichTextEditor?.DataTypeId);
    }

    [Fact]
    public async Task GetConfiguration_WithUnknownDataType_EchoesSettingWithoutRichTextEditor()
    {
        // Arrange
        var controller = CreateController(
            new RichDictionaryOptions { RichTextDataType = "Missing" }
        );

        // Act
        var result = await controller.GetConfiguration();

        // Assert
        Assert.Equal(new ConfigurationResponseModel(EditorMode.Rte, "Missing"), result);
    }

    [Fact]
    public async Task GetConfiguration_WithNonRichTextDataType_ReturnsNoRichTextEditor()
    {
        // Arrange
        var textarea = RichTextDataType(
            editorAlias: CoreConstants.PropertyEditors.Aliases.TextArea
        );
        _dataTypeService.GetAsync("Textarea").Returns(textarea);
        var controller = CreateController(
            new RichDictionaryOptions { RichTextDataType = "Textarea" }
        );

        // Act
        var result = await controller.GetConfiguration();

        // Assert
        Assert.Null(result.RichTextEditor);
    }

    [Fact]
    public async Task GetConfiguration_WithMalformedToolbar_ReturnsNoRichTextEditor()
    {
        // Arrange
        var dataType = RichTextDataType(toolbar: "Umb.Tiptap.Toolbar.Bold");
        _dataTypeService.GetAsync("Dictionary RTE").Returns(dataType);
        var controller = CreateController(
            new RichDictionaryOptions { RichTextDataType = "Dictionary RTE" }
        );

        // Act
        var result = await controller.GetConfiguration();

        // Assert
        Assert.Null(result.RichTextEditor);
    }

    [Fact]
    public async Task GetConfiguration_InMarkdownMode_IgnoresRichTextDataType()
    {
        // Arrange
        var dataType = RichTextDataType();
        _dataTypeService.GetAsync("Dictionary RTE").Returns(dataType);
        var controller = CreateController(
            new RichDictionaryOptions
            {
                EditorMode = EditorMode.Markdown,
                RichTextDataType = "Dictionary RTE",
            }
        );

        // Act
        var result = await controller.GetConfiguration();

        // Assert
        Assert.Null(result.RichTextEditor);
    }

    private ConfigurationController CreateController(RichDictionaryOptions configured)
    {
        var options = Substitute.For<IOptionsMonitor<RichDictionaryOptions>>();
        options.CurrentValue.Returns(configured);
        return new ConfigurationController(
            options,
            _dataTypeService,
            NullLogger<ConfigurationController>.Instance
        );
    }

    // Configuration values arrive as JsonElements, as they do when Umbraco loads a data type.
    private static IDataType RichTextDataType(
        string editorAlias = CoreConstants.PropertyEditors.Aliases.RichText,
        object? toolbar = null
    )
    {
        var dataType = Substitute.For<IDataType>();
        dataType.Key.Returns(DictionaryRteKey);
        dataType.EditorAlias.Returns(editorAlias);
        dataType.ConfigurationData.Returns(
            new Dictionary<string, object>
            {
                ["extensions"] = JsonSerializer.SerializeToElement(
                    new[] { "Umb.Tiptap.Bold", "Umb.Tiptap.Link" }
                ),
                ["toolbar"] = JsonSerializer.SerializeToElement(
                    toolbar
                        ?? new[]
                        {
                            new[]
                            {
                                new[] { "Umb.Tiptap.Toolbar.Bold" },
                                new[] { "Umb.Tiptap.Toolbar.Link" },
                            },
                        }
                ),
            }
        );
        return dataType;
    }
}
