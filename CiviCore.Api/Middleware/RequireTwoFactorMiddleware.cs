using Microsoft.AspNetCore.Identity;
using CiviCore.Domain.Entities;
using System.Security.Claims;

namespace CiviCore.Api.Middleware;

public class RequireTwoFactorMiddleware
{
    private readonly RequestDelegate _next;

    public RequireTwoFactorMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, UserManager<ApplicationUser> userManager)
    {
        var endpoint = context.GetEndpoint();
        if (endpoint != null && context.User.Identity?.IsAuthenticated == true)
        {
            var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId != null)
            {
                var user = await userManager.FindByIdAsync(userId);
                
                // Mimic Laravel's strict enforcement: if they don't have a secret, block everything except setup/logout endpoints
                if (user != null && string.IsNullOrEmpty(user.TwoFactorSecretKey))
                {
                    var path = context.Request.Path.Value?.ToLower();
                    if (path != null && !path.Contains("/api/auth/2fa/setup") && !path.Contains("/api/auth/2fa/verify") && !path.Contains("/api/auth/logout"))
                    {
                        context.Response.StatusCode = 403;
                        await context.Response.WriteAsJsonAsync(new { code = "REQUIRES_2FA_SETUP", message = "Mandatory Security: You must enable Two-Factor Authentication to access this application." });
                        return;
                    }
                }
            }
        }
        await _next(context);
    }
}
