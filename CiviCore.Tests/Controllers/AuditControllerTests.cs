using CiviCore.Api.Controllers;
using CiviCore.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace CiviCore.Tests.Controllers;

public class AuditControllerTests : TestBase
{
    private readonly AuditController _controller;
    private readonly ApplicationUser _user;

    public AuditControllerTests()
    {
        _controller = new AuditController(DbContext, MockUserManager.Object, MockRoleManager.Object);
        _user = new ApplicationUser { Id = Guid.NewGuid(), UserName = "admin", Email = "admin@test.com" };
        SetControllerContextUser(_controller, _user, new[] { "Admin" });
        MockUserManager.Setup(x => x.GetUserAsync(It.IsAny<System.Security.Claims.ClaimsPrincipal>())).ReturnsAsync(_user);
        // Same approach as UserControllerTests: back RoleManager.Roles with the real
        // in-memory DbSet so Include/FirstOrDefaultAsync work.
        MockRoleManager.Setup(x => x.Roles).Returns(DbContext.Roles);
    }

    private void ActAsAdmin() =>
        MockUserManager.Setup(x => x.GetRolesAsync(_user)).ReturnsAsync(new List<string> { "Admin" });

    /// <summary>Puts the caller in a non-admin role holding exactly the given permission keys.</summary>
    private async Task ActAsRoleWithPermissionsAsync(string roleName, params string[] permissionKeys)
    {
        MockUserManager.Setup(x => x.GetRolesAsync(_user)).ReturnsAsync(new List<string> { roleName });

        var role = new ApplicationRole { Id = Guid.NewGuid(), Name = roleName, NormalizedName = roleName.ToUpper() };
        DbContext.Roles.Add(role);
        foreach (var key in permissionKeys)
            DbContext.Set<Permission>().Add(new Permission { Id = Guid.NewGuid(), RoleId = role.Id, PermissionKey = key });
        await DbContext.SaveChangesAsync();
    }

    // The controller returns anonymous types, which are internal to their assembly, so
    // `dynamic` cannot bind to them from here — read them by reflection instead.
    private static List<object> DataOf(IActionResult result)
    {
        var ok = Assert.IsType<OkObjectResult>(result);
        var data = ok.Value!.GetType().GetProperty("data")!.GetValue(ok.Value)!;
        return ((System.Collections.IEnumerable)data).Cast<object>().ToList();
    }

    private static string? Field(object row, string name) =>
        row.GetType().GetProperty(name)?.GetValue(row)?.ToString();

    private async Task SeedAsync(params (string evt, string email, DateTime when)[] rows)
    {
        foreach (var (evt, email, when) in rows)
            DbContext.Set<AuditLog>().Add(new AuditLog
            {
                Id = Guid.NewGuid(), Event = evt, ActorEmail = email,
                Success = evt == AuditEvents.LoginSuccess, CreatedAt = when,
                IpAddress = "203.0.113.5", UserId = Guid.NewGuid()
            });
        await DbContext.SaveChangesAsync();
    }

    // The rows carry every user's email and IP. Hiding the menu is not access control —
    // the endpoint itself must refuse.
    [Fact]
    public async Task Rejects_A_Role_Without_The_Permission()
    {
        await ActAsRoleWithPermissionsAsync("Resident", "overview.view");

        var result = await _controller.GetAll(null, null, null, null);

        Assert.IsType<ForbidResult>(result);
    }

    [Fact]
    public async Task Allows_A_Non_Admin_Role_Granted_Audit_View()
    {
        await ActAsRoleWithPermissionsAsync("Auditor", "audit.view");

        var result = await _controller.GetAll(null, null, null, null);

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Allows_An_Admin()
    {
        ActAsAdmin();
        await SeedAsync((AuditEvents.LoginSuccess, "a@b.com", DateTime.UtcNow));

        var result = await _controller.GetAll(null, null, null, null);

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Returns_Newest_First()
    {
        ActAsAdmin();
        var now = DateTime.UtcNow;
        await SeedAsync(
            (AuditEvents.Logout, "old@b.com", now.AddHours(-2)),
            (AuditEvents.LoginSuccess, "new@b.com", now));

        var data = DataOf(await _controller.GetAll(null, null, null, null));

        Assert.Equal("new@b.com", Field(data[0], "actorEmail"));
    }

    [Fact]
    public async Task Filters_By_Event()
    {
        ActAsAdmin();
        var now = DateTime.UtcNow;
        await SeedAsync(
            (AuditEvents.LoginSuccess, "ok@b.com", now),
            (AuditEvents.LoginFailed, "bad@b.com", now));

        var data = DataOf(await _controller.GetAll(null, AuditEvents.LoginFailed, null, null));

        Assert.Single(data);
        Assert.Equal("bad@b.com", Field(data[0], "actorEmail"));
    }

    [Fact]
    public async Task Searches_By_Email()
    {
        ActAsAdmin();
        var now = DateTime.UtcNow;
        await SeedAsync(
            (AuditEvents.LoginSuccess, "alice@b.com", now),
            (AuditEvents.LoginSuccess, "bob@b.com", now));

        var data = DataOf(await _controller.GetAll("alice", null, null, null));

        Assert.Single(data);
        Assert.Equal("alice@b.com", Field(data[0], "actorEmail"));
    }

    // `to` is inclusive of the whole day, so an event later the same day must still match.
    [Fact]
    public async Task Date_Range_Includes_The_Whole_End_Day()
    {
        ActAsAdmin();
        var day = new DateTime(2026, 7, 10, 23, 30, 0, DateTimeKind.Utc);
        await SeedAsync((AuditEvents.LoginSuccess, "a@b.com", day));

        var data = DataOf(await _controller.GetAll(null, null, "2026-07-10", "2026-07-10"));

        Assert.Single(data);
    }

    [Fact]
    public async Task Event_Types_Are_Refused_Without_Permission()
    {
        await ActAsRoleWithPermissionsAsync("Resident", "overview.view");

        Assert.IsType<ForbidResult>(await _controller.GetEventTypes());
    }
}
