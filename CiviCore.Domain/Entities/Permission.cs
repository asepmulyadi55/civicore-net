namespace CiviCore.Domain.Entities;

public class Permission
{
    public Guid Id { get; set; }
    public Guid RoleId { get; set; }
    public ApplicationRole Role { get; set; } = null!;
    
    public string PermissionKey { get; set; } = string.Empty;
}
