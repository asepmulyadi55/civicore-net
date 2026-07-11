namespace CiviCore.Domain.Entities;

public class FormSubmission
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    /// <summary>visit | report | rsvp | message</summary>
    public string Type { get; set; } = string.Empty;
    
    /// <summary>JSON blob of the submitted form data</summary>
    public string Data { get; set; } = "{}";
    
    public bool IsRead { get; set; } = false;
    
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
}
