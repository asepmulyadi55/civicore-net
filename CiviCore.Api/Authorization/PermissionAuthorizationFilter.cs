using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using CiviCore.Infrastructure.Services;

namespace CiviCore.Api.Authorization;

/// <summary>
/// Enforces the permission model server-side. Registered globally, because the previous
/// design only hid buttons in React — any authenticated user could call any endpoint
/// directly.
///
/// Fails closed: an authenticated endpoint that declares no permission is denied and
/// logged. A forgotten endpoint therefore breaks loudly instead of staying silently open.
/// </summary>
public class PermissionAuthorizationFilter : IAsyncAuthorizationFilter
{
    private readonly IUserPermissionService _permissions;
    private readonly ILogger<PermissionAuthorizationFilter> _logger;

    public PermissionAuthorizationFilter(
        IUserPermissionService permissions,
        ILogger<PermissionAuthorizationFilter> logger)
    {
        _permissions = permissions;
        _logger = logger;
    }

    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var endpoint = context.HttpContext.GetEndpoint();
        if (endpoint == null) return;

        // Public endpoints opt out via the framework's own attribute.
        if (endpoint.Metadata.GetMetadata<IAllowAnonymous>() != null) return;

        // Not signed in: leave it to the auth middleware to produce the 401.
        if (context.HttpContext.User?.Identity?.IsAuthenticated != true) return;

        if (endpoint.Metadata.GetMetadata<NoPermissionRequiredAttribute>() != null) return;

        var required = ResolveRequiredPermission(context, endpoint);

        if (required == null)
        {
            _logger.LogError(
                "Endpoint {Endpoint} declares no permission. Denying. Add [RequirePermissionModule], " +
                "[RequirePermission] or [NoPermissionRequired].",
                endpoint.DisplayName);
            context.Result = new ForbidResult();
            return;
        }

        // The role name rides in the auth cookie, so the common path costs no database work.
        var roleName = context.HttpContext.User.FindFirstValue(ClaimTypes.Role);
        if (string.IsNullOrEmpty(roleName))
        {
            context.Result = new ForbidResult();
            return;
        }

        if (!await _permissions.RoleHasAsync(roleName, required))
        {
            _logger.LogWarning("Denied {User} -> {Endpoint}: missing {Permission}",
                context.HttpContext.User.Identity?.Name ?? "?", endpoint.DisplayName, required);
            context.Result = new ForbidResult();
        }
    }

    private static string? ResolveRequiredPermission(AuthorizationFilterContext context, Endpoint endpoint)
    {
        // An explicit key on the action (or controller) always wins.
        var explicitPermission = endpoint.Metadata.GetMetadata<RequirePermissionAttribute>();
        if (explicitPermission != null) return explicitPermission.Permission;

        var module = endpoint.Metadata.GetMetadata<RequirePermissionModuleAttribute>();
        if (module == null) return null;

        var action = context.HttpContext.Request.Method switch
        {
            "GET" or "HEAD" => "view",
            "POST" => "create",
            "PUT" or "PATCH" => "edit",
            "DELETE" => "delete",
            _ => null
        };

        return action == null ? null : $"{module.Module}.{action}";
    }
}
