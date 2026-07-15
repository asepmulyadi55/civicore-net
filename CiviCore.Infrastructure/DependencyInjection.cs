using System.Globalization;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using CiviCore.Infrastructure.Data;
using CiviCore.Infrastructure.Services;
using CiviCore.Domain.Entities;

namespace CiviCore.Infrastructure;

public static class DependencyInjection
{
    /// <summary>Auth ticket property holding the last request time we observed.</summary>
    private const string LastActivityKey = "civicore.last_activity";

    /// <summary>Set on HttpContext.Items so the 401 can explain itself to the client.</summary>
    private const string SessionConflictItemKey = "civicore.session_conflict";

    /// <summary>
    /// Don't reissue the cookie on every single request — only once the recorded
    /// activity is this stale. Keeps Set-Cookie off most responses.
    /// </summary>
    private static readonly TimeSpan RenewAfter = TimeSpan.FromMinutes(1);

    public static IServiceCollection AddInfrastructureServices(
        this IServiceCollection services,
        IConfiguration configuration,
        bool isDevelopment = false)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("SupabaseConnection")));

        services.AddIdentity<ApplicationUser, ApplicationRole>(opt => {
            opt.Password.RequireDigit = true;
            opt.Password.RequiredLength = 8;
            opt.Lockout.MaxFailedAccessAttempts = 5;
        })
        .AddEntityFrameworkStores<AppDbContext>()
        .AddDefaultTokenProviders();

        services.AddScoped<ISessionSettingsService, SessionSettingsService>();
        services.AddScoped<ISessionTokenService, SessionTokenService>();

        services.ConfigureApplicationCookie(options =>
        {
            options.Cookie.HttpOnly = true;
            options.Cookie.SameSite = SameSiteMode.Lax;
            // Always in production; SameAsRequest locally so plain-HTTP dev still works.
            options.Cookie.SecurePolicy = isDevelopment
                ? CookieSecurePolicy.SameAsRequest
                : CookieSecurePolicy.Always;

            // Ceiling for the ticket itself. The admin-configurable idle window is
            // enforced in OnValidatePrincipal below and is always <= this.
            options.ExpireTimeSpan = TimeSpan.FromMinutes(SessionSettingsService.MaxMinutes);
            options.SlidingExpiration = true;

            options.Events.OnRedirectToLogin = async context =>
            {
                context.Response.StatusCode = 401;

                // Distinguish "kicked by a login elsewhere" from an ordinary expiry so
                // the client can say why instead of dumping the user at /login silently.
                if (context.HttpContext.Items.ContainsKey(SessionConflictItemKey))
                {
                    context.Response.ContentType = "application/json";
                    await context.Response.WriteAsJsonAsync(new
                    {
                        code = "SESSION_CONFLICT",
                        message = "Your account was signed in on another device."
                    });
                }
            };
            options.Events.OnRedirectToAccessDenied = context =>
            {
                context.Response.StatusCode = 403;
                return Task.CompletedTask;
            };

            options.Events.OnValidatePrincipal = async context =>
            {
                // AddIdentity registers SecurityStampValidator on this event. Assigning
                // our own handler replaces it, so it must be invoked explicitly or
                // password changes, role changes and deactivations stop taking effect.
                await SecurityStampValidator.ValidatePrincipalAsync(context);
                if (context.Principal?.Identity?.IsAuthenticated != true) return;

                // Single session per account: a cookie carrying a superseded token was
                // issued to a device that has since been replaced by a newer sign-in.
                if (Guid.TryParse(
                        context.Principal.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
                {
                    var tokens = context.HttpContext.RequestServices
                        .GetRequiredService<ISessionTokenService>();
                    var expected = await tokens.GetCurrentAsync(userId);
                    var presented = context.Properties.GetString(SessionTokenService.PropertyKey);

                    if (string.IsNullOrEmpty(expected) || presented != expected)
                    {
                        context.HttpContext.Items[SessionConflictItemKey] = true;
                        context.RejectPrincipal();
                        await context.HttpContext.SignOutAsync(IdentityConstants.ApplicationScheme);
                        return;
                    }
                }

                var settings = context.HttpContext.RequestServices
                    .GetRequiredService<ISessionSettingsService>();
                var idleWindow = TimeSpan.FromMinutes(await settings.GetSessionTimeoutMinutesAsync());

                var now = DateTimeOffset.UtcNow;
                var lastActivity = ReadLastActivity(context.Properties)
                    ?? context.Properties.IssuedUtc
                    ?? now;

                if (now - lastActivity > idleWindow)
                {
                    context.RejectPrincipal();
                    await context.HttpContext.SignOutAsync(IdentityConstants.ApplicationScheme);
                    return;
                }

                if (now - lastActivity >= RenewAfter)
                {
                    context.Properties.SetString(
                        LastActivityKey, now.ToString("O", CultureInfo.InvariantCulture));
                    context.ShouldRenew = true;
                }
            };
        });

        return services;
    }

    private static DateTimeOffset? ReadLastActivity(AuthenticationProperties properties)
    {
        var raw = properties.GetString(LastActivityKey);
        if (raw == null) return null;
        return DateTimeOffset.TryParse(
            raw, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var value)
            ? value
            : null;
    }
}
