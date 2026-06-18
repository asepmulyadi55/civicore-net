using Microsoft.AspNetCore.Identity;
using CiviCore.Domain.Entities;
using System.Security.Claims;

namespace CiviCore.Api.Middleware;

public class EnsureUserIsApprovedMiddleware
{
    private readonly RequestDelegate _next;

    public EnsureUserIsApprovedMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, UserManager<ApplicationUser> userManager)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId != null)
            {
                var user = await userManager.FindByIdAsync(userId);
                if (user != null && !user.IsActive)
                {
                    context.Response.StatusCode = 403;
                    await context.Response.WriteAsJsonAsync(new { message = "Your account is pending administrator approval." });
                    return;
                }
            }
        }
        await _next(context);
    }
}
