using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CiviCore.Infrastructure.Data;
using CiviCore.Domain.Entities;
using Microsoft.AspNetCore.Authorization;

namespace CiviCore.Api.Controllers;

[ApiController]
[Route("api/organization/positions")]
[Authorize]
public class OrganizationPositionController : ControllerBase
{
    private readonly AppDbContext _context;

    public OrganizationPositionController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid? periodId)
    {
        var query = _context.Set<OrganizationPosition>()
            .Include(p => p.Resident)
            .Include(p => p.Householder)
            .AsQueryable();

        if (periodId.HasValue)
        {
            query = query.Where(p => p.PeriodId == periodId.Value);
        }

        var positions = await query.OrderBy(p => p.SortOrder).ToListAsync();
        return Ok(positions);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var position = await _context.Set<OrganizationPosition>()
            .Include(p => p.Resident)
            .Include(p => p.Householder)
            .FirstOrDefaultAsync(p => p.Id == id);
            
        if (position == null) return NotFound();
        return Ok(position);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] OrganizationPosition position)
    {
        // Validation: Ensure parent belongs to the same period
        if (position.ParentId.HasValue)
        {
            var parent = await _context.Set<OrganizationPosition>().FindAsync(position.ParentId.Value);
            if (parent == null || parent.PeriodId != position.PeriodId)
            {
                return BadRequest(new { message = "Invalid parent position." });
            }
        }

        // Validation: Ensure person is not already assigned in this period
        if (position.ResidentId.HasValue)
        {
            var exists = await _context.Set<OrganizationPosition>()
                .AnyAsync(p => p.PeriodId == position.PeriodId && p.ResidentId == position.ResidentId);
            if (exists) return BadRequest(new { message = "Resident is already assigned to a position in this period." });
        }
        else if (position.HouseholderId.HasValue)
        {
            var exists = await _context.Set<OrganizationPosition>()
                .AnyAsync(p => p.PeriodId == position.PeriodId && p.HouseholderId == position.HouseholderId);
            if (exists) return BadRequest(new { message = "Householder is already assigned to a position in this period." });
        }

        _context.Set<OrganizationPosition>().Add(position);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = position.Id }, position);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] OrganizationPosition updatedPosition)
    {
        var position = await _context.Set<OrganizationPosition>().FindAsync(id);
        if (position == null) return NotFound();

        // Validation: Prevent circular reference
        if (updatedPosition.ParentId.HasValue)
        {
            if (updatedPosition.ParentId.Value == position.Id)
            {
                return BadRequest(new { message = "A position cannot be its own parent." });
            }

            if (await IsAncestor(position.Id, updatedPosition.ParentId.Value))
            {
                return BadRequest(new { message = "Circular reference detected." });
            }

            var newParent = await _context.Set<OrganizationPosition>().FindAsync(updatedPosition.ParentId.Value);
            if (newParent == null || newParent.PeriodId != position.PeriodId)
            {
                return BadRequest(new { message = "Invalid parent position." });
            }
        }

        // Validation: Check person conflict
        if (updatedPosition.ResidentId.HasValue)
        {
            var exists = await _context.Set<OrganizationPosition>()
                .AnyAsync(p => p.Id != id && p.PeriodId == position.PeriodId && p.ResidentId == updatedPosition.ResidentId);
            if (exists) return BadRequest(new { message = "Resident is already assigned to another position in this period." });
        }
        else if (updatedPosition.HouseholderId.HasValue)
        {
            var exists = await _context.Set<OrganizationPosition>()
                .AnyAsync(p => p.Id != id && p.PeriodId == position.PeriodId && p.HouseholderId == updatedPosition.HouseholderId);
            if (exists) return BadRequest(new { message = "Householder is already assigned to another position in this period." });
        }

        position.PositionName = updatedPosition.PositionName;
        position.ParentId = updatedPosition.ParentId;
        position.ResidentId = updatedPosition.ResidentId;
        position.HouseholderId = updatedPosition.HouseholderId;
        position.SortOrder = updatedPosition.SortOrder;

        await _context.SaveChangesAsync();
        return Ok(position);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var position = await _context.Set<OrganizationPosition>().FindAsync(id);
        if (position == null) return NotFound();

        // Optional: Reassign children's parent to null or cascade delete
        var children = await _context.Set<OrganizationPosition>().Where(p => p.ParentId == id).ToListAsync();
        foreach(var child in children)
        {
            child.ParentId = null; // or cascade delete depending on requirements
        }

        _context.Set<OrganizationPosition>().Remove(position);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    private async Task<bool> IsAncestor(Guid positionId, Guid targetParentId)
    {
        var currentId = targetParentId;
        var visited = new HashSet<Guid>();

        while (true)
        {
            if (visited.Contains(currentId)) break; // Prevent infinite loop on corrupt data
            visited.Add(currentId);

            if (currentId == positionId) return true;

            var current = await _context.Set<OrganizationPosition>()
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == currentId);

            if (current == null || current.ParentId == null) break;
            currentId = current.ParentId.Value;
        }

        return false;
    }
}
