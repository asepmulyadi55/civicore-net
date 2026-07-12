using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CiviCore.Infrastructure.Data;
using CiviCore.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using CiviCore.Api.Services;
using ClosedXML.Excel;
using Microsoft.Extensions.DependencyInjection;
using CiviCore.Api.Models;
using CiviCore.Api.Extensions; // Import the extensions

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
    public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] Guid? block_id, [FromQuery] string? status, [FromQuery] int page = 1, [FromQuery] int per_page = 10)
    {
        var userBlockId = await User.GetBlockIdAsync(_context);

        var query = _context.Set<Householder>()
            .Include(h => h.Block)
            .Include(h => h.Unit)
            .Include(h => h.FeeHistories)
            .AsQueryable();

        // Overwrite block_id filter if the user is restricted to a block
        if (userBlockId.HasValue)
        {
            block_id = userBlockId.Value;
        }

        if (!string.IsNullOrEmpty(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(h => h.Fullname.ToLower().Contains(searchLower) || (h.Phone != null && h.Phone.Contains(search)));
        }

        if (block_id.HasValue)
        {
            query = query.Where(h => h.BlockId == block_id.Value);
        }

        if (!string.IsNullOrEmpty(status))
        {
            bool isActive = status.ToLower() == "active";
            query = query.Where(h => h.IsActive == isActive);
        }

        var total = await query.CountAsync();
        var last_page = (int)Math.Ceiling(total / (double)per_page);

        var householders = await query
            .OrderBy(h => h.Fullname)
            .Skip((page - 1) * per_page)
            .Take(per_page)
            .ToListAsync();
        
        // Decrypt family card numbers on read and set MonthlyFee
        foreach(var h in householders)
        {
            if (!string.IsNullOrEmpty(h.FamilyCardNumber))
            {
                h.FamilyCardNumber = _encryption.Decrypt(h.FamilyCardNumber);
            }
            var latestFee = h.FeeHistories.OrderByDescending(f => f.EffectiveFrom).FirstOrDefault();
            h.MonthlyFee = latestFee?.Amount ?? 0;
            h.EffectiveFrom = latestFee?.EffectiveFrom.ToString("MMMM yyyy");
        }
        
        return Ok(new {
            data = householders,
            meta = new {
                current_page = page,
                last_page = last_page,
                total = total,
                from = total == 0 ? 0 : (page - 1) * per_page + 1,
                to = Math.Min(page * per_page, total)
            }
        });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var householder = await _context.Set<Householder>()
            .Include(h => h.Block)
            .Include(h => h.Unit)
            .Include(h => h.FeeHistories)
            .Include(h => h.Residents)
            .FirstOrDefaultAsync(h => h.Id == id);
        if (householder == null) return NotFound();

        var latestFee = householder.FeeHistories.OrderByDescending(f => f.EffectiveFrom).FirstOrDefault();
        householder.MonthlyFee = latestFee?.Amount ?? 0;
        householder.EffectiveFrom = latestFee?.EffectiveFrom.ToString("yyyy-MM");

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

    public class UpdateHouseholderDto
    {
        public string Fullname { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? Notes { get; set; }
        public string? FamilyCardNumber { get; set; }
        public bool IsActive { get; set; }
        public decimal? NewMonthlyFee { get; set; }
        public string? EffectiveFrom { get; set; }
        public Guid? BlockId { get; set; }
        public Guid? UnitId { get; set; }
        public string? PhotoPath { get; set; }
        public Guid? UserId { get; set; }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateHouseholderDto dto)
    {
        var householder = await _context.Set<Householder>().FindAsync(id);
        if (householder == null) return NotFound();

        householder.Fullname = dto.Fullname;
        householder.Phone = dto.Phone;
        householder.Email = dto.Email;
        householder.Notes = dto.Notes;
        householder.IsActive = dto.IsActive;
        householder.PhotoPath = dto.PhotoPath;

        if (dto.BlockId.HasValue) householder.BlockId = dto.BlockId.Value;
        if (dto.UnitId.HasValue) householder.UnitId = dto.UnitId.Value;
        householder.UserId = dto.UserId;

        if (!string.IsNullOrEmpty(dto.FamilyCardNumber))
        {
            householder.FamilyCardNumber = _encryption.Encrypt(dto.FamilyCardNumber);
        }

        if (dto.NewMonthlyFee.HasValue && !string.IsNullOrEmpty(dto.EffectiveFrom))
        {
            if (DateTime.TryParse(dto.EffectiveFrom + "-01", out DateTime effectiveDate))
            {
                var fee = new FeeHistory {
                    HouseholderId = id,
                    Amount = dto.NewMonthlyFee.Value,
                    EffectiveFrom = DateTime.SpecifyKind(effectiveDate, DateTimeKind.Utc)
                };
                _context.Set<FeeHistory>().Add(fee);
            }
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

    public class BulkDeleteRequest { public List<Guid> Ids { get; set; } = new(); }

    [HttpDelete("bulk")]
    public async Task<IActionResult> BulkDelete([FromBody] BulkDeleteRequest request)
    {
        if (request.Ids == null || !request.Ids.Any()) return BadRequest();
        var householders = await _context.Set<Householder>().Where(h => request.Ids.Contains(h.Id)).ToListAsync();
        _context.Set<Householder>().RemoveRange(householders);
        await _context.SaveChangesAsync();
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
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> ImportExcel(
        IFormFile excel_file, 
        [FromForm] int year = 2026,
        [FromServices] ImportJobTracker? tracker = null,
        [FromServices] IServiceScopeFactory? scopeFactory = null)
    {
        if (excel_file == null || excel_file.Length == 0)
            return BadRequest(new { message = "Please choose an Excel file to upload." });

        if (year < 2020 || year > 2035)
            return BadRequest(new { message = "Year must be between 2020 and 2035." });

        if (tracker == null || scopeFactory == null)
            return BadRequest(new { message = "Services not configured for background import." });

        var tempFile = Path.Combine(Path.GetTempPath(), Path.GetRandomFileName());
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

                int householdersCreated = 0;
                int householdersSkipped = 0;
                int feesCreated = 0;

                var effectiveFrom = new DateTime(year, 1, 1, 0, 0, 0, DateTimeKind.Utc);
                
                var allBlocks = await dbContext.Set<Block>().ToListAsync();
                var blockCache = allBlocks.ToDictionary(b => b.Name, StringComparer.OrdinalIgnoreCase);
                
                var allUnits = await dbContext.Set<Unit>().ToListAsync();
                var unitCache = allUnits.ToDictionary(u => $"{u.BlockId}_{u.UnitNumber}");
                
                var allHouseholders = await dbContext.Set<Householder>().ToListAsync();
                var householderCache = allHouseholders.ToDictionary(h => h.UnitId);
                
                var allFees = await dbContext.Set<FeeHistory>().Where(f => f.EffectiveFrom == effectiveFrom).ToListAsync();
                var feeCache = allFees.Where(f => f.HouseholderId.HasValue).ToDictionary(f => f.HouseholderId!.Value);

                string currentBlock = "";
                var newHouseholders = new List<Householder>();
                var newFees = new List<FeeHistory>();

                for (int row = 2; row <= rowCount; row++)
                {
                    job.ProcessedRows = row - 1;

                    var blockLetter = worksheet.Cell(row, 1).GetString().Trim().ToUpper();
                    if (!string.IsNullOrEmpty(blockLetter))
                        currentBlock = blockLetter;
                    else
                        blockLetter = currentBlock;

                    var unitNum = worksheet.Cell(row, 2).GetString().Trim();
                    var name = worksheet.Cell(row, 3).GetString().Trim();
                    var rawStatus = System.Text.RegularExpressions.Regex.Replace(
                        worksheet.Cell(row, 4).GetString().Trim().ToLower(),
                        @"\s+", " ", System.Text.RegularExpressions.RegexOptions.None, System.TimeSpan.FromMilliseconds(500));

                    if (string.IsNullOrEmpty(blockLetter) || string.IsNullOrEmpty(unitNum) || string.IsNullOrEmpty(name)) continue;
                    
                    var skipStatuses = new[] { "fasum", "fasilitasumum", "developer" };
                    if (skipStatuses.Contains(rawStatus)) continue;
                    
                    if (!blockLetter.All(char.IsLetter)) continue;

                    if (!blockCache.TryGetValue(blockLetter, out var block)) continue;
                    
                    string unitCacheKey = $"{block.Id}_{unitNum}";
                    if (!unitCache.TryGetValue(unitCacheKey, out var unit)) continue;

                    if (!householderCache.TryGetValue(unit.Id, out var householder))
                    {
                        householder = new Householder
                        {
                            Id = Guid.NewGuid(),
                            UnitId = unit.Id,
                            BlockId = block.Id,
                            Fullname = name,
                            IsActive = true
                        };
                        newHouseholders.Add(householder);
                        householderCache[unit.Id] = householder;
                        householdersCreated++;
                    }
                    else
                    {
                        householdersSkipped++;
                    }

                    decimal feeAmount = 0;
                    if (!worksheet.Cell(row, 5).TryGetValue<decimal>(out feeAmount))
                    {
                        decimal.TryParse(worksheet.Cell(row, 5).GetString().Trim(), out feeAmount);
                    }
                    
                    if (feeAmount > 0 && !feeCache.ContainsKey(householder.Id))
                        {
                            var fee = new FeeHistory
                            {
                                Householder = householder,
                                Amount = feeAmount,
                                EffectiveFrom = effectiveFrom,
                                Notes = $"Imported from Excel ({year})"
                            };
                            newFees.Add(fee);
                            feeCache[householder.Id] = fee;
                            feesCreated++;
                        }
                    }

                if (newHouseholders.Any()) dbContext.Set<Householder>().AddRange(newHouseholders);
                if (newFees.Any()) dbContext.Set<FeeHistory>().AddRange(newFees);
                
                await dbContext.SaveChangesAsync();

                job.Status = "Completed";
                job.Message = $"Import complete — {householdersCreated} householder(s) created, {householdersSkipped} already existed | {feesCreated} fee record(s) created.";
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
                    try { System.IO.File.Delete(tempFile); } catch { /* Ignored by design */ }
                }
            }
        });

        return Accepted(new { jobId = job.JobId });
    }

    [HttpPatch("{id}/deactivate")]
    public async Task<IActionResult> Deactivate(Guid id)
    {
        var householder = await _context.Set<Householder>().FindAsync(id);
        if (householder == null) return NotFound();

        householder.IsActive = false;
        await _context.SaveChangesAsync();
        return Ok(householder);
    }
}
