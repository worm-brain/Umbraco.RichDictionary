#if UMBRACO_18
using Umbraco.Cms.Api.Common.OpenApi;
using Umbraco.Cms.Api.Management.OpenApi;
using Umbraco.Cms.Core.DependencyInjection;
using CoreConstants = Umbraco.Cms.Core.Constants;

namespace Umbraco.Community.RichDictionary.Api;

/// <summary>
/// Umbraco 18: the API document is a Microsoft.AspNetCore.OpenApi document, served at
/// <c>/umbraco/openapi/umbracorichdictionary.json</c> and registered with Umbraco's
/// <c>AddBackOfficeOpenApiDocument</c> (present since 18.0.0), in the shape the 18
/// <c>umbraco-extension</c> template generates. Umbraco's default operation ids are already the bare
/// action names, so the 17 operation id handler has no counterpart here.
/// </summary>
internal static partial class RichDictionaryApiDocument
{
    /// <inheritdoc cref="Register" />
    internal static partial void Register(IUmbracoBuilder builder) =>
        builder.AddBackOfficeOpenApiDocument(
            RichDictionaryConstants.ApiName,
            document =>
                document
                    .WithTitle(Title)
                    .WithBackOfficeAuthentication()
                    // The controllers format with the back-office JSON options
                    // (RichDictionaryApiControllerBase), so the schemas must too: enums as strings.
                    .WithJsonOptions(CoreConstants.JsonOptionsNames.BackOffice)
                    .ConfigureOpenApiOptions(options =>
                        options.AddDocumentTransformer(
                            (doc, _, _) =>
                            {
                                doc.Info.Version = "1.0";
                                return Task.CompletedTask;
                            }
                        )
                    )
        );
}
#endif
