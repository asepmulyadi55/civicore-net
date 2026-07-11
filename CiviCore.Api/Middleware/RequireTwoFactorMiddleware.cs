using Microsoft.AspNetCore.Identity;
using CiviCore.Domain.Entities;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using CiviCore.Infrastructure.Data;

namespace CiviCore.Api.Middleware;

public class RequireTwoFactorMiddleware
{
    private readonly RequestDelegate _next;

    public RequireTwoFactorMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, UserManager<ApplicationUser> userManager, AppDbContext dbContext)
    {
        var endpoint = context.GetEndpoint();
        if (endpoint != null && context.User.Identity?.IsAuthenticated == true)
        {
            var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId != null)
            {
                var user = await userManager.FindByIdAsync(userId);
                if (user != null)
                {
                    // Get the user's role security mode
                    var roles = await userManager.GetRolesAsync(user);
                    var roleName = roles.FirstOrDefault();
                    var role = roleName != null
                        ? await dbContext.Roles.FirstOrDefaultAsync(r => r.Name == roleName)
                        : null;
                    var securityMode = role?.SecurityMode ?? "2fa";

                    // Only enforce 2FA gate for roles with SecurityMode == "2fa"
                    if (securityMode == "2fa" && string.IsNullOrEmpty(user.TwoFactorSecretKey))
                    {
                        var path = context.Request.Path.Value?.ToLower();
                        if (path != null &&
                            !path.Contains("/api/auth/2fa/setup") &&
                            !path.Contains("/api/auth/2fa/verify") &&
                            !path.Contains("/api/auth/logout") &&
                            !path.Contains("/api/auth/google"))
                        {
                            context.Response.StatusCode = 403;
                            await context.Response.WriteAsJsonAsync(new { code = "REQUIRES_2FA_SETUP", message = "Mandatory Security: You must enable Two-Factor Authentication to access this application." });
                            return;
                        }
                    }
                }
            }
        }
        await _next(context);
    }
}
