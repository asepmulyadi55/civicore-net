using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CiviCore.Infrastructure.Data;
using CiviCore.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

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
}

[ApiController]
[Route("api/[controller]s")]
[Authorize]
public class MeetingController : ControllerBase
{
    private readonly AppDbContext _context;

    public MeetingController(AppDbContext context)
    {
        _context = context;
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
            Created_at = m.CreatedAt
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
        var meeting = await _context.Meetings.FindAsync(id);
        if (meeting == null) return NotFound();

        return Ok(new MeetingDto
        {
            Id = meeting.Id,
            Title = meeting.Title,
            Description = meeting.Description,
            Meeting_date = meeting.Date.ToString("yyyy-MM-ddTHH:mm"),
            Location = meeting.Location,
            Status = meeting.Status,
            Created_at = meeting.CreatedAt
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
}
