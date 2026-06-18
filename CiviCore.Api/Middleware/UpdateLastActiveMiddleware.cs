using Microsoft.AspNetCore.Identity;
using CiviCore.Domain.Entities;
using System.Security.Claims;

namespace CiviCore.Api.Middleware;

public class UpdateLastActiveMiddleware
{
    private readonly RequestDelegate _next;

    public UpdateLastActiveMiddleware(RequestDelegate next)
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
                if (user != null)
                {
                    // Only update if last active was more than 5 minutes ago to save DB calls
                    if (!user.LastActiveAt.HasValue || (DateTime.UtcNow - user.LastActiveAt.Value).TotalMinutes > 5)
                    {
                        user.LastActiveAt = DateTime.UtcNow;
                        await userManager.UpdateAsync(user);
                    }
                }
            }
        }
        await _next(context);
    }
}
