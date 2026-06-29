using System.ComponentModel.DataAnnotations.Schema;

namespace CiviCore.Domain.Entities;

public class Householder
{
    public Guid Id { get; set; }
    public Guid? UserId { get; set; }
    public ApplicationUser? User { get; set; }
    
    public Guid BlockId { get; set; }
    public Block Block { get; set; } = null!;
    
    public Guid UnitId { get; set; }
    public Unit Unit { get; set; } = null!;
    
    public string Fullname { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public bool IsActive { get; set; } = true;
    public string? FamilyCardNumber { get; set; }
    public string? Notes { get; set; }
    public string? PhotoPath { get; set; }
    
    public DateTime? RentStart { get; set; }
    public DateTime? RentEnd { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Resident> Residents { get; set; } = new List<Resident>();
    public ICollection<PaymentRecord> PaymentRecords { get; set; } = new List<PaymentRecord>();

    [NotMapped]
    public decimal MonthlyFee { get; set; }
    [NotMapped]
    public string? EffectiveFrom { get; set; }
    [NotMapped]
    public decimal? NewMonthlyFee { get; set; }
    public ICollection<FeeHistory> FeeHistories { get; set; } = new List<FeeHistory>();
}
