using Microsoft.AspNetCore.Identity;

namespace CiviCore.Api.Models;

public class ApplicationRole : IdentityRole<Guid>
{
    public string? Description { get; set; }
    public string? Style { get; set; }
    
    public ICollection<Permission> Permissions { get; set; } = new List<Permission>();
}
