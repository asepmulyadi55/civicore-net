using Microsoft.AspNetCore.Authorization;
using CiviCore.Api.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CiviCore.Domain.Entities;
using CiviCore.Infrastructure.Data;
using CiviCore.Infrastructure.Services;

namespace CiviCore.Api.Controllers;

[ApiController]
[Route("api/audit")]
[Authorize]
[RequirePermissionModule("audit")]
public class AuditController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<ApplicationRole> _roleManager;

    public AuditController(AppDbContext context, UserManager<ApplicationUser> userManager, RoleManager<ApplicationRole> roleManager)
    {
        _context = context;
        _userManager = userManager;
        _roleManager = roleManager;
    }

    /// <summary>
    /// Kept only so the existing tests can assert the guard directly. Enforcement itself
    /// is the global PermissionAuthorizationFilter via [RequirePermissionModule("audit")].
    /// </summary>
    private async Task<bool> CanViewAuditAsync()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return false;

        var roleName = (await _userManager.GetRolesAsync(user)).FirstOrDefault();
        if (string.IsNullOrEmpty(roleName)) return false;

        if (UserPermissionService.IsSuperRole(roleName)) return true;

        var role = await _roleManager.Roles.Include(r => r.Permissions)
            .FirstOrDefaultAsync(r => r.Name == roleName);

        return role?.Permissions?.Any(p => p.PermissionKey == "audit.view" || p.PermissionKey == "*") == true;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? @event,
        [FromQuery] string? from,
        [FromQuery] string? to,
        [FromQuery] int page = 1,
        [FromQuery] int per_page = 15)
    {
        if (!await CanViewAuditAsync()) return Forbid();

        var query = _context.Set<AuditLog>().AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(a =>
                (a.ActorEmail != null && a.ActorEmail.ToLower().Contains(s)) ||
                (a.IpAddress != null && a.IpAddress.Contains(s)));
        }

        if (!string.IsNullOrWhiteSpace(@event))
            query = query.Where(a => a.Event == @event);

        // Dates arrive as yyyy-MM-dd. Postgres columns are timestamptz, so the bounds
        // must be UTC-kinded or Npgsql throws.
        if (DateTime.TryParse(from, out var fromDate))
            query = query.Where(a => a.CreatedAt >= DateTime.SpecifyKind(fromDate.Date, DateTimeKind.Utc));

        if (DateTime.TryParse(to, out var toDate))
            query = query.Where(a => a.CreatedAt < DateTime.SpecifyKind(toDate.Date.AddDays(1), DateTimeKind.Utc));

        per_page = Math.Clamp(per_page, 1, 100);
        var total = await query.CountAsync();
        var lastPage = Math.Max(1, (int)Math.Ceiling((double)total / per_page));
        page = Math.Clamp(page, 1, lastPage);

        var rows = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((page - 1) * per_page)
            .Take(per_page)
            .Select(a => new
            {
                id = a.Id,
                userId = a.UserId,
                actorEmail = a.ActorEmail,
                @event = a.Event,
                success = a.Success,
                ipAddress = a.IpAddress,
                userAgent = a.UserAgent,
                detail = a.Detail,
                createdAt = a.CreatedAt
            })
            .ToListAsync();

        return Ok(new
        {
            data = rows,
            meta = new
            {
                current_page = page,
                last_page = lastPage,
                per_page,
                total,
                from = total == 0 ? 0 : (page - 1) * per_page + 1,
                to = Math.Min(page * per_page, total)
            }
        });
    }

    /// <summary>Distinct event names, so the filter dropdown reflects what actually exists.</summary>
    [HttpGet("events")]
    public async Task<IActionResult> GetEventTypes()
    {
        if (!await CanViewAuditAsync()) return Forbid();

        var events = await _context.Set<AuditLog>().AsNoTracking()
            .Select(a => a.Event).Distinct().OrderBy(e => e).ToListAsync();

        return Ok(events);
    }
}
