namespace CiviCore.Domain.Entities;

public class PropertyListing
{
    public Guid Id { get; set; }
    public Guid UnitId { get; set; }
    public Unit Unit { get; set; } = null!;
    
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string ListingType { get; set; } = "Sale"; // Sale, Rent
    
    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
