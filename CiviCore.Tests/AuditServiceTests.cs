using CiviCore.Domain.Entities;
using CiviCore.Infrastructure.Data;
using CiviCore.Infrastructure.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace CiviCore.Tests;

public class AuditServiceTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly DefaultHttpContext _http = new();
    private readonly AuditService _sut;

    public AuditServiceTests()
    {
        _db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options);

        var accessor = new Mock<IHttpContextAccessor>();
        accessor.SetupGet(a => a.HttpContext).Returns(_http);

        _sut = new AuditService(_db, accessor.Object, NullLogger<AuditService>.Instance);
    }

    [Fact]
    public async Task Records_The_Event_With_Actor_And_Outcome()
    {
        var userId = Guid.NewGuid();
        await _sut.LogAsync(AuditEvents.LoginSuccess, true, userId, "a@b.com", "Signed in via password.");

        var row = await _db.Set<AuditLog>().SingleAsync();
        Assert.Equal(AuditEvents.LoginSuccess, row.Event);
        Assert.True(row.Success);
        Assert.Equal(userId, row.UserId);
        Assert.Equal("a@b.com", row.ActorEmail);
        Assert.NotEqual(default, row.CreatedAt);
    }

    // A failed login for an unknown email has no user row — the attempted address is
    // the only evidence, and losing it would hide credential stuffing.
    [Fact]
    public async Task Records_Failed_Login_With_No_User()
    {
        await _sut.LogAsync(AuditEvents.LoginFailed, false, null, "attacker@evil.com", "No account matches this email.");

        var row = await _db.Set<AuditLog>().SingleAsync();
        Assert.Null(row.UserId);
        Assert.Equal("attacker@evil.com", row.ActorEmail);
        Assert.False(row.Success);
    }

    [Fact]
    public async Task Captures_Caller_Ip_And_User_Agent()
    {
        _http.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("203.0.113.9");
        _http.Request.Headers.UserAgent = "Mozilla/5.0 (TestAgent)";

        await _sut.LogAsync(AuditEvents.LoginSuccess, true, Guid.NewGuid(), "a@b.com");

        var row = await _db.Set<AuditLog>().SingleAsync();
        Assert.Equal("203.0.113.9", row.IpAddress);
        Assert.Equal("Mozilla/5.0 (TestAgent)", row.UserAgent);
    }

    // Hostile user-agents shouldn't be able to bloat the table.
    [Fact]
    public async Task Truncates_Oversized_Fields()
    {
        _http.Request.Headers.UserAgent = new string('x', 5000);
        await _sut.LogAsync(AuditEvents.LoginSuccess, true, Guid.NewGuid(), "a@b.com", new string('y', 5000));

        var row = await _db.Set<AuditLog>().SingleAsync();
        Assert.Equal(512, row.UserAgent!.Length);
        Assert.Equal(1024, row.Detail!.Length);
    }

    // The load-bearing guarantee: auditing must never break the thing it observes.
    // If the insert fails, the login must still succeed.
    [Fact]
    public async Task Never_Throws_When_The_Write_Fails()
    {
        var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options);
        db.Dispose(); // force SaveChangesAsync to blow up

        var accessor = new Mock<IHttpContextAccessor>();
        accessor.SetupGet(a => a.HttpContext).Returns(_http);
        var sut = new AuditService(db, accessor.Object, NullLogger<AuditService>.Instance);

        var ex = await Record.ExceptionAsync(() =>
            sut.LogAsync(AuditEvents.LoginSuccess, true, Guid.NewGuid(), "a@b.com"));

        Assert.Null(ex);
    }

    // Runs outside a request (e.g. background work) — must not NRE on a null context.
    [Fact]
    public async Task Works_With_No_Ambient_Http_Context()
    {
        var accessor = new Mock<IHttpContextAccessor>();
        accessor.SetupGet(a => a.HttpContext).Returns((HttpContext?)null);
        var sut = new AuditService(_db, accessor.Object, NullLogger<AuditService>.Instance);

        await sut.LogAsync(AuditEvents.Logout, true, Guid.NewGuid(), "a@b.com");

        var row = await _db.Set<AuditLog>().SingleAsync();
        Assert.Null(row.IpAddress);
    }

    public void Dispose() => _db.Dispose();
}
