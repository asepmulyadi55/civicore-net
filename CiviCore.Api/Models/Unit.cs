using CiviCore.Core.Enums;

namespace CiviCore.Api.Models;

public class Unit
{
    public Guid Id { get; set; }
    public Guid BlockId { get; set; }
    public Block Block { get; set; } = null!;
    
    public string UnitNumber { get; set; } = string.Empty;
    public HouseStatus HouseStatus { get; set; } = HouseStatus.OwnerOccupied;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Householder? Householder { get; set; }
}
