namespace CiviCore.Domain.Entities;

public class BlockCoordinator
{
    public Guid Id { get; set; }
    
    public Guid BlockId { get; set; }
    public Block Block { get; set; } = null!;
    
    public Guid? ResidentId { get; set; }
    public Resident? Resident { get; set; }
    
    public Guid? HouseholderId { get; set; }
    public Householder? Householder { get; set; }
}
