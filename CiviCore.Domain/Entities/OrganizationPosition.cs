namespace CiviCore.Domain.Entities;

public class OrganizationPosition
{
    public Guid Id { get; set; }
    public Guid PeriodId { get; set; }
    public OrganizationPeriod Period { get; set; } = null!;
    
    public string PositionName { get; set; } = string.Empty;
    
    // Hierarchical Tree Structure
    public Guid? ParentId { get; set; }
    public OrganizationPosition? Parent { get; set; }
    public ICollection<OrganizationPosition> Children { get; set; } = new List<OrganizationPosition>();
    
    // Linked person (can be either a Resident or a Householder)
    public Guid? ResidentId { get; set; }
    public Resident? Resident { get; set; }
    
    public Guid? HouseholderId { get; set; }
    public Householder? Householder { get; set; }
    
    public int SortOrder { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
