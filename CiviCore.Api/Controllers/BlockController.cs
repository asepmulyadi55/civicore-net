using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CiviCore.Infrastructure.Data;
using CiviCore.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using CiviCore.Api.Services;
using ClosedXML.Excel;
using Microsoft.Extensions.DependencyInjection;
using CiviCore.Api.Models;

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
                Units = b.Units.OrderBy(u => u.UnitNumber.Length).ThenBy(u => u.UnitNumber).Select(u => new {
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
            Units = block.Units.OrderBy(u => u.UnitNumber.Length).ThenBy(u => u.UnitNumber).Select(u => new {
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

        bool hasHouseholders = await _context.Set<Householder>().AnyAsync(h => h.Unit.BlockId == id);
        if (hasHouseholders) return BadRequest(new { message = "Cannot delete block as one or more of its units are assigned to householders." });

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

        int deletedCount = 0;
        List<string> failedBlocks = new List<string>();

        foreach (var block in blocks)
        {
            bool hasHouseholders = await _context.Set<Householder>().AnyAsync(h => h.Unit.BlockId == block.Id);
            if (hasHouseholders)
            {
                failedBlocks.Add(block.Name);
            }
            else
            {
                _context.Set<BlockCoordinator>().RemoveRange(block.Coordinators);
                _context.Set<Block>().Remove(block);
                deletedCount++;
            }
        }

        await _context.SaveChangesAsync();

        if (failedBlocks.Any())
        {
            return BadRequest(new { message = $"Successfully deleted {deletedCount} blocks. Failed to delete blocks ({string.Join(", ", failedBlocks)}) because they still have related householders." });
        }

        return NoContent();
    }
    [HttpGet("import-status/{jobId}")]
    public IActionResult GetImportStatus(Guid jobId, [FromServices] ImportJobTracker tracker)
    {
        var job = tracker.GetJob(jobId);
        if (job == null) return NotFound(new { message = "Job not found." });
        return Ok(job);
    }

    [HttpPost("import")]
    public async Task<IActionResult> ImportExcel(
        IFormFile excel_file,
        [FromServices] ImportJobTracker? tracker = null,
        [FromServices] IServiceScopeFactory? scopeFactory = null)
    {
        if (excel_file == null || excel_file.Length == 0)
            return BadRequest(new { message = "Please choose an Excel file to upload." });

        if (tracker == null || scopeFactory == null)
            return BadRequest(new { message = "Services not configured for background import." });

        var tempFile = Path.GetTempFileName();
        using (var stream = new FileStream(tempFile, FileMode.Create))
        {
            await excel_file.CopyToAsync(stream);
        }

        var job = tracker.CreateJob();

        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                job.Status = "Processing";

                using var workbookStream = new FileStream(tempFile, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
                using var workbook = new XLWorkbook(workbookStream);
                var worksheet = workbook.Worksheet(1);
                var rowCount = worksheet.LastRowUsed()?.RowNumber() ?? 0;
                job.TotalRows = rowCount > 1 ? rowCount - 1 : 0;

                int blocksCreated = 0;
                int blocksSkipped = 0;
                int unitsCreated = 0;
                int unitsSkipped = 0;
                
                var allBlocks = await dbContext.Set<Block>().ToListAsync();
                var blockCache = allBlocks.ToDictionary(b => b.Name, StringComparer.OrdinalIgnoreCase);

                var allUnits = await dbContext.Set<Unit>().ToListAsync();
                var unitCache = allUnits.ToDictionary(u => $"{u.BlockId}_{u.UnitNumber}");

                string lastBlockLetter = "";
                var newBlocks = new List<Block>();
                var newUnits = new List<Unit>();

                for (int row = 2; row <= rowCount; row++)
                {
                    job.ProcessedRows = row - 1;

                    var blockLetter = worksheet.Cell(row, 1).GetString().Trim().ToUpper();
                    if (!string.IsNullOrEmpty(blockLetter))
                        lastBlockLetter = blockLetter;
                    else
                        blockLetter = lastBlockLetter;

                    var unitNum = worksheet.Cell(row, 2).GetString().Trim();
                    var rawStatus = System.Text.RegularExpressions.Regex.Replace(
                        worksheet.Cell(row, 4).GetString().Trim().ToLower(), 
                        @"\s+", " ");

                    if (string.IsNullOrEmpty(blockLetter) || string.IsNullOrEmpty(unitNum)) continue;

                    if (!blockCache.TryGetValue(blockLetter, out var block))
                    {
                        block = new Block { Name = blockLetter };
                        newBlocks.Add(block);
                        blockCache[blockLetter] = block;
                        blocksCreated++;
                    }
                    else
                    {
                        blocksSkipped++;
                    }

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

                    string unitCacheKey = $"{block.Id}_{unitNum}";
                    if (block.Id == Guid.Empty)
                    {
                        // Block is not saved yet, its Id is empty, use its reference or name as cache key
                        unitCacheKey = $"TEMP_{blockLetter}_{unitNum}";
                    }

                    if (!unitCache.TryGetValue(unitCacheKey, out var unit))
                    {
                        unit = new Unit { Block = block, UnitNumber = unitNum, HouseStatus = houseStatus };
                        newUnits.Add(unit);
                        unitCache[unitCacheKey] = unit;
                        unitsCreated++;
                    }
                    else
                    {
                        if (unit.HouseStatus != houseStatus)
                        {
                            unit.HouseStatus = houseStatus;
                            // Need to track this update, since it's already in DB, we'll just let EF track it if we use it from DB,
                            // but our unitCache is disconnected if we don't query it inside the background task tracking properly.
                            // However, unit is retrieved from allUnits which IS tracked by dbContext! So modifying unit is fine.
                        }
                        unitsSkipped++;
                    }
                }

                if (newBlocks.Any()) dbContext.Set<Block>().AddRange(newBlocks);
                if (newUnits.Any()) dbContext.Set<Unit>().AddRange(newUnits);

                await dbContext.SaveChangesAsync();

                job.Status = "Completed";
                job.Message = $"Import complete — {blocksCreated} block(s) created, {blocksSkipped} already existed | {unitsCreated} unit(s) created, {unitsSkipped} already existed.";
            }
            catch (Exception ex)
            {
                job.Status = "Failed";
                job.Message = "Error processing Excel file: " + ex.Message;
            }
            finally
            {
                if (System.IO.File.Exists(tempFile))
                {
                    try { System.IO.File.Delete(tempFile); } catch { }
                }
            }
        });

        return Accepted(new { jobId = job.JobId });
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
