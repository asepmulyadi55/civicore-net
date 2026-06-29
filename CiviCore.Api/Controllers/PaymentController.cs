using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CiviCore.Infrastructure.Data;
using CiviCore.Domain.Entities;
using CiviCore.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using CiviCore.Api.Services;

namespace CiviCore.Api.Controllers;

public class PaymentCreateDto
{
    public Guid HouseholderId { get; set; }
    public Guid BlockId { get; set; }
    public decimal AmountPerMonth { get; set; }
    public List<string> Months { get; set; } = new();
    public string? Notes { get; set; }
    public Guid? PaymentMethodId { get; set; }
}

public class PaymentRejectDto
{
    public string Reason { get; set; } = string.Empty;
}

[ApiController]
[Route("api/payments")]
[Authorize]
public class PaymentController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILocalStorageService _storageService;

    public PaymentController(AppDbContext context, UserManager<ApplicationUser> userManager, ILocalStorageService storageService)
    {
        _context = context;
        _userManager = userManager;
        _storageService = storageService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] string? search = null,
        [FromQuery] string? status = null,
        [FromQuery] string? block_id = null,
        [FromQuery] string? month = null,
        [FromQuery] int? recorded_month = null,
        [FromQuery] int? recorded_year = null,
        [FromQuery] Guid? householderId = null,
        [FromQuery] int per_page = 20)
    {
        var query = _context.Set<PaymentRecord>()
            .Include(p => p.Block)
            .Include(p => p.Householder)
                .ThenInclude(h => h.Unit)
            .AsQueryable();

        // Search filter
        if (!string.IsNullOrEmpty(search))
        {
            var term = search.ToLower();
            query = query.Where(p =>
                (p.HouseholderName != null && p.HouseholderName.ToLower().Contains(term)) ||
                (p.UnitNumber != null && p.UnitNumber.ToLower().Contains(term)) ||
                (p.Householder != null && p.Householder.Fullname != null && p.Householder.Fullname.ToLower().Contains(term)));
        }

        if (householderId.HasValue)
        {
            query = query.Where(p => p.HouseholderId == householderId.Value);
        }

        // Block filter
        if (!string.IsNullOrEmpty(block_id) && Guid.TryParse(block_id, out var blockGuid))
        {
            query = query.Where(p => p.BlockId == blockGuid);
        }

        // Status filter
        if (!string.IsNullOrEmpty(status))
        {
            if (Enum.TryParse<PaymentStatus>(status, true, out var statusEnum))
            {
                query = query.Where(p => p.Status == statusEnum);
            }
        }

        // Payment month filter (format: "YYYY-MM")
        if (!string.IsNullOrEmpty(month))
        {
            if (DateTime.TryParse(month + "-01", out var monthDate))
            {
                query = query.Where(p => p.PaymentMonth.Year == monthDate.Year && p.PaymentMonth.Month == monthDate.Month);
            }
        }

        // Recorded date filters (created_at month/year)
        if (recorded_month.HasValue)
        {
            query = query.Where(p => p.CreatedAt.Month == recorded_month.Value);
        }
        if (recorded_year.HasValue)
        {
            query = query.Where(p => p.CreatedAt.Year == recorded_year.Value);
        }

        var allRecords = await query
            .OrderByDescending(p => p.PaymentMonth)
            .ToListAsync();

        var grouped = allRecords
            .GroupBy(p => p.BatchId?.ToString() ?? p.Id.ToString())
            .Select(g =>
            {
                var lead = g.OrderBy(p => p.PaymentMonth).First();
                return new
                {
                    id = lead.Id,
                    batchId = g.Key,
                    householderId = lead.HouseholderId,
                    householderName = lead.Householder?.Fullname ?? lead.HouseholderName,
                    blockName = lead.Block?.Name ?? lead.Householder?.Block?.Name,
                    unit = lead.Householder?.Unit?.UnitNumber ?? lead.UnitNumber,
                    amount = g.Sum(p => p.Amount),
                    allMonths = g.Select(p => p.PaymentMonth.ToString("yyyy-MM-ddTHH:mm:ssZ")).OrderBy(m => m).ToList(),
                    monthCount = g.Count(),
                    paymentMonth = lead.PaymentMonth.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    status = lead.Status.ToString().ToLower(),
                    createdAt = lead.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    approvedAt = lead.ApprovedAt?.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    rejectionReason = lead.RejectionReason,
                    notes = lead.Notes,
                    proofPath = lead.ProofPath,
                    paymentMethodId = lead.PaymentMethodId
                };
            })
            .OrderByDescending(x => x.status == "pending")
            .ThenByDescending(x => x.status == "rejected")
            .ThenByDescending(x => x.paymentMonth)
            .ToList();

        int pageSize = per_page;
        var total = grouped.Count;
        var pagedData = grouped.Skip((page - 1) * pageSize).Take(pageSize).ToList();

        return Ok(new
        {
            data = pagedData,
            meta = new
            {
                current_page = page,
                last_page = (int)Math.Ceiling(total / (double)pageSize),
                from = (page - 1) * pageSize + 1,
                to = Math.Min(page * pageSize, total),
                total = total
            }
        });
    }

    [HttpGet("methods")]
    public async Task<IActionResult> GetMethods()
    {
        var methods = await _context.Set<PaymentMethod>()
            .Where(m => m.IsActive)
            .Select(m => new { id = m.Id, name = m.Name, description = m.Description })
            .ToListAsync();
        return Ok(methods);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var payment = await _context.Set<PaymentRecord>()
            .Include(p => p.Block)
            .Include(p => p.Householder)
            .FirstOrDefaultAsync(p => p.Id == id);
        if (payment == null) return NotFound();
        return Ok(payment);
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var total = await _context.Set<PaymentRecord>().CountAsync();
        var pending = await _context.Set<PaymentRecord>().CountAsync(p => p.Status == PaymentStatus.Pending);
        var approved = await _context.Set<PaymentRecord>().CountAsync(p => p.Status == PaymentStatus.Approved);
        var rejected = await _context.Set<PaymentRecord>().CountAsync(p => p.Status == PaymentStatus.Rejected);

        return Ok(new
        {
            total,
            pending,
            approved,
            rejected
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] PaymentCreateDto dto)
    {
        if (dto.Months == null || !dto.Months.Any())
        {
            return BadRequest(new { message = "At least one month must be selected." });
        }

        var user = await _userManager.GetUserAsync(User);
        var householder = await _context.Set<Householder>()
            .Include(h => h.Unit)
            .FirstOrDefaultAsync(h => h.Id == dto.HouseholderId);
        var block = await _context.Set<Block>().FindAsync(dto.BlockId);

        Guid batchId = Guid.NewGuid();
        var records = new List<PaymentRecord>();

        foreach (var monthStr in dto.Months)
        {
            if (!DateTime.TryParse(monthStr, out var parsedMonth)) continue;

            // Check for duplicate — skip if payment already exists for this householder+month
            var paymentMonth = parsedMonth.ToUniversalTime();
            var exists = await _context.Set<PaymentRecord>()
                .AnyAsync(p => p.HouseholderId == dto.HouseholderId && p.PaymentMonth == paymentMonth);
            if (exists) continue;

            var payment = new PaymentRecord
            {
                BatchId = batchId,
                HouseholderId = dto.HouseholderId,
                BlockId = dto.BlockId,
                HouseholderName = householder?.Fullname,
                UnitNumber = householder?.Unit?.UnitNumber ?? block?.Name,
                Amount = dto.AmountPerMonth,
                PaymentMonth = paymentMonth,
                Notes = dto.Notes,
                Status = PaymentStatus.Pending,
                SubmittedById = user?.Id
            };

            if (dto.PaymentMethodId.HasValue && dto.PaymentMethodId != Guid.Empty)
            {
                payment.PaymentMethodId = dto.PaymentMethodId.Value;
            }

            records.Add(payment);
        }

        if (records.Any())
        {
            _context.Set<PaymentRecord>().AddRange(records);
            await _context.SaveChangesAsync();
        }

        return Ok(new { batchId = batchId, count = records.Count });
    }

    [HttpPost("{batchId}/proof")]
    public async Task<IActionResult> UploadProof(Guid batchId, [FromForm] IFormFile file, [FromServices] IConfiguration configuration)
    {
        if (file == null || file.Length == 0) return BadRequest("No file provided");

        var records = await _context.Set<PaymentRecord>()
            .Where(p => p.BatchId == batchId)
            .ToListAsync();
            
        if (!records.Any()) return NotFound("Batch not found");

        var ext = Path.GetExtension(file.FileName);
        var filePath = $"proofs/{batchId}{ext}";

        using var stream = file.OpenReadStream();
        await _storageService.UploadFileAsync(true, filePath, stream);

        var publicUrl = $"/api/media/path/{filePath}";

        foreach(var record in records)
        {
            record.ProofPath = publicUrl;
        }
        await _context.SaveChangesAsync();

        return Ok(new { url = publicUrl });
    }

    [HttpPost("{id}/approve")]
    public async Task<IActionResult> Approve(Guid id)
    {
        var payment = await _context.Set<PaymentRecord>().FindAsync(id);
        if (payment == null) return NotFound();

        var user = await _userManager.GetUserAsync(User);

        // Approve all records in the same batch
        if (payment.BatchId.HasValue)
        {
            var batchRecords = await _context.Set<PaymentRecord>()
                .Where(p => p.BatchId == payment.BatchId)
                .ToListAsync();

            foreach (var record in batchRecords)
            {
                record.Status = PaymentStatus.Approved;
                record.ApprovedById = user?.Id;
                record.ApprovedAt = DateTime.UtcNow;
                record.RejectionReason = null;
                record.UpdatedAt = DateTime.UtcNow;
            }
        }
        else
        {
            payment.Status = PaymentStatus.Approved;
            payment.ApprovedById = user?.Id;
            payment.ApprovedAt = DateTime.UtcNow;
            payment.RejectionReason = null;
            payment.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Payment approved successfully." });
    }

    [HttpPost("{id}/reject")]
    public async Task<IActionResult> Reject(Guid id, [FromBody] PaymentRejectDto dto)
    {
        if (string.IsNullOrEmpty(dto.Reason) || dto.Reason.Length < 10)
        {
            return BadRequest(new { message = "Rejection reason must be at least 10 characters." });
        }

        var payment = await _context.Set<PaymentRecord>().FindAsync(id);
        if (payment == null) return NotFound();

        // Reject all records in the same batch
        if (payment.BatchId.HasValue)
        {
            var batchRecords = await _context.Set<PaymentRecord>()
                .Where(p => p.BatchId == payment.BatchId)
                .ToListAsync();

            foreach (var record in batchRecords)
            {
                record.Status = PaymentStatus.Rejected;
                record.RejectionReason = dto.Reason;
                record.ApprovedById = null;
                record.ApprovedAt = null;
                record.UpdatedAt = DateTime.UtcNow;
            }
        }
        else
        {
            payment.Status = PaymentStatus.Rejected;
            payment.RejectionReason = dto.Reason;
            payment.ApprovedById = null;
            payment.ApprovedAt = null;
            payment.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Payment rejected." });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] PaymentCreateDto dto)
    {
        var payment = await _context.Set<PaymentRecord>().FindAsync(id);
        if (payment == null) return NotFound();

        if (dto.Months == null || !dto.Months.Any())
        {
            return BadRequest(new { message = "At least one month must be selected." });
        }

        var user = await _userManager.GetUserAsync(User);
        var householder = await _context.Set<Householder>()
            .Include(h => h.Unit)
            .FirstOrDefaultAsync(h => h.Id == dto.HouseholderId);
        var block = await _context.Set<Block>().FindAsync(dto.BlockId);

        var batchId = payment.BatchId ?? Guid.NewGuid();
        var oldProofPath = payment.ProofPath; // preserve old proof path

        // Parse new months
        var newMonths = dto.Months
            .Select(mStr => DateTime.TryParse(mStr, out var d) ? d.ToUniversalTime() : DateTime.MinValue)
            .Where(d => d != DateTime.MinValue)
            .ToList();

        // Check if any requested month is already approved
        var existingApproved = await _context.Set<PaymentRecord>()
            .AnyAsync(p => p.HouseholderId == dto.HouseholderId && p.Status == PaymentStatus.Approved && newMonths.Contains(p.PaymentMonth));
        if (existingApproved)
        {
            return BadRequest(new { message = "One or more selected months have already been approved and cannot be modified." });
        }

        // Remove old records in the current batch
        if (payment.BatchId.HasValue)
        {
            var batchRecords = await _context.Set<PaymentRecord>()
                .Where(p => p.BatchId == payment.BatchId)
                .ToListAsync();
            // Store proof path from any record in batch if present
            oldProofPath = batchRecords.FirstOrDefault(p => !string.IsNullOrEmpty(p.ProofPath))?.ProofPath ?? oldProofPath;
            _context.Set<PaymentRecord>().RemoveRange(batchRecords);
        }
        else
        {
            _context.Set<PaymentRecord>().Remove(payment);
        }

        // Clean up any other pending records for this householder that match the newly selected months
        // This allows merging separate pending payments into this single batch.
        var otherPendingRecords = await _context.Set<PaymentRecord>()
            .Where(p => p.HouseholderId == dto.HouseholderId && p.Status == PaymentStatus.Pending && newMonths.Contains(p.PaymentMonth))
            .ToListAsync();
            
        // Exclude the ones we already queued for removal (the current batch)
        var batchIdToExclude = payment.BatchId;
        var recordsToClean = otherPendingRecords.Where(p => p.BatchId != batchIdToExclude && p.Id != payment.Id).ToList();
        
        if (recordsToClean.Any())
        {
            _context.Set<PaymentRecord>().RemoveRange(recordsToClean);
        }

        // Create new records
        var records = new List<PaymentRecord>();
        foreach (var monthStr in dto.Months)
        {
            if (!DateTime.TryParse(monthStr, out var parsedMonth)) continue;
            var paymentMonth = parsedMonth.ToUniversalTime();

            var newPayment = new PaymentRecord
            {
                BatchId = batchId,
                HouseholderId = dto.HouseholderId,
                BlockId = dto.BlockId,
                HouseholderName = householder?.Fullname,
                UnitNumber = householder?.Unit?.UnitNumber ?? block?.Name,
                Amount = dto.AmountPerMonth,
                PaymentMonth = paymentMonth,
                Notes = dto.Notes,
                Status = PaymentStatus.Pending,
                SubmittedById = user?.Id,
                ProofPath = oldProofPath
            };

            if (dto.PaymentMethodId.HasValue && dto.PaymentMethodId != Guid.Empty)
            {
                newPayment.PaymentMethodId = dto.PaymentMethodId.Value;
            }

            records.Add(newPayment);
        }

        if (records.Any())
        {
            _context.Set<PaymentRecord>().AddRange(records);
            await _context.SaveChangesAsync();
        }

        return Ok(new { batchId = batchId, count = records.Count });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var payment = await _context.Set<PaymentRecord>().FindAsync(id);
        if (payment == null) return NotFound();

        var user = await _userManager.GetUserAsync(User);
        var isAdmin = user != null && await _userManager.IsInRoleAsync(user, "Admin");

        if (payment.Status == PaymentStatus.Approved && !isAdmin)
        {
            return Forbid("Only administrators can delete approved payments.");
        }

        // Delete all records in the batch
        if (payment.BatchId.HasValue)
        {
            var batchRecords = await _context.Set<PaymentRecord>()
                .Where(p => p.BatchId == payment.BatchId)
                .ToListAsync();
            _context.Set<PaymentRecord>().RemoveRange(batchRecords);
        }
        else
        {
            _context.Set<PaymentRecord>().Remove(payment);
        }

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("export")]
    public async Task<IActionResult> ExportPayments([FromServices] IExcelExportService exportService)
    {
        var payments = await _context.Set<PaymentRecord>()
            .Include(p => p.Block)
            .Include(p => p.Householder)
            .ToListAsync();
            
        var fileBytes = exportService.ExportPayments(payments);
        return File(fileBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "payments.xlsx");
    }


    [HttpGet("blocks")]
    public async Task<IActionResult> GetBlocks()
    {
        var blocks = await _context.Set<Block>()
            .OrderBy(b => b.Name)
            .Select(b => new { b.Id, b.Name })
            .ToListAsync();
        return Ok(blocks);
    }
}
