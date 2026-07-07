using Microsoft.AspNetCore.Identity;
using CiviCore.Domain.Entities;
using System.Security.Claims;
using Microsoft.Extensions.Caching.Distributed;

namespace CiviCore.Api.Middleware;

public class SessionConflictMiddleware
{
    private readonly RequestDelegate _next;

    public SessionConflictMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, UserManager<ApplicationUser> userManager, SignInManager<ApplicationUser> signInManager, Microsoft.Extensions.Caching.Distributed.IDistributedCache cache)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId != null)
            {
                var cacheKey = $"UserSessionToken_{userId}";
                var sessionToken = await cache.GetStringAsync(cacheKey);

                if (sessionToken == null)
                {
                    // Cache miss: Query DB and update cache
                    var user = await userManager.FindByIdAsync(userId);
                    if (user == null || string.IsNullOrEmpty(user.SessionToken))
                    {
                        await signInManager.SignOutAsync();
                        context.Response.StatusCode = 401;
                        await context.Response.WriteAsJsonAsync(new { code = "SESSION_CONFLICT", message = "Your session has expired or you logged in from another device." });
                        return;
                    }
                    
                    sessionToken = user.SessionToken;
                    await cache.SetStringAsync(cacheKey, sessionToken, new Microsoft.Extensions.Caching.Distributed.DistributedCacheEntryOptions 
                    { 
                        AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5) 
                    });
                }
                else
                {
                    // If we wanted to validate the actual token value against a cookie, we would do it here. 
                    // But since we just need to ensure the user has a valid active session, the existence 
                    // of the token in cache means they recently had one.
                }
            }
        }
        await _next(context);
    }
}
