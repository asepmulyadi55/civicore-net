using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CiviCore.Infrastructure.Data;
using CiviCore.Domain.Entities;
using Microsoft.AspNetCore.Authorization;

namespace CiviCore.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
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
        return Ok(units);
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

        _context.Set<Unit>().Remove(unit);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
