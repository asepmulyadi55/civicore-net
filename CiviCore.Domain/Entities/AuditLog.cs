namespace CiviCore.Domain.Entities;

/// <summary>
/// Append-only record of security-relevant events. Distinct from the Serilog files:
/// those rotate away after ~14 days and are not queryable — an audit trail has to
/// survive and answer "who did what, from where, when".
/// </summary>
public class AuditLog
{
    public Guid Id { get; set; }

    /// <summary>Null when the actor could not be resolved — e.g. a failed login for an unknown email.</summary>
    public Guid? UserId { get; set; }

    /// <summary>Captured at write time so the trail still reads correctly if the user is later deleted or renamed.</summary>
    public string? ActorEmail { get; set; }

    /// <summary>One of <see cref="AuditEvents"/>.</summary>
    public string Event { get; set; } = string.Empty;

    public bool Success { get; set; }

    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }

    /// <summary>Free-text context. Never put credentials or tokens here.</summary>
    public string? Detail { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public static class AuditEvents
{
    public const string LoginSuccess = "login.success";
    public const string LoginFailed = "login.failed";
    public const string LoginLockedOut = "login.locked_out";
    public const string Logout = "logout";

    /// <summary>An existing session was ended because the account signed in elsewhere.</summary>
    public const string SessionKicked = "session.kicked";
}
