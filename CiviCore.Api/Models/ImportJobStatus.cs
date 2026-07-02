namespace CiviCore.Api.Models;

public class ImportJobStatus
{
    public Guid JobId { get; set; } = Guid.NewGuid();
    public string Status { get; set; } = "Pending"; // Pending, Processing, Completed, Failed
    public int TotalRows { get; set; }
    public int ProcessedRows { get; set; }
    public string? Message { get; set; }
}
