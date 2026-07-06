namespace CiviCore.Domain.Entities;

public class PropertyListing
{
    public Guid Id { get; set; }
    
    public Guid? UnitId { get; set; }
    public Unit? Unit { get; set; }
    
    public Guid? BlockId { get; set; }
    public Block? Block { get; set; }
    
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    
    public string Type { get; set; } = "sell"; // sell, rent
    public string Status { get; set; } = "available"; // available, sold, rented
    public string? LocationLabel { get; set; }
    
    public string? ContactName { get; set; }
    public string? ContactPhone { get; set; }
    
    public int? Bedrooms { get; set; }
    public int? Bathrooms { get; set; }
    public decimal? LandArea { get; set; }
    public decimal? BuildingArea { get; set; }
    public string? Amenities { get; set; } // comma separated list
    public List<string> Images { get; set; } = new();
    
    public bool IsActive { get; set; } = true;
    
    public Guid? CreatedById { get; set; }
    public ApplicationUser? CreatedBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
