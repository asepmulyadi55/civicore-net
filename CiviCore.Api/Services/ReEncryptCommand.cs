using CiviCore.Domain.Entities;
using CiviCore.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CiviCore.Api.Services;

/// <summary>
/// One-off migration that moves FamilyCardNumber from one encryption key to another.
///
/// Needed because the key was never configured, so existing rows are protected by a
/// constant compiled into the source. Simply setting a new key would leave every stored
/// value unreadable — and because Decrypt() returns its input on failure, the app would
/// silently display ciphertext instead of erroring.
///
/// Run deliberately, never on startup:
///   dotnet CiviCore.Api.dll --reencrypt-kk --dry-run
///   dotnet CiviCore.Api.dll --reencrypt-kk --apply
/// </summary>
public static class ReEncryptCommand
{
    public const string Flag = "--reencrypt-kk";

    public record Result(int Total, int ReEncrypted, int AlreadyOnNewKey, int Undecryptable, bool Applied);

    public static bool ShouldRun(string[] args) => args.Contains(Flag);

    public static async Task<int> RunAsync(IServiceProvider services, string[] args, TextWriter output)
    {
        var apply = args.Contains("--apply");
        var dryRun = !apply;

        using var scope = services.CreateScope();
        var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var newKey = config["Encryption:Key"];
        if (string.IsNullOrWhiteSpace(newKey))
        {
            output.WriteLine("ERROR: Encryption:Key is not set. Set the NEW key before running this.");
            return 1;
        }

        // Defaults to the old built-in constant, which is what existing rows are under.
        var oldKey = config["Encryption:OldKey"] ?? EncryptionService.InsecureFallbackKey;

        if (oldKey == newKey)
        {
            output.WriteLine("ERROR: Encryption:OldKey and Encryption:Key are identical. Nothing to migrate.");
            return 1;
        }

        var result = await ExecuteAsync(db, oldKey, newKey, apply, output);

        output.WriteLine();
        output.WriteLine($"  rows with a value : {result.Total}");
        output.WriteLine($"  re-encrypted      : {result.ReEncrypted}");
        output.WriteLine($"  already on new key: {result.AlreadyOnNewKey}");
        output.WriteLine($"  UNDECRYPTABLE     : {result.Undecryptable}");
        output.WriteLine(dryRun
            ? "\nDRY RUN — nothing was written. Re-run with --apply once the numbers look right."
            : "\nAPPLIED — changes committed.");

        // Undecryptable rows mean neither key opens them; they were left untouched.
        return result.Undecryptable > 0 ? 2 : 0;
    }

    /// <summary>Separated from arg parsing and IO so it can be tested directly.</summary>
    public static async Task<Result> ExecuteAsync(
        AppDbContext db, string oldKey, string newKey, bool apply, TextWriter output)
    {
        var oldCipher = EncryptionService.WithRawKey(oldKey);
        var newCipher = EncryptionService.WithRawKey(newKey);

        var householders = await db.Set<Householder>()
            .Where(h => h.FamilyCardNumber != null && h.FamilyCardNumber != "")
            .ToListAsync();

        int reEncrypted = 0, alreadyNew = 0, undecryptable = 0;

        foreach (var h in householders)
        {
            var stored = h.FamilyCardNumber!;

            // Already migrated (or written since the key changed) — leave it alone so the
            // command is safe to run twice.
            if (newCipher.TryDecrypt(stored, out _))
            {
                alreadyNew++;
                continue;
            }

            if (!oldCipher.TryDecrypt(stored, out var plain))
            {
                // Neither key opens it. Re-encrypting now would lock in the corruption,
                // so skip and report instead.
                undecryptable++;
                output.WriteLine($"  ! cannot decrypt householder {h.Id} — left unchanged");
                continue;
            }

            if (apply) h.FamilyCardNumber = newCipher.Encrypt(plain);
            reEncrypted++;
        }

        if (apply && reEncrypted > 0) await db.SaveChangesAsync();

        return new Result(householders.Count, reEncrypted, alreadyNew, undecryptable, apply);
    }
}
