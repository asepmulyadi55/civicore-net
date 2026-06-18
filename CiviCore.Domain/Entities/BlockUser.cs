namespace CiviCore.Domain.Entities;

public class BlockUser
{
    public Guid BlockId { get; set; }
    public Block Block { get; set; } = null!;
    
    public Guid UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;
}
