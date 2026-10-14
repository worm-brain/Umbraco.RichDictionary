#if UMBRACO_17
using Asp.Versioning;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;
using Umbraco.Cms.Api.Common.OpenApi;
using Umbraco.Cms.Api.Management.OpenApi;
using Umbraco.Cms.Core.DependencyInjection;

namespace Umbraco.Community.RichDictionary.Api;

/// <summary>
/// Umbraco 17: the API document is a Swashbuckle Swagger document, served at
/// <c>/umbraco/swagger/umbracorichdictionary/swagger.json</c>.
/// </summary>
internal static partial class RichDictionaryApiDocument
{
    /// <inheritdoc cref="Register" />
    internal static partial void Register(IUmbracoBuilder builder)
    {
        builder.Services.AddSingleton<IOperationIdHandler, RichDictionaryOperationIdHandler>();

        builder.Services.Configure<SwaggerGenOptions>(options =>
        {
            options.SwaggerDoc(
                RichDictionaryConstants.ApiName,
                new OpenApiInfo { Title = Title, Version = "1.0" }
            );

            // Lets the Swagger UI authenticate as the logged-in back-office user.
            options.OperationFilter<RichDictionaryOperationSecurityFilter>();
        });
    }

    /// <summary>
    /// Applies back-office authentication requirements to the package's Swagger document.
    /// </summary>
    internal sealed class RichDictionaryOperationSecurityFilter
        : BackOfficeSecurityRequirementsOperationFilterBase
    {
        /// <inheritdoc />
        protected override string ApiName => RichDictionaryConstants.ApiName;
    }

    /// <summary>
    /// Uses the bare action name as the operation id, so the generated TypeScript client gets
    /// short method names (e.g. <c>getConfiguration</c>).
    /// </summary>
    internal sealed class RichDictionaryOperationIdHandler(
        IOptions<ApiVersioningOptions> apiVersioningOptions
    ) : OperationIdHandler(apiVersioningOptions)
    {
        /// <inheritdoc />
        protected override bool CanHandle(
            ApiDescription apiDescription,
            ControllerActionDescriptor controllerActionDescriptor
        ) =>
            controllerActionDescriptor.ControllerTypeInfo.Namespace?.StartsWith(
                "Umbraco.Community.RichDictionary",
                StringComparison.Ordinal
            )
                is true;

        /// <inheritdoc />
        public override string Handle(ApiDescription apiDescription) =>
            $"{apiDescription.ActionDescriptor.RouteValues["action"]}";
    }
}
#endif
