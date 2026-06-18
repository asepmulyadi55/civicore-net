using CiviCore.Core.Enums;

namespace CiviCore.Api.Models;

public class FinanceTransaction
{
    public Guid Id { get; set; }
    
    public FinanceTransactionType Type { get; set; }
    public decimal Amount { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    
    public Guid? ReportId { get; set; }
    public FinanceReport? Report { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
