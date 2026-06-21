using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CiviCore.Infrastructure.Data;
using CiviCore.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using CiviCore.Api.Services;

namespace CiviCore.Api.Controllers;

[ApiController]
[Route("api/householders")]
[Authorize]
public class HouseholderController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IEncryptionService _encryption;

    public HouseholderController(AppDbContext context, IEncryptionService encryption)
    {
        _context = context;
        _encryption = encryption;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var householders = await _context.Set<Householder>()
            .Include(h => h.Block)
            .Include(h => h.Unit)
            .ToListAsync();
        
        // Decrypt family card numbers on read
        foreach(var h in householders)
        {
            if (!string.IsNullOrEmpty(h.FamilyCardNumber))
            {
                h.FamilyCardNumber = _encryption.Decrypt(h.FamilyCardNumber);
            }
        }
        
        return Ok(householders);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var householder = await _context.Set<Householder>()
            .Include(h => h.Block)
            .Include(h => h.Unit)
            .FirstOrDefaultAsync(h => h.Id == id);
        if (householder == null) return NotFound();

        if (!string.IsNullOrEmpty(householder.FamilyCardNumber))
        {
            householder.FamilyCardNumber = _encryption.Decrypt(householder.FamilyCardNumber);
        }

        return Ok(householder);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Householder householder)
    {
        if (!string.IsNullOrEmpty(householder.FamilyCardNumber))
        {
            householder.FamilyCardNumber = _encryption.Encrypt(householder.FamilyCardNumber);
        }

        _context.Set<Householder>().Add(householder);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = householder.Id }, householder);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] Householder updatedHouseholder)
    {
        var householder = await _context.Set<Householder>().FindAsync(id);
        if (householder == null) return NotFound();

        householder.Fullname = updatedHouseholder.Fullname;
        householder.Phone = updatedHouseholder.Phone;
        householder.Email = updatedHouseholder.Email;
        householder.Notes = updatedHouseholder.Notes;

        if (!string.IsNullOrEmpty(updatedHouseholder.FamilyCardNumber))
        {
            householder.FamilyCardNumber = _encryption.Encrypt(updatedHouseholder.FamilyCardNumber);
        }

        await _context.SaveChangesAsync();
        return Ok(householder);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var householder = await _context.Set<Householder>().FindAsync(id);
        if (householder == null) return NotFound();

        _context.Set<Householder>().Remove(householder);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
