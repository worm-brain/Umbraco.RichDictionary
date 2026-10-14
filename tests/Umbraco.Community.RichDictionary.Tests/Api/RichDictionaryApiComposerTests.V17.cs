#if UMBRACO_17
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;
using Umbraco.Cms.Api.Common.OpenApi;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Community.RichDictionary.Api;

namespace Umbraco.Community.RichDictionary.Tests.Api;

/// <summary>Umbraco 17: the composer registers the package's Swagger document pieces.</summary>
public class RichDictionaryApiComposerTests
{
    [Fact]
    public void Compose_OnUmbraco17_RegistersTheOperationIdHandler()
    {
        // Arrange
        var services = new ServiceCollection();
        var builder = Substitute.For<IUmbracoBuilder>();
        builder.Services.Returns(services);

        // Act
        new RichDictionaryApiComposer().Compose(builder);

        // Assert
        Assert.Contains(
            services,
            descriptor =>
                descriptor.ServiceType == typeof(IOperationIdHandler)
                && descriptor.ImplementationType
                    == typeof(RichDictionaryApiDocument.RichDictionaryOperationIdHandler)
        );
    }
}
#endif
