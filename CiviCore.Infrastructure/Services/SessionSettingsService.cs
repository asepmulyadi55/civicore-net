using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using CiviCore.Domain.Entities;
using CiviCore.Infrastructure.Data;

namespace CiviCore.Infrastructure.Services;

/// <summary>
/// Reads the admin-configurable session idle timeout. The auth cookie's
/// ExpireTimeSpan is bound at startup, so the live value is enforced per-request
/// in OnValidatePrincipal instead — this keeps that check off the database.
/// </summary>
public interface ISessionSettingsService
{
    Task<int> GetSessionTimeoutMinutesAsync();

    /// <summary>Call after the setting is written so the new value takes effect immediately.</summary>
    Task InvalidateAsync();
}

public class SessionSettingsService : ISessionSettingsService
{
    public const string SettingKey = "session_timeout_minutes";
    public const int DefaultMinutes = 30;
    public const int MinMinutes = 5;
    public const int MaxMinutes = 120;

    private const string CacheKey = "settings:" + SettingKey;
    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(5);

    private readonly AppDbContext _db;
    private readonly IDistributedCache _cache;

    public SessionSettingsService(AppDbContext db, IDistributedCache cache)
    {
        _db = db;
        _cache = cache;
    }

    public async Task<int> GetSessionTimeoutMinutesAsync()
    {
        var cached = await _cache.GetStringAsync(CacheKey);
        if (cached != null && int.TryParse(cached, out var cachedMinutes))
            return Clamp(cachedMinutes);

        var raw = await _db.Set<Setting>().AsNoTracking()
            .Where(s => s.Key == SettingKey)
            .Select(s => s.Value)
            .FirstOrDefaultAsync();

        var minutes = int.TryParse(raw, out var parsed) ? Clamp(parsed) : DefaultMinutes;

        await _cache.SetStringAsync(CacheKey, minutes.ToString(), new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = CacheTtl
        });

        return minutes;
    }

    public Task InvalidateAsync() => _cache.RemoveAsync(CacheKey);

    // The admin endpoint validates this range, but the value can also arrive from
    // an older row or a direct DB edit — never let it widen the window.
    private static int Clamp(int minutes) =>
        minutes < MinMinutes ? MinMinutes : minutes > MaxMinutes ? MaxMinutes : minutes;
}
