using Microsoft.AspNetCore.Identity;
using CiviCore.Domain.Entities;
using System.Security.Claims;

namespace CiviCore.Api.Middleware;

public class SessionConflictMiddleware
{
    private readonly RequestDelegate _next;

    public SessionConflictMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, UserManager<ApplicationUser> userManager, SignInManager<ApplicationUser> signInManager)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId != null)
            {
                var user = await userManager.FindByIdAsync(userId);
                // Replicates Laravel's single session conflict detection
                if (user == null || string.IsNullOrEmpty(user.SessionToken))
                {
                    await signInManager.SignOutAsync();
                    context.Response.StatusCode = 401;
                    await context.Response.WriteAsJsonAsync(new { code = "SESSION_CONFLICT", message = "Your session has expired or you logged in from another device." });
                    return;
                }
            }
        }
        await _next(context);
    }
}
