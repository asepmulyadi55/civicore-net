using CiviCore.Api.Controllers;
using CiviCore.Api.Services;
using CiviCore.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace CiviCore.Tests.Controllers;

/// <summary>
/// Bulk delete is the most destructive thing the API exposes and had no tests at all.
/// These pin the guard rails: an empty request must not be treated as "delete nothing
/// successfully", and only the requested ids may be removed.
/// </summary>
public class BulkDeleteTests : TestBase
{
    private readonly UnitController _units;
    private readonly HouseholderController _householders;

    public BulkDeleteTests()
    {
        _units = new UnitController(DbContext);
        _householders = new HouseholderController(DbContext, new Mock<IEncryptionService>().Object);

        var admin = new ApplicationUser { Id = Guid.NewGuid(), UserName = "admin", Email = "admin@test.com" };
        SetControllerContextUser(_units, admin, new[] { "Admin" });
        SetControllerContextUser(_householders, admin, new[] { "Admin" });
    }

    private async Task<Block> SeedBlockAsync()
    {
        var block = new Block { Id = Guid.NewGuid(), Name = "A" };
        DbContext.Set<Block>().Add(block);
        await DbContext.SaveChangesAsync();
        return block;
    }

    private async Task<Unit> SeedUnitAsync(Block block, string number)
    {
        var unit = new Unit { Id = Guid.NewGuid(), BlockId = block.Id, UnitNumber = number };
        DbContext.Set<Unit>().Add(unit);
        await DbContext.SaveChangesAsync();
        return unit;
    }

    // ── Units ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Unit_BulkDelete_Removes_Only_The_Requested_Ids()
    {
        var block = await SeedBlockAsync();
        var doomed = await SeedUnitAsync(block, "A-1");
        var keeper = await SeedUnitAsync(block, "A-2");

        var result = await _units.BulkDelete(new UnitController.BulkDeleteRequest { Ids = new List<Guid> { doomed.Id } });

        Assert.IsType<NoContentResult>(result);
        Assert.False(await DbContext.Set<Unit>().AnyAsync(u => u.Id == doomed.Id));
        Assert.True(await DbContext.Set<Unit>().AnyAsync(u => u.Id == keeper.Id));
    }

    // An empty id list must be rejected, not silently succeed — a client bug sending []
    // should never look like a successful delete.
    [Fact]
    public async Task Unit_BulkDelete_Rejects_An_Empty_Request()
    {
        var result = await _units.BulkDelete(new UnitController.BulkDeleteRequest { Ids = new List<Guid>() });
        Assert.IsType<BadRequestResult>(result);
    }

    // A client that omits the field entirely must not be treated as a valid request.
    [Fact]
    public async Task Unit_BulkDelete_Rejects_A_Null_Id_List()
    {
        var result = await _units.BulkDelete(new UnitController.BulkDeleteRequest { Ids = null! });
        Assert.IsType<BadRequestResult>(result);
    }

    // Deleting an occupied unit would orphan its householder.
    [Fact]
    public async Task Unit_BulkDelete_Refuses_Units_That_Still_Have_Householders()
    {
        var block = await SeedBlockAsync();
        var occupied = await SeedUnitAsync(block, "A-1");
        DbContext.Set<Householder>().Add(new Householder
        {
            Id = Guid.NewGuid(), Fullname = "Resident", UnitId = occupied.Id, BlockId = block.Id
        });
        await DbContext.SaveChangesAsync();

        var result = await _units.BulkDelete(new UnitController.BulkDeleteRequest { Ids = new List<Guid> { occupied.Id } });

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.True(await DbContext.Set<Unit>().AnyAsync(u => u.Id == occupied.Id));
    }

    // A mixed batch must still delete the free ones and report the rest.
    [Fact]
    public async Task Unit_BulkDelete_Deletes_Free_Units_And_Reports_Blocked_Ones()
    {
        var block = await SeedBlockAsync();
        var free = await SeedUnitAsync(block, "A-1");
        var occupied = await SeedUnitAsync(block, "A-2");
        DbContext.Set<Householder>().Add(new Householder
        {
            Id = Guid.NewGuid(), Fullname = "Resident", UnitId = occupied.Id, BlockId = block.Id
        });
        await DbContext.SaveChangesAsync();

        var result = await _units.BulkDelete(new UnitController.BulkDeleteRequest
        {
            Ids = new List<Guid> { free.Id, occupied.Id }
        });

        var bad = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Contains("A-2", bad.Value!.ToString());
        Assert.False(await DbContext.Set<Unit>().AnyAsync(u => u.Id == free.Id));
        Assert.True(await DbContext.Set<Unit>().AnyAsync(u => u.Id == occupied.Id));
    }

    [Fact]
    public async Task Unit_BulkDelete_Ignores_Ids_That_Do_Not_Exist()
    {
        var block = await SeedBlockAsync();
        var real = await SeedUnitAsync(block, "A-1");

        var result = await _units.BulkDelete(new UnitController.BulkDeleteRequest
        {
            Ids = new List<Guid> { real.Id, Guid.NewGuid() }
        });

        Assert.IsType<NoContentResult>(result);
        Assert.Equal(0, await DbContext.Set<Unit>().CountAsync());
    }

    // ── Householders ────────────────────────────────────────────────────────

    [Fact]
    public async Task Householder_BulkDelete_Removes_Only_The_Requested_Ids()
    {
        var block = await SeedBlockAsync();
        var doomed = new Householder { Id = Guid.NewGuid(), Fullname = "Gone", BlockId = block.Id };
        var keeper = new Householder { Id = Guid.NewGuid(), Fullname = "Stays", BlockId = block.Id };
        DbContext.Set<Householder>().AddRange(doomed, keeper);
        await DbContext.SaveChangesAsync();

        var result = await _householders.BulkDelete(new HouseholderController.BulkDeleteRequest
        {
            Ids = new List<Guid> { doomed.Id }
        });

        Assert.IsType<NoContentResult>(result);
        Assert.False(await DbContext.Set<Householder>().AnyAsync(h => h.Id == doomed.Id));
        Assert.True(await DbContext.Set<Householder>().AnyAsync(h => h.Id == keeper.Id));
    }

    [Fact]
    public async Task Householder_BulkDelete_Rejects_An_Empty_Request()
    {
        var result = await _householders.BulkDelete(new HouseholderController.BulkDeleteRequest { Ids = new List<Guid>() });
        Assert.IsType<BadRequestResult>(result);
    }
}
