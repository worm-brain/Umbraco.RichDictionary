using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Cms.Api.Common.Attributes;
using Umbraco.Cms.Web.Common.Authorization;
using Umbraco.Cms.Web.Common.Routing;

namespace Umbraco.RichDictionary.Api;

/// <summary>
/// Base class for the package's Management API controllers. Routes them under
/// <c>/umbraco/umbracorichdictionary/api/v{version}</c>, maps them to the package's own
/// Swagger document, and requires the same permission as the core dictionary tree.
/// </summary>
[ApiController]
[BackOfficeRoute($"{RichDictionaryConstants.ApiName}/api/v{{version:apiVersion}}")]
[Authorize(Policy = AuthorizationPolicies.TreeAccessDictionary)]
[MapToApi(RichDictionaryConstants.ApiName)]
public abstract class RichDictionaryApiControllerBase : ControllerBase { }
