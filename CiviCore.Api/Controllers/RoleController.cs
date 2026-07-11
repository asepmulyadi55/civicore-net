using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CiviCore.Infrastructure.Data;
using CiviCore.Domain.Entities;
using Microsoft.AspNetCore.Authorization;

namespace CiviCore.Api.Controllers;

[ApiController]
[Route("api/roles")]
[Authorize(Roles = "admin,Admin")]
public class RoleController : ControllerBase
{
    private readonly AppDbContext _context;

    public RoleController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var roles = await _context.Roles.Include(r => r.Permissions).ToListAsync();

        // Get user counts per role from the UserRoles join table
        var userRoleCounts = await _context.UserRoles
            .GroupBy(ur => ur.RoleId)
            .Select(g => new { RoleId = g.Key, Count = g.Count() })
            .ToListAsync();

        var result = roles.Select(r => new
        {
            r.Id,
            r.Name,
            r.NormalizedName,
            r.Description,
            r.Style,
            r.Permissions,
            r.SecurityMode,
            users_count = userRoleCounts.FirstOrDefault(uc => uc.RoleId == r.Id)?.Count ?? 0
        });

        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var role = await _context.Roles.Include(r => r.Permissions).FirstOrDefaultAsync(r => r.Id == id);
        if (role == null) return NotFound();
        return Ok(role);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ApplicationRole newRole)
    {
        newRole.Id = Guid.NewGuid();
        newRole.NormalizedName = newRole.Name?.ToUpper();
        
        _context.Roles.Add(newRole);
        
        if (newRole.Permissions != null)
        {
            foreach(var p in newRole.Permissions)
            {
                p.RoleId = newRole.Id;
                _context.Set<Permission>().Add(p);
            }
        }
        
        await _context.SaveChangesAsync();
        return Ok(newRole);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] ApplicationRole updatedRole)
    {
        var role = await _context.Roles.Include(r => r.Permissions).FirstOrDefaultAsync(r => r.Id == id);
        if (role == null) return NotFound();

        role.Name = updatedRole.Name;
        role.Description = updatedRole.Description;
        role.Style = updatedRole.Style;
        
        // Simplified permissions update
        if (updatedRole.Permissions != null)
        {
            _context.Set<Permission>().RemoveRange(role.Permissions);
            foreach(var p in updatedRole.Permissions)
            {
                p.RoleId = role.Id;
                _context.Set<Permission>().Add(p);
            }
        }
        
        await _context.SaveChangesAsync();
        return Ok(role);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var role = await _context.Roles.Include(r => r.Permissions).FirstOrDefaultAsync(r => r.Id == id);
        if (role == null) return NotFound();

        // Prevent deletion of system roles
        var systemRoles = new[] { "admin", "super-admin", "superadmin" };
        if (systemRoles.Contains(role.Name?.ToLower()))
            return BadRequest(new { message = "Cannot delete system roles." });

        if (role.Permissions != null && role.Permissions.Any())
        {
            _context.Set<Permission>().RemoveRange(role.Permissions);
        }

        _context.Roles.Remove(role);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("{id}/security-mode")]
    public async Task<IActionResult> UpdateSecurityMode(Guid id, [FromBody] SecurityModeRequest request)
    {
        var role = await _context.Roles.FirstOrDefaultAsync(r => r.Id == id);
        if (role == null) return NotFound();

        var allowed = new[] { "2fa", "captcha", "none" };
        if (!allowed.Contains(request.SecurityMode?.ToLower()))
            return BadRequest(new { message = "Invalid security mode. Allowed: 2fa, captcha, none." });

        role.SecurityMode = request.SecurityMode!.ToLower();
        await _context.SaveChangesAsync();
        return Ok(new { message = "Security mode updated.", securityMode = role.SecurityMode });
    }
}

public class SecurityModeRequest
{
    public string? SecurityMode { get; set; }
}
