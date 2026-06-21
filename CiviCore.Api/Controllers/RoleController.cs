using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CiviCore.Infrastructure.Data;
using CiviCore.Domain.Entities;
using Microsoft.AspNetCore.Authorization;

namespace CiviCore.Api.Controllers;

[ApiController]
[Route("api/roles")]
[Authorize(Roles = "admin")]
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
        return Ok(roles);
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
}
