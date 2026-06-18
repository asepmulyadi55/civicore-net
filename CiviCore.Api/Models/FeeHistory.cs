namespace CiviCore.Api.Models;

public class FeeHistory
{
    public Guid Id { get; set; }
    public Guid HouseholderId { get; set; }
    public Householder Householder { get; set; } = null!;
    
    public decimal Amount { get; set; }
    public DateTime EffectiveFrom { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
