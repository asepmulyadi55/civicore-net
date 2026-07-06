using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CiviCore.Infrastructure.Data;
using CiviCore.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using CiviCore.Api.Services;
using Microsoft.Extensions.Configuration;

namespace CiviCore.Api.Controllers;

public class MeetingDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Meeting_date { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string Status { get; set; } = "scheduled";
    public DateTime Created_at { get; set; }
    public List<MeetingAttendeeDto> Attendees { get; set; } = new();
}

public class MeetingAttendeeDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string? PhotoPath { get; set; }
}

public class UpdateDescriptionDto
{
    public string Description { get; set; } = string.Empty;
}

public class MeetingImageDto
{
    public Guid Id { get; set; }
    public string ImagePath { get; set; } = string.Empty;
}

public class AttendanceSubmitDto
{
    public List<AttendanceRecordDto> Records { get; set; } = new();
}

public class AttendanceRecordDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public bool IsPresent { get; set; }
    public string? Notes { get; set; }
}

[ApiController]
[Route("api/[controller]s")]
[Authorize]
public class MeetingController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILocalStorageService _storageService;
    private readonly IConfiguration _configuration;

    public MeetingController(AppDbContext context, ILocalStorageService storageService, IConfiguration configuration)
    {
        _context = context;
        _storageService = storageService;
        _configuration = configuration;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] string? status, [FromQuery] int page = 1)
    {
        var query = _context.Meetings.AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(m => m.Title.Contains(search) || m.Location.Contains(search));
        }

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(m => m.Status == status);
        }

        int pageSize = 10;
        var total = await query.CountAsync();
        var meetings = await query
            .Include(m => m.Attendances)
                .ThenInclude(a => a.Resident)
            .Include(m => m.Attendances)
                .ThenInclude(a => a.Householder)
            .OrderByDescending(m => m.Date)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var data = meetings.Select(m => new MeetingDto
        {
            Id = m.Id,
            Title = m.Title,
            Description = m.Description,
            Meeting_date = m.Date.ToString("yyyy-MM-ddTHH:mm"),
            Location = m.Location,
            Status = m.Status,
            Created_at = m.CreatedAt,
            Attendees = m.Attendances.Where(a => a.IsPresent).Select(a => new MeetingAttendeeDto
            {
                Id = a.ResidentId ?? a.HouseholderId ?? Guid.Empty,
                Name = a.Resident?.Fullname ?? a.Householder?.Fullname ?? "Unknown",
                Type = a.ResidentId.HasValue ? "resident" : "householder",
                PhotoPath = a.Resident?.PhotoPath ?? a.Householder?.PhotoPath
            }).ToList()
        });

        return Ok(new
        {
            data,
            meta = new
            {
                current_page = page,
                last_page = (int)Math.Ceiling(total / (double)pageSize),
                from = (page - 1) * pageSize + 1,
                to = Math.Min(page * pageSize, total),
                total = total
            }
        });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var meeting = await _context.Meetings
            .Include(m => m.Attendances)
                .ThenInclude(a => a.Resident)
            .Include(m => m.Attendances)
                .ThenInclude(a => a.Householder)
            .FirstOrDefaultAsync(m => m.Id == id);
            
        if (meeting == null) return NotFound();

        return Ok(new MeetingDto
        {
            Id = meeting.Id,
            Title = meeting.Title,
            Description = meeting.Description,
            Meeting_date = meeting.Date.ToString("yyyy-MM-ddTHH:mm"),
            Location = meeting.Location,
            Status = meeting.Status,
            Created_at = meeting.CreatedAt,
            Attendees = meeting.Attendances.Where(a => a.IsPresent).Select(a => new MeetingAttendeeDto
            {
                Id = a.ResidentId ?? a.HouseholderId ?? Guid.Empty,
                Name = a.Resident?.Fullname ?? a.Householder?.Fullname ?? "Unknown",
                Type = a.ResidentId.HasValue ? "resident" : "householder",
                PhotoPath = a.Resident?.PhotoPath ?? a.Householder?.PhotoPath
            }).ToList()
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] MeetingDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var meeting = new Meeting
        {
            Title = dto.Title,
            Description = dto.Description,
            Date = DateTime.Parse(dto.Meeting_date).ToUniversalTime(),
            Location = dto.Location ?? string.Empty,
            Status = dto.Status ?? "scheduled",
            CreatedById = Guid.Parse(userId)
        };

        _context.Meetings.Add(meeting);
        await _context.SaveChangesAsync();

        dto.Id = meeting.Id;
        dto.Created_at = meeting.CreatedAt;
        return CreatedAtAction(nameof(GetById), new { id = meeting.Id }, dto);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] MeetingDto dto)
    {
        var meeting = await _context.Meetings.FindAsync(id);
        if (meeting == null) return NotFound();

        meeting.Title = dto.Title;
        meeting.Description = dto.Description;
        meeting.Date = DateTime.Parse(dto.Meeting_date).ToUniversalTime();
        meeting.Location = dto.Location ?? string.Empty;
        meeting.Status = dto.Status ?? "scheduled";
        meeting.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(dto);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var meeting = await _context.Meetings.FindAsync(id);
        if (meeting == null) return NotFound();

        _context.Meetings.Remove(meeting);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("{id}/description")]
    public async Task<IActionResult> UpdateDescription(Guid id, [FromBody] UpdateDescriptionDto dto)
    {
        var meeting = await _context.Meetings.FindAsync(id);
        if (meeting == null) return NotFound();

        meeting.Description = dto.Description;
        meeting.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(new { message = "Description updated successfully" });
    }

    [HttpGet("{id}/images")]
    public async Task<IActionResult> GetImages(Guid id)
    {
        var images = await _context.MeetingImages
            .Where(i => i.MeetingId == id)
            .Select(i => new MeetingImageDto
            {
                Id = i.Id,
                ImagePath = i.ImagePath
            })
            .ToListAsync();
        
        return Ok(images);
    }

    [HttpPost("{id}/images")]
    public async Task<IActionResult> UploadImage(Guid id, IFormFile file)
    {
        var meeting = await _context.Meetings.FindAsync(id);
        if (meeting == null) return NotFound("Meeting not found");

        if (file == null || file.Length == 0) return BadRequest("No file uploaded");

        var extension = System.IO.Path.GetExtension(file.FileName);
        var filePath = $"meetings/{Guid.NewGuid()}{extension}";

        using var stream = file.OpenReadStream();
        await _storageService.UploadFileAsync(true, filePath, stream);

        var meetingImage = new MeetingImage
        {
            MeetingId = id,
            ImagePath = filePath
        };

        _context.MeetingImages.Add(meetingImage);
        await _context.SaveChangesAsync();

        return Ok(new MeetingImageDto
        {
            Id = meetingImage.Id,
            ImagePath = meetingImage.ImagePath
        });
    }

    [HttpDelete("images/{imageId}")]
    public async Task<IActionResult> DeleteImage(Guid imageId)
    {
        var image = await _context.MeetingImages.FindAsync(imageId);
        if (image == null) return NotFound();

        try
        {
            await _storageService.RemoveFileAsync(true, image.ImagePath);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to delete file from storage: {ex.Message}");
        }

        _context.MeetingImages.Remove(image);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("{id}/attendance")]
    public async Task<IActionResult> GetAttendance(Guid id)
    {
        var attendances = await _context.MeetingAttendances.Where(a => a.MeetingId == id).ToListAsync();
        
        var householders = await _context.Householders.ToListAsync();
        var residents = await _context.Residents.ToListAsync();
        
        var result = new List<object>();
        
        foreach (var h in householders)
        {
            var a = attendances.FirstOrDefault(x => x.HouseholderId == h.Id);
            result.Add(new 
            {
                Id = h.Id,
                Name = h.Fullname,
                Email = h.Email,
                Type = "householder",
                IsPresent = a?.IsPresent ?? false,
                Notes = a?.Notes
            });
        }
        
        foreach (var r in residents)
        {
            var a = attendances.FirstOrDefault(x => x.ResidentId == r.Id);
            result.Add(new 
            {
                Id = r.Id,
                Name = r.Fullname,
                Email = (string?)null,
                Type = "resident",
                IsPresent = a?.IsPresent ?? false,
                Notes = a?.Notes
            });
        }

        var sortedResult = result.OrderBy(r => ((dynamic)r).Name).ToList();

        return Ok(sortedResult);
    }

    [HttpPost("{id}/attendance")]
    public async Task<IActionResult> SubmitAttendance(Guid id, [FromBody] AttendanceSubmitDto dto)
    {
        var meeting = await _context.Meetings.FindAsync(id);
        if (meeting == null) return NotFound();

        var existingAttendances = await _context.MeetingAttendances.Where(a => a.MeetingId == id).ToListAsync();
        
        foreach (var record in dto.Records)
        {
            var isHouseholder = record.Type == "householder";
            var existing = existingAttendances.FirstOrDefault(a => 
                (isHouseholder && a.HouseholderId == record.Id) || 
                (!isHouseholder && a.ResidentId == record.Id)
            );

            if (existing != null)
            {
                existing.IsPresent = record.IsPresent;
                existing.Notes = record.Notes;
                existing.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                _context.MeetingAttendances.Add(new MeetingAttendance
                {
                    MeetingId = id,
                    HouseholderId = isHouseholder ? record.Id : null,
                    ResidentId = isHouseholder ? null : record.Id,
                    IsPresent = record.IsPresent,
                    Notes = record.Notes
                });
            }
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Attendance updated successfully" });
    }
}
