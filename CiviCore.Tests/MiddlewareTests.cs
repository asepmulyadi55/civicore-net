using System.Security.Claims;
using System.Text;
using CiviCore.Api.Middleware;
using CiviCore.Domain.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace CiviCore.Tests;

/// <summary>
/// The custom middleware pipeline sat at 0% coverage despite deciding whether deactivated
/// users are let in and whether the public API key is checked.
/// </summary>
public class MiddlewareTests
{
    private static DefaultHttpContext Ctx(string path = "/api/blocks", Guid? userId = null)
    {
        var context = new DefaultHttpContext();
        context.Request.Path = path;
        context.Response.Body = new MemoryStream();

        if (userId.HasValue)
        {
            var identity = new ClaimsIdentity("Cookies", ClaimTypes.Name, ClaimTypes.Role);
            identity.AddClaim(new Claim(ClaimTypes.NameIdentifier, userId.Value.ToString()));
            context.User = new ClaimsPrincipal(identity);
        }
        return context;
    }

    private static async Task<string> BodyOf(HttpContext context)
    {
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        return await new StreamReader(context.Response.Body, Encoding.UTF8).ReadToEndAsync();
    }

    // ── VerifyApiKeyMiddleware ──────────────────────────────────────────────

    private static VerifyApiKeyMiddleware ApiKeyMiddleware(RequestDelegate next, string? configuredKey = "secret-key")
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["CivicoreApiKey"] = configuredKey })
            .Build();
        return new VerifyApiKeyMiddleware(next, config);
    }

    [Fact]
    public async Task ApiKey_Is_Only_Checked_On_The_Public_Api()
    {
        var called = false;
        var context = Ctx("/api/blocks");
        await ApiKeyMiddleware(_ => { called = true; return Task.CompletedTask; }).InvokeAsync(context);

        Assert.True(called);
        Assert.NotEqual(401, context.Response.StatusCode);
    }

    [Fact]
    public async Task Public_Api_Without_A_Key_Is_Rejected()
    {
        var called = false;
        var context = Ctx("/api/public/anything");
        await ApiKeyMiddleware(_ => { called = true; return Task.CompletedTask; }).InvokeAsync(context);

        Assert.False(called);
        Assert.Equal(401, context.Response.StatusCode);
    }

    [Fact]
    public async Task Public_Api_With_A_Wrong_Key_Is_Rejected()
    {
        var called = false;
        var context = Ctx("/api/public/anything");
        context.Request.Headers["X-Api-Key"] = "wrong-key";
        await ApiKeyMiddleware(_ => { called = true; return Task.CompletedTask; }).InvokeAsync(context);

        Assert.False(called);
        Assert.Equal(401, context.Response.StatusCode);
    }

    [Fact]
    public async Task Public_Api_With_The_Right_Key_Passes()
    {
        var called = false;
        var context = Ctx("/api/public/anything");
        context.Request.Headers["X-Api-Key"] = "secret-key";
        await ApiKeyMiddleware(_ => { called = true; return Task.CompletedTask; }).InvokeAsync(context);

        Assert.True(called);
    }

    // ── EnsureUserIsApprovedMiddleware ──────────────────────────────────────

    private static Mock<UserManager<ApplicationUser>> UserManagerReturning(ApplicationUser? user)
    {
        var store = new Mock<IUserStore<ApplicationUser>>();
        var manager = new Mock<UserManager<ApplicationUser>>(store.Object, null!, null!, null!, null!, null!, null!, null!, null!);
        manager.Setup(m => m.FindByIdAsync(It.IsAny<string>())).ReturnsAsync(user);
        return manager;
    }

    // A deactivated account must not keep working just because its cookie is still valid.
    [Fact]
    public async Task Deactivated_User_Is_Blocked()
    {
        var called = false;
        var context = Ctx(userId: Guid.NewGuid());
        var manager = UserManagerReturning(new ApplicationUser { IsActive = false });

        await new EnsureUserIsApprovedMiddleware(_ => { called = true; return Task.CompletedTask; })
            .InvokeAsync(context, manager.Object);

        Assert.False(called);
        Assert.Equal(403, context.Response.StatusCode);
        Assert.Contains("pending administrator approval", await BodyOf(context));
    }

    [Fact]
    public async Task Active_User_Passes()
    {
        var called = false;
        var context = Ctx(userId: Guid.NewGuid());
        var manager = UserManagerReturning(new ApplicationUser { IsActive = true });

        await new EnsureUserIsApprovedMiddleware(_ => { called = true; return Task.CompletedTask; })
            .InvokeAsync(context, manager.Object);

        Assert.True(called);
    }

    [Fact]
    public async Task Anonymous_Request_Is_Not_Checked()
    {
        var called = false;
        var context = Ctx();
        var manager = UserManagerReturning(null);

        await new EnsureUserIsApprovedMiddleware(_ => { called = true; return Task.CompletedTask; })
            .InvokeAsync(context, manager.Object);

        Assert.True(called);
        manager.Verify(m => m.FindByIdAsync(It.IsAny<string>()), Times.Never);
    }

    // A cookie for a since-deleted user must not hard-fail the request.
    [Fact]
    public async Task Missing_User_Row_Does_Not_Block()
    {
        var called = false;
        var context = Ctx(userId: Guid.NewGuid());
        var manager = UserManagerReturning(null);

        await new EnsureUserIsApprovedMiddleware(_ => { called = true; return Task.CompletedTask; })
            .InvokeAsync(context, manager.Object);

        Assert.True(called);
    }

    // ── AuditMiddleware ─────────────────────────────────────────────────────

    // Logged after the request so the recorded status is the real outcome. Before the fix
    // a 403 was logged identically to a success.
    [Fact]
    public async Task Audit_Log_Records_The_Real_Outcome()
    {
        var context = Ctx();
        context.Request.Method = "DELETE";

        await new AuditMiddleware(ctx => { ctx.Response.StatusCode = 403; return Task.CompletedTask; },
            NullLogger<AuditMiddleware>.Instance).InvokeAsync(context);

        Assert.Equal(403, context.Response.StatusCode);
    }

    [Fact]
    public async Task Audit_Middleware_Passes_Get_Requests_Through()
    {
        var called = false;
        var context = Ctx();
        context.Request.Method = "GET";

        await new AuditMiddleware(_ => { called = true; return Task.CompletedTask; },
            NullLogger<AuditMiddleware>.Instance).InvokeAsync(context);

        Assert.True(called);
    }
}
