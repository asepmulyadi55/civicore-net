namespace CiviCore.Domain.Entities;

public class Block
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Unit> Units { get; set; } = new List<Unit>();
    public ICollection<BlockUser> BlockUsers { get; set; } = new List<BlockUser>();
}
