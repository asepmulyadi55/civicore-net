using System.Globalization;
using System.Security.Claims;
using CiviCore.Domain.Entities;
using CiviCore.Infrastructure;
using CiviCore.Infrastructure.Data;
using CiviCore.Infrastructure.Services;
using Moq;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace CiviCore.Tests;

public class SessionSettingsServiceTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly IDistributedCache _cache;
    private readonly SessionSettingsService _sut;

    public SessionSettingsServiceTests()
    {
        _db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options);
        _cache = new MemoryDistributedCache(Options.Create(new MemoryDistributedCacheOptions()));
        _sut = new SessionSettingsService(_db, _cache);
    }

    private async Task SeedAsync(string value)
    {
        _db.Set<Setting>().Add(new Setting { Key = SessionSettingsService.SettingKey, Value = value });
        await _db.SaveChangesAsync();
    }

    [Fact]
    public async Task Defaults_To_30_When_Setting_Missing()
    {
        Assert.Equal(30, await _sut.GetSessionTimeoutMinutesAsync());
    }

    [Fact]
    public async Task Reads_Configured_Value()
    {
        await SeedAsync("45");
        Assert.Equal(45, await _sut.GetSessionTimeoutMinutesAsync());
    }

    [Fact]
    public async Task Defaults_When_Value_Is_Not_A_Number()
    {
        await SeedAsync("not-a-number");
        Assert.Equal(30, await _sut.GetSessionTimeoutMinutesAsync());
    }

    // A hand-edited DB row must never widen the window beyond the admin UI's bounds.
    [Fact]
    public async Task Clamps_Value_Above_Max()
    {
        await SeedAsync("99999");
        Assert.Equal(SessionSettingsService.MaxMinutes, await _sut.GetSessionTimeoutMinutesAsync());
    }

    [Fact]
    public async Task Clamps_Value_Below_Min()
    {
        await SeedAsync("0");
        Assert.Equal(SessionSettingsService.MinMinutes, await _sut.GetSessionTimeoutMinutesAsync());
    }

    [Fact]
    public async Task Serves_From_Cache_Without_Rereading_Db()
    {
        await SeedAsync("45");
        Assert.Equal(45, await _sut.GetSessionTimeoutMinutesAsync());

        // Change the row behind the cache — the cached value should still win.
        var row = await _db.Set<Setting>().FirstAsync();
        row.Value = "60";
        await _db.SaveChangesAsync();

        Assert.Equal(45, await _sut.GetSessionTimeoutMinutesAsync());
    }

    // This is what makes the admin's "Save" take effect on the next request
    // instead of waiting out the 5-minute cache TTL.
    [Fact]
    public async Task Invalidate_Picks_Up_New_Value_Immediately()
    {
        await SeedAsync("45");
        Assert.Equal(45, await _sut.GetSessionTimeoutMinutesAsync());

        var row = await _db.Set<Setting>().FirstAsync();
        row.Value = "60";
        await _db.SaveChangesAsync();
        await _sut.InvalidateAsync();

        Assert.Equal(60, await _sut.GetSessionTimeoutMinutesAsync());
    }

    public void Dispose() => _db.Dispose();
}

public class ApplicationCookieOptionsTests
{
    private static CookieAuthenticationOptions Resolve(bool isDevelopment)
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:SupabaseConnection"] = "Host=localhost;Database=stub;Username=stub;Password=stub"
            })
            .Build();

        var services = new ServiceCollection();
        services.AddLogging();
        services.AddDistributedMemoryCache();
        services.AddInfrastructureServices(config, isDevelopment);

        return services.BuildServiceProvider()
            .GetRequiredService<IOptionsMonitor<CookieAuthenticationOptions>>()
            .Get(IdentityConstants.ApplicationScheme);
    }

    [Fact]
    public void Enforces_Idle_Timeout_With_Sliding_Expiration()
    {
        var options = Resolve(isDevelopment: false);

        // Ticket ceiling equals the max the admin UI allows; the live value is
        // enforced per-request in OnValidatePrincipal.
        Assert.Equal(TimeSpan.FromMinutes(SessionSettingsService.MaxMinutes), options.ExpireTimeSpan);
        Assert.True(options.SlidingExpiration);
    }

    [Fact]
    public void Cookie_Is_HttpOnly_And_Lax()
    {
        var options = Resolve(isDevelopment: false);
        Assert.True(options.Cookie.HttpOnly);
        Assert.Equal(SameSiteMode.Lax, options.Cookie.SameSite);
    }

    [Fact]
    public void Cookie_Requires_Https_In_Production()
    {
        Assert.Equal(CookieSecurePolicy.Always, Resolve(isDevelopment: false).Cookie.SecurePolicy);
    }

    // Local dev still runs plain HTTP (UseHttpsRedirection is commented out there),
    // so Always would silently drop the auth cookie and make login impossible.
    [Fact]
    public void Cookie_Allows_Http_In_Development()
    {
        Assert.Equal(CookieSecurePolicy.SameAsRequest, Resolve(isDevelopment: true).Cookie.SecurePolicy);
    }

    [Fact]
    public async Task Unauthenticated_Api_Calls_Get_401_Not_A_Login_Redirect_()
    {
        var options = Resolve(isDevelopment: false);
        var context = new DefaultHttpContext();
        var scheme = new AuthenticationScheme(
            IdentityConstants.ApplicationScheme, null, typeof(CookieAuthenticationHandler));

        await options.Events.OnRedirectToLogin(new RedirectContext<CookieAuthenticationOptions>(
            context, scheme, options, new AuthenticationProperties(), "/login"));

        Assert.Equal(401, context.Response.StatusCode);
    }
}

/// <summary>
/// Behaviour of the idle-timeout check itself: an active user must never be
/// signed out, an idle one must be, and the security stamp check must survive.
/// </summary>
public class IdleTimeoutValidationTests
{
    private const string LastActivityKey = "civicore.last_activity";

    private static ServiceProvider BuildProvider(
        int timeoutMinutes, Mock<ISecurityStampValidator> stampValidator,
        string? dbSessionToken = "tok-current")
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:SupabaseConnection"] = "Host=localhost;Database=stub;Username=stub;Password=stub"
            })
            .Build();

        var services = new ServiceCollection();
        services.AddLogging();
        services.AddDistributedMemoryCache();
        services.AddInfrastructureServices(config, isDevelopment: true);

        var settings = new Mock<ISessionSettingsService>();
        settings.Setup(s => s.GetSessionTimeoutMinutesAsync()).ReturnsAsync(timeoutMinutes);

        var tokens = new Mock<ISessionTokenService>();
        tokens.Setup(t => t.GetCurrentAsync(It.IsAny<Guid>())).ReturnsAsync(dbSessionToken);

        // Last registration wins, so these replace the real implementations.
        services.AddScoped(_ => settings.Object);
        services.AddScoped(_ => tokens.Object);
        services.AddScoped(_ => stampValidator.Object);
        services.AddScoped(_ => new Mock<IAuthenticationService>().Object);

        return services.BuildServiceProvider();
    }

    private static async Task<CookieValidatePrincipalContext> RunValidation(
        DateTimeOffset lastActivity, int timeoutMinutes, Mock<ISecurityStampValidator>? stampValidator = null,
        string? dbSessionToken = "tok-current", string? cookieSessionToken = "tok-current")
    {
        stampValidator ??= new Mock<ISecurityStampValidator>();
        var provider = BuildProvider(timeoutMinutes, stampValidator, dbSessionToken);

        var options = provider.GetRequiredService<IOptionsMonitor<CookieAuthenticationOptions>>()
            .Get(IdentityConstants.ApplicationScheme);

        var identity = new ClaimsIdentity("Cookies", ClaimTypes.Name, ClaimTypes.Role);
        identity.AddClaim(new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()));
        var principal = new ClaimsPrincipal(identity);

        var properties = new AuthenticationProperties { IssuedUtc = lastActivity };
        properties.SetString(LastActivityKey, lastActivity.ToString("O", CultureInfo.InvariantCulture));
        if (cookieSessionToken != null)
            properties.SetString(SessionTokenService.PropertyKey, cookieSessionToken);

        var httpContext = new DefaultHttpContext { RequestServices = provider };
        var scheme = new AuthenticationScheme(
            IdentityConstants.ApplicationScheme, null, typeof(CookieAuthenticationHandler));
        var ticket = new AuthenticationTicket(principal, properties, scheme.Name);

        var context = new CookieValidatePrincipalContext(httpContext, scheme, options, ticket);
        await options.Events.OnValidatePrincipal(context);
        return context;
    }

    // The reported bug: working continuously must never sign you out.
    [Fact]
    public async Task Active_User_Is_Not_Signed_Out()
    {
        var context = await RunValidation(DateTimeOffset.UtcNow.AddMinutes(-2), timeoutMinutes: 30);
        Assert.NotNull(context.Principal);
    }

    [Fact]
    public async Task Active_User_Just_Inside_The_Window_Is_Kept()
    {
        var context = await RunValidation(DateTimeOffset.UtcNow.AddMinutes(-29), timeoutMinutes: 30);
        Assert.NotNull(context.Principal);
    }

    [Fact]
    public async Task Idle_Beyond_Window_Is_Signed_Out()
    {
        var context = await RunValidation(DateTimeOffset.UtcNow.AddMinutes(-31), timeoutMinutes: 30);
        Assert.Null(context.Principal);
    }

    // The admin-configured value must actually drive the decision — 31 minutes
    // idle is fine at a 60-minute setting, but not at 30.
    [Fact]
    public async Task Window_Follows_The_Configured_Setting()
    {
        var context = await RunValidation(DateTimeOffset.UtcNow.AddMinutes(-31), timeoutMinutes: 60);
        Assert.NotNull(context.Principal);
    }

    [Fact]
    public async Task Activity_Refreshes_The_Cookie()
    {
        var context = await RunValidation(DateTimeOffset.UtcNow.AddMinutes(-5), timeoutMinutes: 30);
        Assert.True(context.ShouldRenew);
    }

    // AddIdentity wires SecurityStampValidator into OnValidatePrincipal; our handler
    // replaces it, so if this regresses, password/role/deactivation changes stop
    // taking effect and nothing else would notice.
    [Fact]
    public async Task Security_Stamp_Validation_Still_Runs()
    {
        var stampValidator = new Mock<ISecurityStampValidator>();
        stampValidator.Setup(v => v.ValidateAsync(It.IsAny<CookieValidatePrincipalContext>()))
            .Returns(Task.CompletedTask)
            .Verifiable();

        await RunValidation(DateTimeOffset.UtcNow.AddMinutes(-2), 30, stampValidator);

        stampValidator.Verify(v => v.ValidateAsync(It.IsAny<CookieValidatePrincipalContext>()), Times.Once);
    }

    // If the stamp check rejects (deactivated user, changed password), we must not
    // resurrect the session by carrying on with the idle check.
    [Fact]
    public async Task Rejected_Security_Stamp_Is_Not_Overridden()
    {
        var stampValidator = new Mock<ISecurityStampValidator>();
        stampValidator.Setup(v => v.ValidateAsync(It.IsAny<CookieValidatePrincipalContext>()))
            .Callback<CookieValidatePrincipalContext>(c => c.RejectPrincipal())
            .Returns(Task.CompletedTask);

        var context = await RunValidation(DateTimeOffset.UtcNow.AddMinutes(-1), 30, stampValidator);

        Assert.Null(context.Principal);
    }

    // ── Single session per account ──────────────────────────────────────────

    [Fact]
    public async Task Session_Matching_The_Current_Token_Is_Allowed()
    {
        var context = await RunValidation(DateTimeOffset.UtcNow.AddMinutes(-1), 30,
            dbSessionToken: "tok-A", cookieSessionToken: "tok-A");
        Assert.NotNull(context.Principal);
    }

    // The ask: signing in on a new device kicks the old browser on its next request.
    [Fact]
    public async Task Superseded_Session_Is_Kicked()
    {
        var context = await RunValidation(DateTimeOffset.UtcNow.AddMinutes(-1), 30,
            dbSessionToken: "tok-B-new-device", cookieSessionToken: "tok-A-old-device");
        Assert.Null(context.Principal);
    }

    // Logout nulls SessionToken; any cookie still floating around must not work.
    [Fact]
    public async Task Session_Is_Rejected_After_Logout_Clears_The_Token()
    {
        var context = await RunValidation(DateTimeOffset.UtcNow.AddMinutes(-1), 30,
            dbSessionToken: null, cookieSessionToken: "tok-A");
        Assert.Null(context.Principal);
    }

    // Cookies issued before this feature carry no token and must not be trusted.
    [Fact]
    public async Task Legacy_Cookie_Without_A_Token_Is_Rejected()
    {
        var context = await RunValidation(DateTimeOffset.UtcNow.AddMinutes(-1), 30,
            dbSessionToken: "tok-A", cookieSessionToken: null);
        Assert.Null(context.Principal);
    }

    // The kick must be distinguishable from an ordinary expiry so the UI can explain it.
    [Fact]
    public async Task Kick_Is_Flagged_So_The_401_Can_Explain_Itself()
    {
        var context = await RunValidation(DateTimeOffset.UtcNow.AddMinutes(-1), 30,
            dbSessionToken: "tok-B", cookieSessionToken: "tok-A");

        Assert.True(context.HttpContext.Items.ContainsKey("civicore.session_conflict"));
    }

    // An idle timeout is NOT a session conflict — don't tell the user they were
    // kicked from another device when they simply went for lunch.
    [Fact]
    public async Task Plain_Idle_Timeout_Is_Not_Flagged_As_A_Conflict()
    {
        var context = await RunValidation(DateTimeOffset.UtcNow.AddMinutes(-31), 30,
            dbSessionToken: "tok-A", cookieSessionToken: "tok-A");

        Assert.Null(context.Principal);
        Assert.False(context.HttpContext.Items.ContainsKey("civicore.session_conflict"));
    }
}
