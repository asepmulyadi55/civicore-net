using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using CiviCore.Domain.Entities;
using CiviCore.Infrastructure.Data;

namespace CiviCore.Infrastructure.Services;

/// <summary>
/// Resolves the permission keys granted to a role. Consulted on every authenticated
/// API call, so results are cached — the database is only touched on a cache miss.
/// </summary>
public interface IUserPermissionService
{
    /// <summary>Permission keys for a role name. A superuser role resolves to the single key "*".</summary>
    Task<IReadOnlyCollection<string>> GetForRoleAsync(string roleName);

    Task<bool> RoleHasAsync(string roleName, string permissionKey);

    /// <summary>Call when a role's permissions change so the next request sees them.</summary>
    Task InvalidateRoleAsync(string roleName);
}

public class UserPermissionService : IUserPermissionService
{
    public const string Wildcard = "*";

    /// <summary>Roles that bypass the permission table entirely.</summary>
    private static readonly string[] SuperRoles = { "Admin", "Super Admin", "SuperAdmin" };

    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(5);

    private readonly AppDbContext _db;
    private readonly IDistributedCache _cache;

    public UserPermissionService(AppDbContext db, IDistributedCache cache)
    {
        _db = db;
        _cache = cache;
    }

    public static bool IsSuperRole(string? roleName) =>
        roleName != null && SuperRoles.Any(r => r.Equals(roleName, StringComparison.OrdinalIgnoreCase));

    private static string CacheKey(string roleName) => $"perms:role:{roleName.ToLowerInvariant()}";

    public async Task<IReadOnlyCollection<string>> GetForRoleAsync(string roleName)
    {
        if (string.IsNullOrWhiteSpace(roleName)) return Array.Empty<string>();
        if (IsSuperRole(roleName)) return new[] { Wildcard };

        var cached = await _cache.GetStringAsync(CacheKey(roleName));
        if (cached != null)
            return cached.Length == 0 ? Array.Empty<string>() : cached.Split('\n');

        var keys = await _db.Set<ApplicationRole>().AsNoTracking()
            .Where(r => r.Name == roleName)
            .SelectMany(r => r.Permissions!.Select(p => p.PermissionKey))
            .ToListAsync();

        await _cache.SetStringAsync(CacheKey(roleName), string.Join('\n', keys),
            new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = CacheTtl });

        return keys;
    }

    public async Task<bool> RoleHasAsync(string roleName, string permissionKey)
    {
        if (IsSuperRole(roleName)) return true;
        var keys = await GetForRoleAsync(roleName);
        return keys.Contains(Wildcard) || keys.Contains(permissionKey);
    }

    public Task InvalidateRoleAsync(string roleName) =>
        string.IsNullOrWhiteSpace(roleName) ? Task.CompletedTask : _cache.RemoveAsync(CacheKey(roleName));
}
