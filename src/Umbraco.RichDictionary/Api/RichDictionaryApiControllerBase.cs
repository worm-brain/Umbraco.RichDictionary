using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Cms.Api.Common.Attributes;
using Umbraco.Cms.Api.Common.Filters;
using Umbraco.Cms.Web.Common.Authorization;
using Umbraco.Cms.Web.Common.Routing;
using CoreConstants = Umbraco.Cms.Core.Constants;

namespace Umbraco.RichDictionary.Api;

/// <summary>
/// Base class for the package's Management API controllers. Routes them under
/// <c>/umbraco/umbracorichdictionary/api/v{version}</c>, maps them to the package's own
/// Swagger document, and requires the same permission as the core dictionary tree.
/// </summary>
/// <remarks>
/// Uses the back-office JSON options, as the core Management API does, so enums serialise as
/// strings. Without them ASP.NET's defaults write enums as numbers, while the Swagger document
/// (and so the generated TypeScript client) promises strings.
/// </remarks>
[ApiController]
[BackOfficeRoute($"{RichDictionaryConstants.ApiName}/api/v{{version:apiVersion}}")]
[Authorize(Policy = AuthorizationPolicies.TreeAccessDictionary)]
[MapToApi(RichDictionaryConstants.ApiName)]
[JsonOptionsName(CoreConstants.JsonOptionsNames.BackOffice)]
public abstract class RichDictionaryApiControllerBase : ControllerBase { }
