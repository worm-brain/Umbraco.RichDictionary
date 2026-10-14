#if UMBRACO_18
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Community.RichDictionary.Api;

namespace Umbraco.Community.RichDictionary.Tests.Api;

/// <summary>Umbraco 18: the composer registers the package's OpenAPI document.</summary>
public class RichDictionaryApiComposerTests
{
    [Fact]
    public void Compose_OnUmbraco18_RegistersAnOpenApiDocumentNamedAfterTheApi()
    {
        // Arrange
        var services = new ServiceCollection();
        var builder = Substitute.For<IUmbracoBuilder>();
        builder.Services.Returns(services);

        // Act
        new RichDictionaryApiComposer().Compose(builder);

        // Assert: Microsoft.AspNetCore.OpenApi keys a document's services by the document name.
        Assert.Contains(
            services,
            descriptor =>
                descriptor.IsKeyedService
                && Equals(descriptor.ServiceKey, RichDictionaryConstants.ApiName)
        );
    }
}
#endif
