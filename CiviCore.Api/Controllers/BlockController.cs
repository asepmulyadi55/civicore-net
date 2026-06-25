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
            .Include(b => b.Units)
            .Include(b => b.Coordinators).ThenInclude(c => c.Resident)
            .Include(b => b.Coordinators).ThenInclude(c => c.Householder)
            .Select(b => new {
                b.Id,
                b.Name,
                b.Description,
                Coordinators = b.Coordinators.Select(c => new {
                    type = c.ResidentId != null ? "resident" : "householder",
                    id = c.ResidentId ?? c.HouseholderId,
                    name = c.Resident != null ? c.Resident.Fullname : (c.Householder != null ? c.Householder.Fullname : "Unknown")
                }).ToList(),
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
        var block = await _context.Set<Block>()
            .Include(b => b.Units)
            .Include(b => b.Coordinators).ThenInclude(c => c.Resident)
            .Include(b => b.Coordinators).ThenInclude(c => c.Householder)
            .FirstOrDefaultAsync(b => b.Id == id);
            
        if (block == null) return NotFound();
        
        return Ok(new {
            block.Id,
            block.Name,
            block.Description,
            Coordinators = block.Coordinators.Select(c => new {
                type = c.ResidentId != null ? "resident" : "householder",
                id = c.ResidentId ?? c.HouseholderId,
                name = c.Resident != null ? c.Resident.Fullname : (c.Householder != null ? c.Householder.Fullname : "Unknown")
            }).ToList(),
            block.Units
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] BlockDto dto)
    {
        var block = new Block
        {
            Name = dto.Name,
            Description = dto.Description
        };

        _context.Set<Block>().Add(block);

        if (dto.Coordinators != null && dto.Coordinators.Any())
        {
            foreach (var coord in dto.Coordinators)
            {
                if (Guid.TryParse(coord.Id, out var coordId))
                {
                    var bc = new BlockCoordinator { BlockId = block.Id };
                    if (coord.Type == "resident") bc.ResidentId = coordId;
                    else if (coord.Type == "householder") bc.HouseholderId = coordId;
                    _context.Set<BlockCoordinator>().Add(bc);
                }
            }
        }

        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = block.Id }, block);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] BlockDto dto)
    {
        var block = await _context.Set<Block>()
            .Include(b => b.Coordinators)
            .FirstOrDefaultAsync(b => b.Id == id);
            
        if (block == null) return NotFound();

        block.Name = dto.Name;
        block.Description = dto.Description;
        
        _context.Set<BlockCoordinator>().RemoveRange(block.Coordinators);

        if (dto.Coordinators != null && dto.Coordinators.Any())
        {
            foreach (var coord in dto.Coordinators)
            {
                if (Guid.TryParse(coord.Id, out var coordId))
                {
                    var bc = new BlockCoordinator { BlockId = block.Id };
                    if (coord.Type == "resident") bc.ResidentId = coordId;
                    else if (coord.Type == "householder") bc.HouseholderId = coordId;
                    _context.Set<BlockCoordinator>().Add(bc);
                }
            }
        }

        await _context.SaveChangesAsync();
        return Ok(block);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var block = await _context.Set<Block>()
            .Include(b => b.Coordinators)
            .FirstOrDefaultAsync(b => b.Id == id);
            
        if (block == null) return NotFound();

        _context.Set<BlockCoordinator>().RemoveRange(block.Coordinators);
        _context.Set<Block>().Remove(block);
        
        await _context.SaveChangesAsync();
        return NoContent();
    }
}

public class CoordinatorDto
{
    public string Type { get; set; } = string.Empty;
    public string Id { get; set; } = string.Empty;
}

public class BlockDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool Is_Active { get; set; } = true;
    public List<CoordinatorDto>? Coordinators { get; set; }
}
