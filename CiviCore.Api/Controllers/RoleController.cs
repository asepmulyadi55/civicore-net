using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CiviCore.Infrastructure.Data;
using CiviCore.Domain.Entities;
using Microsoft.AspNetCore.Authorization;

namespace CiviCore.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
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
}
