using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CiviCore.Infrastructure.Data;
using CiviCore.Domain.Entities;
using Microsoft.AspNetCore.Authorization;

namespace CiviCore.Api.Controllers;

[ApiController]
[Route("api/blocks")]
[Authorize]
public class BlockController : ControllerBase
{
    private readonly AppDbContext _context;

    public BlockController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var blocks = await _context.Set<Block>()
            .Select(b => new {
                b.Id,
                b.Name,
                b.Description,
                Units = b.Units.Select(u => new {
                    u.Id,
                    u.UnitNumber,
                    u.HouseStatus,
                    IsAssigned = _context.Set<Householder>().Any(h => h.UnitId == u.Id)
                }).ToList()
            })
            .ToListAsync();
        return Ok(blocks);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var block = await _context.Set<Block>().Include(b => b.Units).FirstOrDefaultAsync(b => b.Id == id);
        if (block == null) return NotFound();
        return Ok(block);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Block block)
    {
        _context.Set<Block>().Add(block);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = block.Id }, block);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] Block updatedBlock)
    {
        var block = await _context.Set<Block>().FindAsync(id);
        if (block == null) return NotFound();

        block.Name = updatedBlock.Name;
        block.Description = updatedBlock.Description;
        
        await _context.SaveChangesAsync();
        return Ok(block);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var block = await _context.Set<Block>().FindAsync(id);
        if (block == null) return NotFound();

        _context.Set<Block>().Remove(block);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
