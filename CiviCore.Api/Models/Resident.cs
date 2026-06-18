namespace CiviCore.Api.Models;

public class Resident
{
    public Guid Id { get; set; }
    public Guid HouseholderId { get; set; }
    public Householder Householder { get; set; } = null!;
    
    public string Fullname { get; set; } = string.Empty;
    public string? Relationship { get; set; }
    public bool IsHead { get; set; } = false;
    public string? PhotoPath { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
