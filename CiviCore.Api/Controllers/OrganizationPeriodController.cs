using CiviCore.Api.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CiviCore.Infrastructure.Data;
using CiviCore.Domain.Entities;
using Microsoft.AspNetCore.Authorization;

namespace CiviCore.Api.Controllers;

[ApiController]
[Route("api/organization/periods")]
[Authorize]
[RequirePermissionModule("organization")]
public class OrganizationPeriodController : ControllerBase
{
    private readonly AppDbContext _context;

    public OrganizationPeriodController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var periods = await _context.Set<OrganizationPeriod>()
            .OrderByDescending(p => p.StartYear)
            .ThenByDescending(p => p.EndYear)
            .ToListAsync();
            
        return Ok(periods);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var period = await _context.Set<OrganizationPeriod>().FindAsync(id);
        if (period == null) return NotFound();
        return Ok(period);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] OrganizationPeriod period)
    {
        _context.Set<OrganizationPeriod>().Add(period);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = period.Id }, period);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] OrganizationPeriod updatedPeriod)
    {
        var period = await _context.Set<OrganizationPeriod>().FindAsync(id);
        if (period == null) return NotFound();

        period.Name = updatedPeriod.Name;
        period.StartYear = updatedPeriod.StartYear;
        period.EndYear = updatedPeriod.EndYear;

        await _context.SaveChangesAsync();
        return Ok(period);
    }

    [HttpPatch("{id}/activate")]
    public async Task<IActionResult> Activate(Guid id)
    {
        var period = await _context.Set<OrganizationPeriod>().FindAsync(id);
        if (period == null) return NotFound();

        // Deactivate all others
        var activePeriods = await _context.Set<OrganizationPeriod>().Where(p => p.IsActive).ToListAsync();
        foreach (var p in activePeriods)
        {
            p.IsActive = false;
        }

        period.IsActive = true;
        await _context.SaveChangesAsync();
        return Ok(period);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var period = await _context.Set<OrganizationPeriod>().FindAsync(id);
        if (period == null) return NotFound();

        if (period.IsActive)
        {
            return BadRequest(new { message = "Cannot delete the active organization period." });
        }

        _context.Set<OrganizationPeriod>().Remove(period);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
