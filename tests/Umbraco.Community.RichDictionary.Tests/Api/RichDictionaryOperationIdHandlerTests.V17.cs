#if UMBRACO_17
using System.Reflection;
using Asp.Versioning;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Api.Management.Controllers.Dictionary;
using Umbraco.Community.RichDictionary.Api;
using Umbraco.Community.RichDictionary.Configuration;

namespace Umbraco.Community.RichDictionary.Tests.Api;

/// <summary>
/// Umbraco 17 only (Umbraco 18 has no operation id handlers).
/// The handler picks the package's controllers by namespace prefix. If that prefix stops matching (a
/// namespace rename), the build still passes but the Swagger document falls back to Umbraco's long operation
/// ids, and the next <c>bun run generate-client</c> renames every method in <c>src/api</c>.
/// </summary>
public class RichDictionaryOperationIdHandlerTests
{
    private readonly RichDictionaryApiDocument.RichDictionaryOperationIdHandler _handler = new(
        Options.Create(new ApiVersioningOptions())
    );

    [Fact]
    public void CanHandle_ControllerInThePackage_ReturnsTrue()
    {
        // Arrange
        var description = DescriptionFor(typeof(ConfigurationController));

        // Act
        var canHandle = _handler.CanHandle(description);

        // Assert
        Assert.True(canHandle);
    }

    [Fact]
    public void CanHandle_CoreManagementApiController_ReturnsFalse()
    {
        // Arrange
        var description = DescriptionFor(typeof(ByKeyDictionaryController));

        // Act
        var canHandle = _handler.CanHandle(description);

        // Assert
        Assert.False(canHandle);
    }

    /// <summary>An API description for an action on <paramref name="controllerType"/>.</summary>
    private static ApiDescription DescriptionFor(Type controllerType) =>
        new()
        {
            ActionDescriptor = new ControllerActionDescriptor
            {
                ControllerTypeInfo = controllerType.GetTypeInfo(),
            },
        };
}
#endif
