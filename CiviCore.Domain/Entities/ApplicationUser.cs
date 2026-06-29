using Microsoft.AspNetCore.Identity;

namespace CiviCore.Domain.Entities;

public class ApplicationUser : IdentityUser<Guid>
{
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public string? GoogleId { get; set; }
    
    // For block coordinators
    public Guid? BlockId { get; set; }
    public Block? Block { get; set; }
    
    public string? UnitNumber { get; set; }
    public string? Avatar { get; set; }
    public string Language { get; set; } = "en";
    public string? SessionToken { get; set; }
    
    public DateTime? LastLoginAt { get; set; }
    public DateTime? LastActiveAt { get; set; }
    
    public string? TwoFactorSecretKey { get; set; }
    public DateTime? TwoFactorEnabledAt { get; set; }
}
