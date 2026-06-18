namespace CiviCore.Api.Models;

public class OrganizationPeriod
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty; // e.g. "Periode 2024-2026"
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    public ICollection<OrganizationPosition> Positions { get; set; } = new List<OrganizationPosition>();
}
