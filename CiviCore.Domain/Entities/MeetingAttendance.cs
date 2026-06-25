namespace CiviCore.Domain.Entities;

public class MeetingAttendance
{
    public Guid Id { get; set; }
    public Guid MeetingId { get; set; }
    public Meeting Meeting { get; set; } = null!;
    
    public Guid? ResidentId { get; set; }
    public Resident? Resident { get; set; }

    public Guid? HouseholderId { get; set; }
    public Householder? Householder { get; set; }
    
    public bool IsPresent { get; set; } = true;
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
