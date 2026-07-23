using CiviCore.Api.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CiviCore.Infrastructure.Data;
using CiviCore.Domain.Entities;
using Microsoft.AspNetCore.Authorization;

namespace CiviCore.Api.Controllers;

[ApiController]
[Route("api/units")]
[Authorize]
[RequirePermissionModule("blocks")]
public class UnitController : ControllerBase
{
    private readonly AppDbContext _context;

    public UnitController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var units = await _context.Set<Unit>().ToListAsync();
        var sorted = units.OrderBy(u =>
        {
            var part = u.UnitNumber.Split('&')[0].Trim();
            return int.TryParse(part, out var n) ? n : int.MaxValue;
        }).ToList();
        return Ok(sorted);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var unit = await _context.Set<Unit>().FindAsync(id);
        if (unit == null) return NotFound();
        return Ok(unit);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Unit unit)
    {
        _context.Set<Unit>().Add(unit);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = unit.Id }, unit);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] Unit updatedUnit)
    {
        var unit = await _context.Set<Unit>().FindAsync(id);
        if (unit == null) return NotFound();

        unit.UnitNumber = updatedUnit.UnitNumber;
        unit.HouseStatus = updatedUnit.HouseStatus;
        unit.BlockId = updatedUnit.BlockId;
        
        await _context.SaveChangesAsync();
        return Ok(unit);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var unit = await _context.Set<Unit>().FindAsync(id);
        if (unit == null) return NotFound();

        bool hasHouseholders = await _context.Set<Householder>().AnyAsync(h => h.UnitId == id);
        if (hasHouseholders) return BadRequest(new { message = "Cannot delete unit as it is currently assigned to a householder." });

        _context.Set<Unit>().Remove(unit);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    public class BulkDeleteRequest { public List<Guid> Ids { get; set; } = new(); }

    [HttpDelete("bulk")]
    public async Task<IActionResult> BulkDelete([FromBody] BulkDeleteRequest request)
    {
        if (request.Ids == null || !request.Ids.Any()) return BadRequest();
        
        var units = await _context.Set<Unit>().Where(u => request.Ids.Contains(u.Id)).ToListAsync();
        
        int deletedCount = 0;
        List<string> failedUnits = new List<string>();

        foreach (var unit in units)
        {
            bool hasHouseholders = await _context.Set<Householder>().AnyAsync(h => h.UnitId == unit.Id);
            if (hasHouseholders)
            {
                failedUnits.Add(unit.UnitNumber);
            }
            else
            {
                _context.Set<Unit>().Remove(unit);
                deletedCount++;
            }
        }

        await _context.SaveChangesAsync();

        if (failedUnits.Any())
        {
            return BadRequest(new { message = $"Successfully deleted {deletedCount} units. Failed to delete units ({string.Join(", ", failedUnits)}) because they still have related householders." });
        }

        return NoContent();
    }
}
