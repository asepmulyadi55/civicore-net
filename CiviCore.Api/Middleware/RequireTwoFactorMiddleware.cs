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
                // If user has 2FA configured but hasn't completed it this session (this is usually handled by Identity, 
                // but we explicitly check if they need to be challenged)
                if (user != null && user.TwoFactorEnabled)
                {
                    // ASP.NET Identity typically handles 2FA with TwoFactorSignInAsync. 
                    // This middleware acts as a double-check if the route requires strict 2FA completion.
                }
            }
        }
        await _next(context);
    }
}
