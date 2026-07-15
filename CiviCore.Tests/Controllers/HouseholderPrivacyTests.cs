using System.Reflection;
using CiviCore.Api.Controllers;
using CiviCore.Api.Services;
using CiviCore.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace CiviCore.Tests.Controllers;

/// <summary>
/// Nomor KK is the only field encrypted at rest. These tests pin that it never leaves the
/// API on the general read paths, and that a read can never write plaintext back.
/// </summary>
public class HouseholderPrivacyTests : TestBase
{
    private readonly HouseholderController _controller;
    private readonly IEncryptionService _encryption;

    public HouseholderPrivacyTests()
    {
        _encryption = new EncryptionService(new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["Encryption:Key"] = "test_key_that_is_32_bytes_long!!" })
            .Build());

        _controller = new HouseholderController(DbContext, _encryption);
        var admin = new ApplicationUser { Id = Guid.NewGuid(), UserName = "admin", Email = "admin@test.com" };
        SetControllerContextUser(_controller, admin, new[] { "Admin" });
    }

    private const string Kk = "3273010101900001";

    private async Task<Householder> SeedAsync()
    {
        var block = new Block { Id = Guid.NewGuid(), Name = "A" };
        var unit = new Unit { Id = Guid.NewGuid(), BlockId = block.Id, UnitNumber = "A-1" };
        var h = new Householder
        {
            Id = Guid.NewGuid(), Fullname = "Warga", IsActive = true,
            BlockId = block.Id, UnitId = unit.Id,
            FamilyCardNumber = _encryption.Encrypt(Kk)
        };
        DbContext.AddRange(block, unit, h);
        await DbContext.SaveChangesAsync();
        DbContext.ChangeTracker.Clear();
        return h;
    }

    private static IEnumerable<Householder> ListOf(IActionResult result)
    {
        var ok = Assert.IsType<OkObjectResult>(result);
        var data = ok.Value!.GetType().GetProperty("data")!.GetValue(ok.Value)!;
        return ((System.Collections.IEnumerable)data).Cast<Householder>();
    }

    // The list is the worst offender: one request returned every household's KK number.
    [Fact]
    public async Task List_Does_Not_Return_The_Family_Card_Number()
    {
        await SeedAsync();

        var rows = ListOf(await _controller.GetAll(null, null, null));

        Assert.All(rows, h => Assert.Null(h.FamilyCardNumber));
    }

    [Fact]
    public async Task Single_Read_Does_Not_Return_The_Family_Card_Number()
    {
        var seeded = await SeedAsync();

        var ok = Assert.IsType<OkObjectResult>(await _controller.GetById(seeded.Id));

        Assert.Null(Assert.IsType<Householder>(ok.Value).FamilyCardNumber);
    }

    // Reading must never damage the stored value. Before AsNoTracking, the decrypted
    // plaintext sat on a tracked entity, one SaveChanges away from being written back.
    [Fact]
    public async Task Reading_Leaves_The_Stored_Value_Encrypted()
    {
        var seeded = await SeedAsync();

        await _controller.GetAll(null, null, null);
        await _controller.GetById(seeded.Id);
        await DbContext.SaveChangesAsync(); // would persist any mutation made on a tracked entity

        DbContext.ChangeTracker.Clear();
        var stored = (await DbContext.Set<Householder>().AsNoTracking().FirstAsync(h => h.Id == seeded.Id)).FamilyCardNumber!;

        Assert.NotEqual(Kk, stored);                     // still not plaintext
        Assert.Equal(Kk, _encryption.Decrypt(stored));   // and still decryptable
    }

    // Omitting the field from responses must not cause an edit to wipe it, since the UI
    // round-trips the object back on save.
    [Fact]
    public async Task Updating_Without_Supplying_It_Preserves_The_Stored_Value()
    {
        var seeded = await SeedAsync();

        await _controller.Update(seeded.Id, new HouseholderController.UpdateHouseholderDto
        {
            Fullname = "Warga Baru",
            FamilyCardNumber = null
        });

        DbContext.ChangeTracker.Clear();
        var stored = (await DbContext.Set<Householder>().AsNoTracking().FirstAsync(h => h.Id == seeded.Id)).FamilyCardNumber!;

        Assert.Equal(Kk, _encryption.Decrypt(stored));
    }

    [Fact]
    public async Task Creating_Stores_It_Encrypted_Not_Plaintext()
    {
        var block = new Block { Id = Guid.NewGuid(), Name = "B" };
        DbContext.Add(block);
        await DbContext.SaveChangesAsync();

        await _controller.Create(new Householder
        {
            Id = Guid.NewGuid(), Fullname = "Baru", BlockId = block.Id, FamilyCardNumber = Kk
        });

        DbContext.ChangeTracker.Clear();
        var stored = (await DbContext.Set<Householder>().AsNoTracking().FirstAsync(h => h.Fullname == "Baru")).FamilyCardNumber!;

        Assert.NotEqual(Kk, stored);
        Assert.Equal(Kk, _encryption.Decrypt(stored));
    }

    // Guards the resident portal, which used to return the raw stored value (ciphertext).
    [Fact]
    public void Resident_Portal_Does_Not_Expose_The_Family_Card_Number()
    {
        var source = File.ReadAllText(Path.Combine(RepoRoot(), "CiviCore.Api", "Controllers", "ResidentPortalController.cs"));

        Assert.DoesNotContain("familyCardNumber = ", source);
    }

    private static string RepoRoot()
    {
        var dir = new DirectoryInfo(Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location)!);
        while (dir != null && !File.Exists(Path.Combine(dir.FullName, "CiviCore.sln"))) dir = dir.Parent;
        return dir!.FullName;
    }
}
