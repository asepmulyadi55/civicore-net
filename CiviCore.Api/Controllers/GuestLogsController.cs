using Microsoft.AspNetCore.Authorization;
using CiviCore.Api.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CiviCore.Domain.Entities;
using CiviCore.Infrastructure.Data;
using System.Security.Claims;

namespace CiviCore.Api.Controllers;

[ApiController]
[Route("api/security/guest-logs")]
[Authorize]
[RequirePermissionModule("guest_log")]
public class GuestLogsController : ControllerBase
{
    private readonly SecurityDbContext _context;

    public GuestLogsController(SecurityDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [RequirePermission("guest_log.view")]
    public async Task<IActionResult> GetGuestLogs(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int perPage = 20)
    {
        var query = _context.GuestLogs.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(g =>
                g.GuestName.ToLower().Contains(s) ||
                g.LicensePlate.ToLower().Contains(s) ||
                (g.Notes != null && g.Notes.ToLower().Contains(s)));
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            if (status == "in_premises")
                query = query.Where(g => g.CheckOutAt == null || g.Status == "in_premises");
            else if (status == "checked_out")
                query = query.Where(g => g.CheckOutAt != null || g.Status == "checked_out");
        }

        perPage = Math.Clamp(perPage, 1, 100);
        var total = await query.CountAsync();
        var lastPage = Math.Max(1, (int)Math.Ceiling((double)total / perPage));
        page = Math.Clamp(page, 1, lastPage);

        var items = await query
            .OrderByDescending(g => g.CheckInAt)
            .Skip((page - 1) * perPage)
            .Take(perPage)
            .Select(g => new
            {
                id = g.Id,
                guestName = g.GuestName,
                vehicleType = g.VehicleType,
                licensePlate = g.LicensePlate,
                checkInAt = g.CheckInAt,
                checkOutAt = g.CheckOutAt,
                status = g.CheckOutAt != null ? "checked_out" : "in_premises",
                notes = g.Notes,
                createdAt = g.CreatedAt
            })
            .ToListAsync();

        return Ok(new
        {
            data = items,
            meta = new
            {
                current_page = page,
                last_page = lastPage,
                per_page = perPage,
                total
            }
        });
    }

    [HttpPost]
    [RequirePermission("guest_log.create")]
    public async Task<IActionResult> CheckIn([FromBody] CheckInRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.GuestName))
            return BadRequest(new { message = "Guest name is required" });

        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        Guid? userId = Guid.TryParse(userIdStr, out var parsed) ? parsed : null;

        var guestLog = new GuestLog
        {
            GuestName = request.GuestName.Trim(),
            VehicleType = string.IsNullOrWhiteSpace(request.VehicleType) ? "Car" : request.VehicleType.Trim(),
            LicensePlate = request.LicensePlate?.Trim().ToUpper() ?? string.Empty,
            Notes = request.Notes?.Trim(),
            CheckInAt = DateTime.UtcNow,
            Status = "in_premises",
            CreatedBy = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.GuestLogs.Add(guestLog);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Guest checked in successfully",
            data = new
            {
                id = guestLog.Id,
                guestName = guestLog.GuestName,
                vehicleType = guestLog.VehicleType,
                licensePlate = guestLog.LicensePlate,
                checkInAt = guestLog.CheckInAt,
                status = guestLog.Status,
                notes = guestLog.Notes
            }
        });
    }

    [HttpPut("{id:guid}/checkout")]
    [RequirePermission("guest_log.edit")]
    public async Task<IActionResult> CheckOut(Guid id)
    {
        var log = await _context.GuestLogs.FirstOrDefaultAsync(g => g.Id == id);
        if (log == null)
            return NotFound(new { message = "Guest log entry not found" });

        if (log.CheckOutAt != null)
            return BadRequest(new { message = "Guest is already checked out" });

        log.CheckOutAt = DateTime.UtcNow;
        log.Status = "checked_out";
        log.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Guest checked out successfully",
            data = new
            {
                id = log.Id,
                checkOutAt = log.CheckOutAt,
                status = log.Status
            }
        });
    }

    [HttpPut("{id:guid}")]
    [RequirePermission("guest_log.edit")]
    public async Task<IActionResult> UpdateGuestLog(Guid id, [FromBody] UpdateGuestLogRequest request)
    {
        var log = await _context.GuestLogs.FirstOrDefaultAsync(g => g.Id == id);
        if (log == null)
            return NotFound(new { message = "Guest log entry not found" });

        if (!string.IsNullOrWhiteSpace(request.GuestName))
            log.GuestName = request.GuestName.Trim();

        if (!string.IsNullOrWhiteSpace(request.VehicleType))
            log.VehicleType = request.VehicleType.Trim();

        if (request.LicensePlate != null)
            log.LicensePlate = request.LicensePlate.Trim().ToUpper();

        if (request.Notes != null)
            log.Notes = request.Notes.Trim();

        if (request.RevertToCheckIn == true)
        {
            log.CheckOutAt = null;
            log.Status = "in_premises";
        }

        log.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Guest log entry updated successfully",
            data = new
            {
                id = log.Id,
                guestName = log.GuestName,
                vehicleType = log.VehicleType,
                licensePlate = log.LicensePlate,
                checkInAt = log.CheckInAt,
                checkOutAt = log.CheckOutAt,
                status = log.Status,
                notes = log.Notes
            }
        });
    }
}

public class CheckInRequest
{
    public string GuestName { get; set; } = string.Empty;
    public string? VehicleType { get; set; }
    public string? LicensePlate { get; set; }
    public string? Notes { get; set; }
}

public class UpdateGuestLogRequest
{
    public string? GuestName { get; set; }
    public string? VehicleType { get; set; }
    public string? LicensePlate { get; set; }
    public string? Notes { get; set; }
    public bool? RevertToCheckIn { get; set; }
}
