using CiviCore.Core.Enums;

namespace CiviCore.Api.Models;

public class PaymentRecord
{
    public Guid Id { get; set; }
    
    public Guid HouseholderId { get; set; }
    public Householder Householder { get; set; } = null!;
    
    public string? HouseholderName { get; set; }
    
    public Guid BlockId { get; set; }
    public Block Block { get; set; } = null!;
    
    public string? UnitNumber { get; set; }
    public Guid? BatchId { get; set; }
    
    public DateTime PaymentMonth { get; set; }
    public decimal Amount { get; set; }
    
    public Guid PaymentMethodId { get; set; }
    public PaymentMethod PaymentMethod { get; set; } = null!;
    
    public string? ProofPath { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Unpaid;
    public string? RejectionReason { get; set; }
    public string? Notes { get; set; }
    
    public Guid SubmittedById { get; set; }
    public ApplicationUser SubmittedBy { get; set; } = null!;
    
    public Guid? ApprovedById { get; set; }
    public ApplicationUser? ApprovedBy { get; set; }
    
    public DateTime? ApprovedAt { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
