using Microsoft.AspNetCore.Identity;

namespace CiviCore.Domain.Entities;

public class ApplicationRole : IdentityRole<Guid>
{
    public string? Description { get; set; }
    public string? Style { get; set; }
    
    /// <summary>Security mode for login: "2fa" (TOTP), "captcha" (reCAPTCHA v3), "none"</summary>
    public string SecurityMode { get; set; } = "2fa";
    
    public ICollection<Permission> Permissions { get; set; } = new List<Permission>();
}
