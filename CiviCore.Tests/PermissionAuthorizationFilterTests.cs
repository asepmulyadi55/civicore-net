using System.Security.Claims;
using CiviCore.Api.Authorization;
using CiviCore.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace CiviCore.Tests;

/// <summary>
/// The filter is the only thing standing between an authenticated user and every admin
/// endpoint, so its decisions are pinned here rather than trusted to a green build.
/// </summary>
public class PermissionAuthorizationFilterTests
{
    private static AuthorizationFilterContext BuildContext(
        string method,
        object[] endpointMetadata,
        string? roleName = "Resident",
        bool authenticated = true)
    {
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Method = method;

        if (authenticated)
        {
            var identity = new ClaimsIdentity("Cookies", ClaimTypes.Name, ClaimTypes.Role);
            identity.AddClaim(new Claim(ClaimTypes.Name, "someone@test.com"));
            if (roleName != null) identity.AddClaim(new Claim(ClaimTypes.Role, roleName));
            httpContext.User = new ClaimsPrincipal(identity);
        }

        httpContext.SetEndpoint(new Endpoint(
            _ => Task.CompletedTask,
            new EndpointMetadataCollection(endpointMetadata),
            "TestEndpoint"));

        var actionContext = new ActionContext(httpContext, new RouteData(), new ActionDescriptor());
        return new AuthorizationFilterContext(actionContext, new List<IFilterMetadata>());
    }

    private static PermissionAuthorizationFilter BuildFilter(params string[] grantedKeys)
    {
        var permissions = new Mock<IUserPermissionService>();
        permissions.Setup(p => p.RoleHasAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync((string _, string key) => grantedKeys.Contains(key) || grantedKeys.Contains("*"));
        return new PermissionAuthorizationFilter(permissions.Object, NullLogger<PermissionAuthorizationFilter>.Instance);
    }

    // The whole point: a resident calling an admin endpoint directly must be refused,
    // even though the UI never shows them the button.
    [Fact]
    public async Task Denies_When_The_Role_Lacks_The_Permission()
    {
        var context = BuildContext("DELETE", new object[] { new RequirePermissionModuleAttribute("householders") });
        await BuildFilter("overview.view").OnAuthorizationAsync(context);

        Assert.IsType<ForbidResult>(context.Result);
    }

    [Fact]
    public async Task Allows_When_The_Role_Holds_The_Permission()
    {
        var context = BuildContext("DELETE", new object[] { new RequirePermissionModuleAttribute("householders") });
        await BuildFilter("householders.delete").OnAuthorizationAsync(context);

        Assert.Null(context.Result);
    }

    [Theory]
    [InlineData("GET", "blocks.view")]
    [InlineData("POST", "blocks.create")]
    [InlineData("PUT", "blocks.edit")]
    [InlineData("PATCH", "blocks.edit")]
    [InlineData("DELETE", "blocks.delete")]
    public async Task Derives_The_Key_From_The_Http_Verb(string method, string expectedKey)
    {
        var context = BuildContext(method, new object[] { new RequirePermissionModuleAttribute("blocks") });
        await BuildFilter(expectedKey).OnAuthorizationAsync(context);

        Assert.Null(context.Result);
    }

    // An explicit key must win: POST /payments/{id}/approve is an approval, not a create.
    [Fact]
    public async Task Explicit_Permission_Overrides_The_Verb_Convention()
    {
        var context = BuildContext("POST", new object[]
        {
            new RequirePermissionModuleAttribute("payments"),
            new RequirePermissionAttribute("payments.approve")
        });

        // Holds create but not approve — the override must still refuse.
        await BuildFilter("payments.create").OnAuthorizationAsync(context);

        Assert.IsType<ForbidResult>(context.Result);
    }

    // The core safety property: forgetting to annotate an endpoint must fail closed,
    // never leave it open.
    [Fact]
    public async Task Denies_An_Endpoint_That_Declares_Nothing()
    {
        var context = BuildContext("GET", Array.Empty<object>());
        await BuildFilter("*").OnAuthorizationAsync(context);

        Assert.IsType<ForbidResult>(context.Result);
    }

    [Fact]
    public async Task Public_Endpoints_Are_Untouched()
    {
        var context = BuildContext("GET", new object[] { new AllowAnonymousAttribute() }, authenticated: false);
        await BuildFilter().OnAuthorizationAsync(context);

        Assert.Null(context.Result);
    }

    [Fact]
    public async Task Explicit_Opt_Out_Is_Allowed_For_Any_Signed_In_User()
    {
        var context = BuildContext("POST", new object[] { new NoPermissionRequiredAttribute() });
        await BuildFilter().OnAuthorizationAsync(context);

        Assert.Null(context.Result);
    }

    // Anonymous callers are the auth middleware's problem (401), not the filter's (403).
    [Fact]
    public async Task Unauthenticated_Requests_Fall_Through_To_The_Auth_Middleware()
    {
        var context = BuildContext("GET", new object[] { new RequirePermissionModuleAttribute("blocks") }, authenticated: false);
        await BuildFilter().OnAuthorizationAsync(context);

        Assert.Null(context.Result);
    }

    [Fact]
    public async Task Denies_A_Signed_In_User_With_No_Role()
    {
        var context = BuildContext("GET", new object[] { new RequirePermissionModuleAttribute("blocks") }, roleName: null);
        await BuildFilter("*").OnAuthorizationAsync(context);

        Assert.IsType<ForbidResult>(context.Result);
    }
}

public class UserPermissionServiceSuperRoleTests
{
    [Theory]
    [InlineData("Admin")]
    [InlineData("admin")]
    [InlineData("Super Admin")]
    public void Super_Roles_Are_Recognised_Case_Insensitively(string role) =>
        Assert.True(UserPermissionService.IsSuperRole(role));

    [Theory]
    [InlineData("Resident")]
    [InlineData("Coordinator")]
    [InlineData(null)]
    public void Ordinary_Roles_Are_Not_Super(string? role) =>
        Assert.False(UserPermissionService.IsSuperRole(role));
}
