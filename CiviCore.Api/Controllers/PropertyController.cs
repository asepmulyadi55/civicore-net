using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CiviCore.Infrastructure.Data;
using CiviCore.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using CiviCore.Api.Services;

namespace CiviCore.Api.Controllers;

public class PropertyCreateDto
{
    public string Title { get; set; } = string.Empty;
    public string Type { get; set; } = "sell";
    required public decimal Price { get; set; }
    public string Status { get; set; } = "available";
    public string? Description { get; set; }
    public string? Location { get; set; }
    public Guid? BlockId { get; set; }
    public Guid? UnitId { get; set; }
    public string? ContactName { get; set; }
    public string? ContactPhone { get; set; }
    public int? Bedrooms { get; set; }
    public int? Bathrooms { get; set; }
    public decimal? LandArea { get; set; }
    public decimal? BuildingArea { get; set; }
    public string? Amenities { get; set; }
}

[ApiController]
[Route("api/property")]
[Authorize]
public class PropertyController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILocalStorageService _storageService;

    public PropertyController(AppDbContext context, ILocalStorageService storageService)
    {
        _context = context;
        _storageService = storageService;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? type,
        [FromQuery] string? status,
        [FromQuery] int page = 1)
    {
        int pageSize = 15;
        var query = _context.PropertyListings
            .Include(p => p.Block)
            .AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            var s = search.ToLower();
            query = query.Where(p =>
                p.Title.ToLower().Contains(s) ||
                (p.LocationLabel != null && p.LocationLabel.ToLower().Contains(s)) ||
                (p.ContactName != null && p.ContactName.ToLower().Contains(s)));
        }

        if (!string.IsNullOrEmpty(type))
            query = query.Where(p => p.Type == type);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(p => p.Status == status);

        var total = await query.CountAsync();
        var listings = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new
            {
                p.Id,
                p.Title,
                type = p.Type,
                p.Price,
                status = p.Status,
                description = p.Description,
                location = p.LocationLabel,
                block_name = p.Block != null ? p.Block.Name : null,
                p.ContactName,
                p.ContactPhone,
                p.Bedrooms,
                p.Bathrooms,
                p.LandArea,
                p.BuildingArea,
                p.Amenities,
                images = p.Images,
                p.IsActive,
                created_at = p.CreatedAt
            })
            .ToListAsync();

        return Ok(new
        {
            data = listings,
            meta = new
            {
                current_page = page,
                last_page = (int)Math.Ceiling(total / (double)pageSize),
                from = total == 0 ? 0 : (page - 1) * pageSize + 1,
                to = Math.Min(page * pageSize, total),
                total
            }
        });
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(Guid id)
    {
        var listing = await _context.PropertyListings
            .Include(p => p.Block)
            .FirstOrDefaultAsync(p => p.Id == id);
            
        if (listing == null) return NotFound();

        return Ok(new
        {
            listing.Id,
            listing.Title,
            type = listing.Type,
            listing.Price,
            status = listing.Status,
            description = listing.Description,
            location = listing.LocationLabel,
            block_name = listing.Block?.Name,
            listing.ContactName,
            listing.ContactPhone,
            listing.Bedrooms,
            listing.Bathrooms,
            listing.LandArea,
            listing.BuildingArea,
            listing.Amenities,
            images = listing.Images,
            listing.IsActive,
            created_at = listing.CreatedAt
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] PropertyCreateDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var listing = new PropertyListing
        {
            Title = dto.Title,
            Type = dto.Type,
            Price = dto.Price,
            Status = dto.Status,
            Description = dto.Description,
            LocationLabel = dto.Location,
            BlockId = dto.BlockId,
            UnitId = dto.UnitId,
            ContactName = dto.ContactName,
            ContactPhone = dto.ContactPhone,
            Bedrooms = dto.Bedrooms,
            Bathrooms = dto.Bathrooms,
            LandArea = dto.LandArea,
            BuildingArea = dto.BuildingArea,
            Amenities = dto.Amenities,
            CreatedById = userId != null ? Guid.Parse(userId) : null
        };

        _context.PropertyListings.Add(listing);
        await _context.SaveChangesAsync();

        return Ok(listing);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] PropertyCreateDto dto)
    {
        var listing = await _context.PropertyListings.FindAsync(id);
        if (listing == null) return NotFound();

        listing.Title = dto.Title;
        listing.Type = dto.Type;
        listing.Price = dto.Price;
        listing.Status = dto.Status;
        listing.Description = dto.Description;
        listing.LocationLabel = dto.Location;
        listing.BlockId = dto.BlockId;
        listing.UnitId = dto.UnitId;
        listing.ContactName = dto.ContactName;
        listing.ContactPhone = dto.ContactPhone;
        listing.Bedrooms = dto.Bedrooms;
        listing.Bathrooms = dto.Bathrooms;
        listing.LandArea = dto.LandArea;
        listing.BuildingArea = dto.BuildingArea;
        listing.Amenities = dto.Amenities;
        listing.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(listing);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var listing = await _context.PropertyListings.FindAsync(id);
        if (listing == null) return NotFound();

        _context.PropertyListings.Remove(listing);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id}/images")]
    public async Task<IActionResult> UploadImage(Guid id, IFormFile file)
    {
        var property = await _context.PropertyListings.FindAsync(id);
        if (property == null) return NotFound();

        if (file == null || file.Length == 0) return BadRequest("File is required");

        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
        var filePath = $"homepage/properties/{fileName}";
        
        using var stream = file.OpenReadStream();
        var imageUrl = await _storageService.UploadFileAsync(false, filePath, stream);
        
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        _context.MediaFiles.Add(new MediaFile
        {
            Id = Guid.NewGuid(),
            FileName = file.FileName,
            FilePath = filePath,
            MimeType = file.ContentType ?? "application/octet-stream",
            FileSize = (int)file.Length,
            UserId = !string.IsNullOrEmpty(userIdString) && Guid.TryParse(userIdString, out var uid) ? uid : Guid.Empty,
            ModelType = "property_listing",
            ModelId = property.Id,
            IsPrivate = false
        });

        property.Images.Add(imageUrl);
        property.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        
        return Ok(new { url = imageUrl });
    }

    [HttpDelete("{id}/images")]
    public async Task<IActionResult> DeleteImage(Guid id, [FromQuery] string url)
    {
        var property = await _context.PropertyListings.FindAsync(id);
        if (property == null) return NotFound();

        if (property.Images.Contains(url))
        {
            property.Images.Remove(url);
            
            if (url.StartsWith("/public-media/"))
            {
                var filePath = url.Substring("/public-media/".Length);
                await _storageService.RemoveFileAsync(false, filePath);
                
                var mediaFile = await _context.MediaFiles.FirstOrDefaultAsync(m => m.FilePath == filePath);
                if (mediaFile != null)
                {
                    _context.MediaFiles.Remove(mediaFile);
                }
            }

            property.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return Ok();
        }
        return NotFound("Image not found on this property.");
    }
}
