using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CiviCore.Infrastructure.Data;
using CiviCore.Domain.Entities;
using Microsoft.AspNetCore.Authorization;

namespace CiviCore.Api.Controllers;

[ApiController]
[Route("api/residents")]
[Authorize]
public class ResidentController : ControllerBase
{
    private readonly AppDbContext _context;

    public ResidentController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var residents = await _context.Set<Resident>().ToListAsync();
        return Ok(residents);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var resident = await _context.Set<Resident>().FindAsync(id);
        if (resident == null) return NotFound();
        return Ok(resident);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Resident resident)
    {
        if (resident.Relationship == "Head of Family") {
            resident.IsHead = true;
        }
        if (resident.BirthDate.HasValue) {
            resident.BirthDate = DateTime.SpecifyKind(resident.BirthDate.Value, DateTimeKind.Utc);
        }
        _context.Set<Resident>().Add(resident);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = resident.Id }, resident);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] Resident updatedResident)
    {
        var resident = await _context.Set<Resident>().FindAsync(id);
        if (resident == null) return NotFound();

        resident.Fullname = updatedResident.Fullname;
        resident.Relationship = updatedResident.Relationship;
        resident.IsHead = updatedResident.Relationship == "Head of Family" || updatedResident.IsHead;
        resident.BirthDate = updatedResident.BirthDate.HasValue ? DateTime.SpecifyKind(updatedResident.BirthDate.Value, DateTimeKind.Utc) : null;
        resident.Gender = updatedResident.Gender;
        resident.Education = updatedResident.Education;
        resident.Occupation = updatedResident.Occupation;
        
        await _context.SaveChangesAsync();
        return Ok(resident);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var resident = await _context.Set<Resident>().FindAsync(id);
        if (resident == null) return NotFound();

        _context.Set<Resident>().Remove(resident);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
