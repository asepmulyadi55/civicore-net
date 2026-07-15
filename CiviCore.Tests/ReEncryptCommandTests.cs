using CiviCore.Api.Services;
using CiviCore.Domain.Entities;
using CiviCore.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CiviCore.Tests;

/// <summary>
/// The migration rewrites the only encrypted field in the system. A mistake here silently
/// destroys residents' Nomor KK, so every branch is pinned.
/// </summary>
public class ReEncryptCommandTests : IDisposable
{
    private const string OldKey = "old_key_exactly_32_bytes_long!!!";
    private const string NewKey = "new_key_exactly_32_bytes_long!!!";

    private readonly AppDbContext _db;
    private readonly EncryptionService _old = EncryptionService.WithRawKey(OldKey);
    private readonly EncryptionService _new = EncryptionService.WithRawKey(NewKey);
    private readonly StringWriter _output = new();

    public ReEncryptCommandTests() =>
        _db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options);

    private async Task<Householder> SeedAsync(string? storedValue)
    {
        var h = new Householder { Id = Guid.NewGuid(), Fullname = "Warga", FamilyCardNumber = storedValue };
        _db.Set<Householder>().Add(h);
        await _db.SaveChangesAsync();
        return h;
    }

    private Task<ReEncryptCommand.Result> Run(bool apply) =>
        ReEncryptCommand.ExecuteAsync(_db, OldKey, NewKey, apply, _output);

    // ── Dry run ─────────────────────────────────────────────────────────────

    // The safety valve: a dry run must report what it would do and change nothing.
    [Fact]
    public async Task Dry_Run_Reports_Without_Writing()
    {
        var stored = _old.Encrypt("3273010101900001");
        var h = await SeedAsync(stored);

        var result = await Run(apply: false);

        Assert.Equal(1, result.ReEncrypted);
        Assert.False(result.Applied);
        Assert.Equal(stored, (await _db.Set<Householder>().FindAsync(h.Id))!.FamilyCardNumber);
    }

    // ── Apply ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Apply_Re_Encrypts_So_The_New_Key_Can_Read_It()
    {
        const string kk = "3273010101900001";
        var h = await SeedAsync(_old.Encrypt(kk));

        var result = await Run(apply: true);

        Assert.Equal(1, result.ReEncrypted);
        var after = (await _db.Set<Householder>().FindAsync(h.Id))!.FamilyCardNumber!;
        Assert.Equal(kk, _new.Decrypt(after));
    }

    // The whole point of the migration: the old key must no longer open the data.
    [Fact]
    public async Task Apply_Leaves_The_Old_Key_Unable_To_Read_It()
    {
        var h = await SeedAsync(_old.Encrypt("3273010101900001"));

        await Run(apply: true);

        var after = (await _db.Set<Householder>().FindAsync(h.Id))!.FamilyCardNumber!;
        Assert.False(_old.TryDecrypt(after, out _));
    }

    [Fact]
    public async Task Apply_Migrates_Every_Row()
    {
        for (var i = 0; i < 5; i++) await SeedAsync(_old.Encrypt($"327301010190000{i}"));

        var result = await Run(apply: true);

        Assert.Equal(5, result.Total);
        Assert.Equal(5, result.ReEncrypted);
        foreach (var h in await _db.Set<Householder>().ToListAsync())
            Assert.True(_new.TryDecrypt(h.FamilyCardNumber!, out _));
    }

    // ── Safety ──────────────────────────────────────────────────────────────

    // Running twice must not double-encrypt. An interrupted run has to be resumable.
    [Fact]
    public async Task Running_Twice_Is_Safe()
    {
        const string kk = "3273010101900001";
        var h = await SeedAsync(_old.Encrypt(kk));

        await Run(apply: true);
        var second = await Run(apply: true);

        Assert.Equal(0, second.ReEncrypted);
        Assert.Equal(1, second.AlreadyOnNewKey);
        var after = (await _db.Set<Householder>().FindAsync(h.Id))!.FamilyCardNumber!;
        Assert.Equal(kk, _new.Decrypt(after));
    }

    // A half-finished run leaves a mix of keys; resuming must fix only the stragglers.
    [Fact]
    public async Task Handles_A_Partially_Migrated_Table()
    {
        var stale = await SeedAsync(_old.Encrypt("1111111111111111"));
        var done = await SeedAsync(_new.Encrypt("2222222222222222"));

        var result = await Run(apply: true);

        Assert.Equal(1, result.ReEncrypted);
        Assert.Equal(1, result.AlreadyOnNewKey);
        Assert.Equal("1111111111111111", _new.Decrypt((await _db.Set<Householder>().FindAsync(stale.Id))!.FamilyCardNumber!));
        Assert.Equal("2222222222222222", _new.Decrypt((await _db.Set<Householder>().FindAsync(done.Id))!.FamilyCardNumber!));
    }

    // The most important guarantee. A value neither key can open must be left exactly as
    // it is — re-encrypting garbage would make the corruption permanent.
    [Fact]
    public async Task Undecryptable_Rows_Are_Left_Untouched_And_Reported()
    {
        var h = await SeedAsync("this-is-not-valid-ciphertext");

        var result = await Run(apply: true);

        Assert.Equal(1, result.Undecryptable);
        Assert.Equal(0, result.ReEncrypted);
        Assert.Equal("this-is-not-valid-ciphertext", (await _db.Set<Householder>().FindAsync(h.Id))!.FamilyCardNumber);
    }

    [Fact]
    public async Task Undecryptable_Rows_Do_Not_Stop_The_Good_Ones()
    {
        var bad = await SeedAsync("garbage");
        var good = await SeedAsync(_old.Encrypt("3273010101900001"));

        var result = await Run(apply: true);

        Assert.Equal(1, result.Undecryptable);
        Assert.Equal(1, result.ReEncrypted);
        Assert.Equal("3273010101900001", _new.Decrypt((await _db.Set<Householder>().FindAsync(good.Id))!.FamilyCardNumber!));
        Assert.Equal("garbage", (await _db.Set<Householder>().FindAsync(bad.Id))!.FamilyCardNumber);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    public async Task Rows_With_No_Value_Are_Skipped(string? value)
    {
        await SeedAsync(value);

        var result = await Run(apply: true);

        Assert.Equal(0, result.Total);
    }

    [Fact]
    public async Task Empty_Table_Is_A_No_Op()
    {
        var result = await Run(apply: true);

        Assert.Equal(0, result.Total);
        Assert.Equal(0, result.ReEncrypted);
    }

    // ── Command wiring ──────────────────────────────────────────────────────

    [Fact]
    public void Only_Runs_When_Explicitly_Asked()
    {
        Assert.False(ReEncryptCommand.ShouldRun(Array.Empty<string>()));
        Assert.False(ReEncryptCommand.ShouldRun(new[] { "--urls", "http://localhost:5000" }));
        Assert.True(ReEncryptCommand.ShouldRun(new[] { "--reencrypt-kk", "--dry-run" }));
    }

    public void Dispose() => _db.Dispose();
}
