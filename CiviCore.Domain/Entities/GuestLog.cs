namespace CiviCore.Domain.Entities;

public class GuestLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string GuestName { get; set; } = string.Empty;
    public string VehicleType { get; set; } = "Car";
    public string LicensePlate { get; set; } = string.Empty;
    public DateTime CheckInAt { get; set; } = DateTime.UtcNow;
    public DateTime? CheckOutAt { get; set; }
    public string Status { get; set; } = "in_premises";
    public string? Notes { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
