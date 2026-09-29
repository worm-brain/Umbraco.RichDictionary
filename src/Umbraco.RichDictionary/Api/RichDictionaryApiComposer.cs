using Asp.Versioning;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;
using Umbraco.Cms.Api.Common.OpenApi;
using Umbraco.Cms.Api.Management.OpenApi;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;

namespace Umbraco.RichDictionary.Api;

/// <summary>
/// Registers the package's Swagger document so that its endpoints show up in the Swagger UI
/// and the TypeScript client can be generated from them (<c>bun run generate-client</c>).
/// </summary>
/// <remarks>
/// See https://docs.umbraco.com/umbraco-cms/tutorials/creating-a-backoffice-api.
/// </remarks>
public sealed class RichDictionaryApiComposer : IComposer
{
    /// <summary>
    /// Adds the Swagger document, its back-office security requirements, and the operation id handler.
    /// </summary>
    /// <param name="builder">The Umbraco builder being composed.</param>
    public void Compose(IUmbracoBuilder builder)
    {
        builder.Services.AddSingleton<IOperationIdHandler, RichDictionaryOperationIdHandler>();

        builder.Services.Configure<SwaggerGenOptions>(options =>
        {
            options.SwaggerDoc(
                RichDictionaryConstants.ApiName,
                new OpenApiInfo
                {
                    Title = "Umbraco Rich Dictionary Management API",
                    Version = "1.0",
                }
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
                "Umbraco.RichDictionary",
                StringComparison.Ordinal
            )
                is true;

        /// <inheritdoc />
        public override string Handle(ApiDescription apiDescription) =>
            $"{apiDescription.ActionDescriptor.RouteValues["action"]}";
    }
}
