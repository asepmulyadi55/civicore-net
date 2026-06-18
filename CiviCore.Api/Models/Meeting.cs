namespace CiviCore.Api.Models;

public class Meeting
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime Date { get; set; }
    public string Location { get; set; } = string.Empty;
    
    public Guid CreatedById { get; set; }
    public ApplicationUser CreatedBy { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    public ICollection<MeetingAttendance> Attendances { get; set; } = new List<MeetingAttendance>();
    public ICollection<MeetingImage> Images { get; set; } = new List<MeetingImage>();
}
