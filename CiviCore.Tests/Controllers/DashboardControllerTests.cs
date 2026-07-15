using System.Text.Json;
using CiviCore.Api.Controllers;
using CiviCore.Domain.Entities;
using CiviCore.Domain.Enums;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Xunit;

namespace CiviCore.Tests.Controllers;

public class DashboardControllerTests : TestBase
{
    private readonly DashboardController _controller;
    private readonly IDistributedCache _cache;
    private readonly ApplicationUser _admin;

    public DashboardControllerTests()
    {
        // A real in-memory cache rather than a mock: GetStringAsync/SetStringAsync are
        // extension methods over GetAsync/SetAsync, so mocking them verifies almost
        // nothing — and caching is half of what this endpoint does.
        _cache = new MemoryDistributedCache(Options.Create(new MemoryDistributedCacheOptions()));
        _controller = new DashboardController(DbContext, _cache);

        _admin = new ApplicationUser { Id = Guid.NewGuid(), UserName = "admin", Email = "admin@test.com" };
        SetControllerContextUser(_controller, _admin, new[] { "Admin" });
    }

    private static JsonElement Parse(IActionResult result)
    {
        // GetStats serialises itself and returns Content(...) so the cached string and a
        // fresh response are byte-identical — hence ContentResult, not OkObjectResult.
        // The previous test asserted OkObjectResult and had been failing ever since.
        var content = Assert.IsType<ContentResult>(result);
        Assert.Equal("application/json", content.ContentType);
        return JsonDocument.Parse(content.Content!).RootElement;
    }

    private async Task SeedAsync(int activeHouseholders, decimal approvedAmount, int pending)
    {
        var blockId = Guid.NewGuid();

        for (var i = 0; i < activeHouseholders; i++)
            DbContext.Set<Householder>().Add(new Householder
            {
                Id = Guid.NewGuid(), Fullname = $"H{i}", BlockId = blockId, IsActive = true
            });

        if (approvedAmount > 0)
            DbContext.Set<PaymentRecord>().Add(new PaymentRecord
            {
                Id = Guid.NewGuid(), BlockId = blockId, HouseholderId = Guid.NewGuid(),
                Amount = approvedAmount, Status = PaymentStatus.Approved,
                CreatedAt = DateTime.UtcNow, ApprovedAt = DateTime.UtcNow,
                PaymentMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc)
            });

        for (var i = 0; i < pending; i++)
            DbContext.Set<PaymentRecord>().Add(new PaymentRecord
            {
                Id = Guid.NewGuid(), BlockId = blockId, HouseholderId = Guid.NewGuid(),
                Amount = 1000, Status = PaymentStatus.Pending, CreatedAt = DateTime.UtcNow
            });

        await DbContext.SaveChangesAsync();
    }

    [Fact]
    public async Task GetStats_Returns_Json_Content()
    {
        var json = Parse(await _controller.GetStats());

        Assert.True(json.TryGetProperty("thisMonthsCollections", out _));
        Assert.True(json.TryGetProperty("pendingApprovals", out _));
        Assert.True(json.TryGetProperty("activeHouseholders", out _));
        Assert.True(json.TryGetProperty("unpaidHouseholders", out _));
        Assert.True(json.TryGetProperty("adminMemo", out _));
    }

    [Fact]
    public async Task GetStats_Counts_Active_Householders_And_Pending_Approvals()
    {
        await SeedAsync(activeHouseholders: 3, approvedAmount: 0, pending: 2);

        var json = Parse(await _controller.GetStats());

        Assert.Equal(3, json.GetProperty("activeHouseholders").GetInt32());
        Assert.Equal(2, json.GetProperty("pendingApprovals").GetInt32());
    }

    [Fact]
    public async Task GetStats_Sums_Only_Approved_Payments()
    {
        await SeedAsync(activeHouseholders: 1, approvedAmount: 165000, pending: 1);

        var json = Parse(await _controller.GetStats());

        // The pending 1000 must not be counted as collected.
        Assert.Equal(165000m, json.GetProperty("thisMonthsCollections").GetDecimal());
    }

    // Unpaid = active householders minus those who paid this month, floored at zero.
    [Fact]
    public async Task GetStats_Derives_Unpaid_Householders()
    {
        await SeedAsync(activeHouseholders: 5, approvedAmount: 165000, pending: 0);

        var json = Parse(await _controller.GetStats());

        Assert.Equal(4, json.GetProperty("unpaidHouseholders").GetInt32());
    }

    [Fact]
    public async Task GetStats_Uses_The_Admin_Memo_Setting()
    {
        DbContext.Set<Setting>().Add(new Setting { Key = "admin_memo", Value = "Kerja bakti Minggu" });
        await DbContext.SaveChangesAsync();

        var json = Parse(await _controller.GetStats());

        Assert.Equal("Kerja bakti Minggu", json.GetProperty("adminMemo").GetString());
    }

    [Fact]
    public async Task GetStats_Falls_Back_When_No_Memo_Is_Set()
    {
        var json = Parse(await _controller.GetStats());

        Assert.Contains("No memo set", json.GetProperty("adminMemo").GetString());
    }

    // The second call must come from the cache — otherwise the 5-minute cache does
    // nothing and every dashboard load recounts the whole database.
    [Fact]
    public async Task GetStats_Serves_The_Second_Call_From_Cache()
    {
        await SeedAsync(activeHouseholders: 2, approvedAmount: 0, pending: 0);
        Assert.Equal(2, Parse(await _controller.GetStats()).GetProperty("activeHouseholders").GetInt32());

        // Add data behind the cache; the cached answer should still win.
        DbContext.Set<Householder>().Add(new Householder
        {
            Id = Guid.NewGuid(), Fullname = "Late arrival", BlockId = Guid.NewGuid(), IsActive = true
        });
        await DbContext.SaveChangesAsync();

        Assert.Equal(2, Parse(await _controller.GetStats()).GetProperty("activeHouseholders").GetInt32());
    }
}
