using CiviCore.Domain.Enums;

namespace CiviCore.Domain.Entities;

public class FinanceReport
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }
    
    public FinanceReportStatus Status { get; set; } = FinanceReportStatus.Pending;
    public string? RejectedReason { get; set; }
    
    public Guid CreatedById { get; set; }
    public ApplicationUser CreatedBy { get; set; } = null!;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<FinanceTransaction> Transactions { get; set; } = new List<FinanceTransaction>();
}
