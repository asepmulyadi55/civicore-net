using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using CiviCore.Domain.Entities;
using CiviCore.Infrastructure.Data;

namespace CiviCore.Infrastructure.Services;

/// <summary>
/// Backs single-session enforcement: one account may only hold one live browser
/// session. Each sign-in mints a new SessionToken on the user row; the auth cookie
/// carries the token it was issued with, and any cookie presenting a stale token is
/// rejected on its next request.
/// </summary>
public interface ISessionTokenService
{
    /// <summary>The token currently valid for this user; null/empty means signed out everywhere.</summary>
    Task<string?> GetCurrentAsync(Guid userId);

    /// <summary>Call whenever SessionToken changes (sign-in, logout) so other devices are kicked at once.</summary>
    Task InvalidateAsync(Guid userId);
}

public class SessionTokenService : ISessionTokenService
{
    /// <summary>
    /// Stored in AuthenticationProperties rather than as a claim: SecurityStampValidator
    /// rebuilds the principal from the database periodically, which would refresh a claim
    /// to the newest token and silently defeat the check. Properties survive that refresh.
    /// </summary>
    public const string PropertyKey = "civicore.session_token";

    // IDistributedCache cannot store null, and a miss is indistinguishable from a
    // null value, so "signed out" is cached as this sentinel.
    private const string NoneSentinel = "";
    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(5);

    private readonly AppDbContext _db;
    private readonly IDistributedCache _cache;

    public SessionTokenService(AppDbContext db, IDistributedCache cache)
    {
        _db = db;
        _cache = cache;
    }

    private static string CacheKey(Guid userId) => $"session_token:{userId}";

    public async Task<string?> GetCurrentAsync(Guid userId)
    {
        var cached = await _cache.GetStringAsync(CacheKey(userId));
        if (cached != null) return cached == NoneSentinel ? null : cached;

        var token = await _db.Set<ApplicationUser>().AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => u.SessionToken)
            .FirstOrDefaultAsync();

        await _cache.SetStringAsync(CacheKey(userId), token ?? NoneSentinel,
            new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = CacheTtl });

        return token;
    }

    public Task InvalidateAsync(Guid userId) => _cache.RemoveAsync(CacheKey(userId));
}
