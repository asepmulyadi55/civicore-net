namespace CiviCore.Api.Models;

public class OrganizationPosition
{
    public Guid Id { get; set; }
    public Guid PeriodId { get; set; }
    public OrganizationPeriod Period { get; set; } = null!;
    
    public string PositionName { get; set; } = string.Empty;
    
    public Guid? UserId { get; set; }
    public ApplicationUser? User { get; set; }
    
    public int SortOrder { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
