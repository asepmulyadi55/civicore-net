using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CiviCore.Infrastructure.Data;
using CiviCore.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using ClosedXML.Excel;

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
            .OrderBy(b => b.Name)
            .Select(b => new {
                b.Id,
                b.Name,
                b.Description,
                units_count = b.Units.Count,
                owner_occupied_units_count = b.Units.Count(u => u.HouseStatus == CiviCore.Domain.Enums.HouseStatus.OwnerOccupied),
                rented_units_count = b.Units.Count(u => u.HouseStatus == CiviCore.Domain.Enums.HouseStatus.Rented),
                vacant_units_count = b.Units.Count(u => u.HouseStatus == CiviCore.Domain.Enums.HouseStatus.Vacant),
                public_facility_units_count = b.Units.Count(u => u.HouseStatus == CiviCore.Domain.Enums.HouseStatus.PublicFacility),
                developer_units_count = b.Units.Count(u => u.HouseStatus == CiviCore.Domain.Enums.HouseStatus.Developer),
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
                .ThenInclude(u => u.Householder)
            .Include(b => b.Coordinators).ThenInclude(c => c.Resident)
            .Include(b => b.Coordinators).ThenInclude(c => c.Householder)
            .FirstOrDefaultAsync(b => b.Id == id);
            
        if (block == null) return NotFound();
        
        return Ok(new {
            block.Id,
            block.Name,
            block.Description,
            units_count = block.Units.Count,
            owner_occupied_units_count = block.Units.Count(u => u.HouseStatus == CiviCore.Domain.Enums.HouseStatus.OwnerOccupied),
            rented_units_count = block.Units.Count(u => u.HouseStatus == CiviCore.Domain.Enums.HouseStatus.Rented),
            vacant_units_count = block.Units.Count(u => u.HouseStatus == CiviCore.Domain.Enums.HouseStatus.Vacant),
            public_facility_units_count = block.Units.Count(u => u.HouseStatus == CiviCore.Domain.Enums.HouseStatus.PublicFacility),
            developer_units_count = block.Units.Count(u => u.HouseStatus == CiviCore.Domain.Enums.HouseStatus.Developer),
            Coordinators = block.Coordinators.Select(c => new {
                type = c.ResidentId != null ? "resident" : "householder",
                id = c.ResidentId ?? c.HouseholderId,
                name = c.Resident != null ? c.Resident.Fullname : (c.Householder != null ? c.Householder.Fullname : "Unknown")
            }).ToList(),
            Units = block.Units.Select(u => new {
                u.Id,
                u.UnitNumber,
                u.HouseStatus,
                current_householder = u.Householder != null ? new { fullname = u.Householder.Fullname } : null
            }).ToList()
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

    public class BulkDeleteRequest { public List<Guid> Ids { get; set; } = new(); }

    [HttpDelete("bulk")]
    public async Task<IActionResult> BulkDelete([FromBody] BulkDeleteRequest request)
    {
        var blocks = await _context.Set<Block>()
            .Include(b => b.Coordinators)
            .Where(b => request.Ids.Contains(b.Id))
            .ToListAsync();

        foreach (var block in blocks)
        {
            _context.Set<BlockCoordinator>().RemoveRange(block.Coordinators);
            _context.Set<Block>().Remove(block);
        }

        await _context.SaveChangesAsync();
        return NoContent();
    }
    [HttpPost("import")]
    public async Task<IActionResult> ImportExcel([FromForm] IFormFile excel_file)
    {
        if (excel_file == null || excel_file.Length == 0)
            return BadRequest(new { message = "Please choose an Excel file to upload." });

        using var stream = new MemoryStream();
        await excel_file.CopyToAsync(stream);
        using var workbook = new XLWorkbook(stream);
        var worksheet = workbook.Worksheet(1);
        var rowCount = worksheet.LastRowUsed()?.RowNumber() ?? 0;

        int blocksCreated = 0;
        int blocksSkipped = 0;
        int unitsCreated = 0;
        int unitsSkipped = 0;
        var blockCache = new Dictionary<string, Block>();

        string lastBlockLetter = "";

        for (int row = 2; row <= rowCount; row++)
        {
            var blockLetter = (worksheet.Cell(row, 1).Value.ToString() ?? "").Trim().ToUpper();
            if (!string.IsNullOrEmpty(blockLetter))
            {
                lastBlockLetter = blockLetter;
            }
            else
            {
                blockLetter = lastBlockLetter;
            }

            var unitNum = (worksheet.Cell(row, 2).Value.ToString() ?? "").Trim();
            var rawStatus = System.Text.RegularExpressions.Regex.Replace(
                (worksheet.Cell(row, 4).Value.ToString() ?? "").Trim().ToLower(), 
                @"\s+", " ");

            if (string.IsNullOrEmpty(blockLetter) || string.IsNullOrEmpty(unitNum)) continue;

            if (!blockCache.ContainsKey(blockLetter))
            {
                var block = await _context.Set<Block>().FirstOrDefaultAsync(b => b.Name == blockLetter);
                if (block == null)
                {
                    block = new Block { Name = blockLetter };
                    _context.Set<Block>().Add(block);
                    await _context.SaveChangesAsync();
                    blocksCreated++;
                }
                else
                {
                    blocksSkipped++;
                }
                blockCache[blockLetter] = block;
            }

            var currentBlock = blockCache[blockLetter];

            var houseStatus = CiviCore.Domain.Enums.HouseStatus.Vacant;
            switch (rawStatus)
            {
                case "pemilik":
                case "warga":
                    houseStatus = CiviCore.Domain.Enums.HouseStatus.OwnerOccupied;
                    break;
                case "pemilik/kosong":
                case "pemilik kosong":
                case "kavling":
                case "":
                    houseStatus = CiviCore.Domain.Enums.HouseStatus.Vacant;
                    break;
                case "pengontrak":
                    houseStatus = CiviCore.Domain.Enums.HouseStatus.Rented;
                    break;
                case "developer":
                    houseStatus = CiviCore.Domain.Enums.HouseStatus.Developer;
                    break;
                case "fasum":
                case "fasilitasumum":
                    houseStatus = CiviCore.Domain.Enums.HouseStatus.PublicFacility;
                    break;
            }

            var unit = await _context.Set<Unit>().FirstOrDefaultAsync(u => u.BlockId == currentBlock.Id && u.UnitNumber == unitNum);
            if (unit == null)
            {
                unit = new Unit { BlockId = currentBlock.Id, UnitNumber = unitNum, HouseStatus = houseStatus };
                _context.Set<Unit>().Add(unit);
                unitsCreated++;
            }
            else
            {
                unit.HouseStatus = houseStatus;
                unitsSkipped++;
            }
        }

        await _context.SaveChangesAsync();

        var summary = $"Import complete — {blocksCreated} block(s) created, {blocksSkipped} already existed | {unitsCreated} unit(s) created, {unitsSkipped} already existed.";
        return Ok(new { message = summary });
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
