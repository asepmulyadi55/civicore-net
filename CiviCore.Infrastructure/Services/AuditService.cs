using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using CiviCore.Domain.Entities;
using CiviCore.Infrastructure.Data;

namespace CiviCore.Infrastructure.Services;

public interface IAuditService
{
    /// <summary>
    /// Records a security-relevant event. Never throws: auditing must not be able to
    /// break the action it is observing (a failed insert must not turn a login into a 500).
    /// </summary>
    Task LogAsync(
        string auditEvent,
        bool success,
        Guid? userId = null,
        string? actorEmail = null,
        string? detail = null);
}

public class AuditService : IAuditService
{
    private readonly AppDbContext _db;
    private readonly IHttpContextAccessor _http;
    private readonly ILogger<AuditService> _logger;

    public AuditService(AppDbContext db, IHttpContextAccessor http, ILogger<AuditService> logger)
    {
        _db = db;
        _http = http;
        _logger = logger;
    }

    public async Task LogAsync(
        string auditEvent,
        bool success,
        Guid? userId = null,
        string? actorEmail = null,
        string? detail = null)
    {
        try
        {
            var context = _http.HttpContext;

            _db.Set<AuditLog>().Add(new AuditLog
            {
                UserId = userId,
                ActorEmail = actorEmail,
                Event = auditEvent,
                Success = success,
                // Behind the reverse proxy this is only the real client address because
                // UseTrustProxies applies the forwarded headers before we read it.
                IpAddress = context?.Connection.RemoteIpAddress?.ToString(),
                UserAgent = Truncate(context?.Request.Headers.UserAgent.ToString(), 512),
                Detail = Truncate(detail, 1024),
                CreatedAt = DateTime.UtcNow
            });

            await _db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            // Surfaces in the Serilog file/console instead of taking the request down.
            _logger.LogError(ex, "Failed to write audit entry {Event}", auditEvent);
        }
    }

    private static string? Truncate(string? value, int max) =>
        string.IsNullOrEmpty(value) ? value : value.Length <= max ? value : value[..max];
}
