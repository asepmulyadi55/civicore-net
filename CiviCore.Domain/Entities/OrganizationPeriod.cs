namespace CiviCore.Domain.Entities;

public class OrganizationPeriod
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty; // e.g. "Periode 2024-2026"
    public int StartYear { get; set; }
    public int EndYear { get; set; }
    public bool IsActive { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    public ICollection<OrganizationPosition> Positions { get; set; } = new List<OrganizationPosition>();
}
