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

[ApiController]
[Route("api/payments")]
[Authorize]
public class PaymentController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;

    public PaymentController(AppDbContext context, UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1)
    {
        var allRecords = await _context.Set<PaymentRecord>()
            .Include(p => p.Block)
            .Include(p => p.Householder)
            .OrderByDescending(p => p.PaymentMonth)
            .ToListAsync();

        var grouped = allRecords
            .GroupBy(p => p.BatchId?.ToString() ?? p.Id.ToString())
            .Select(g =>
            {
                var lead = g.OrderBy(p => p.PaymentMonth).First();
                return new
                {
                    id = lead.Id, // Lead ID
                    batchId = g.Key,
                    householderId = lead.HouseholderId,
                    householderName = lead.Householder?.Fullname ?? lead.HouseholderName,
                    blockName = lead.Block?.Name ?? lead.UnitNumber,
                    unit = lead.UnitNumber,
                    amount = g.Sum(p => p.Amount),
                    allMonths = g.Select(p => p.PaymentMonth.ToString("yyyy-MM-ddTHH:mm:ssZ")).OrderBy(m => m).ToList(),
                    paymentMonth = lead.PaymentMonth.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    status = lead.Status.ToString().ToLower(),
                    createdAt = lead.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    approvedAt = lead.ApprovedAt?.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    rejectionReason = lead.RejectionReason,
                    notes = lead.Notes
                };
            })
            .OrderByDescending(x => x.status == "pending") // pending first
            .ThenByDescending(x => x.paymentMonth)
            .ToList();

        int pageSize = 20;
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
        var isTreasurer = user != null && (await _userManager.IsInRoleAsync(user, "Treasurer") || await _userManager.IsInRoleAsync(user, "Admin"));

        var householder = await _context.Set<Householder>().FindAsync(dto.HouseholderId);
        var block = await _context.Set<Block>().FindAsync(dto.BlockId);

        Guid batchId = Guid.NewGuid();
        var records = new List<PaymentRecord>();

        foreach (var monthStr in dto.Months)
        {
            if (!DateTime.TryParse(monthStr, out var parsedMonth)) continue;

            var payment = new PaymentRecord
            {
                BatchId = batchId,
                HouseholderId = dto.HouseholderId,
                BlockId = dto.BlockId,
                HouseholderName = householder?.Fullname,
                UnitNumber = block?.Name,
                Amount = dto.AmountPerMonth,
                PaymentMonth = parsedMonth.ToUniversalTime(),
                Notes = dto.Notes,
                Status = isTreasurer ? PaymentStatus.Approved : PaymentStatus.Pending,
                SubmittedById = user?.Id
            };

            if (dto.PaymentMethodId.HasValue && dto.PaymentMethodId != Guid.Empty)
            {
                payment.PaymentMethodId = dto.PaymentMethodId.Value;
            }

            if (isTreasurer)
            {
                payment.ApprovedById = user?.Id;
                payment.ApprovedAt = DateTime.UtcNow;
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

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] PaymentRecord updatedPayment)
    {
        var payment = await _context.Set<PaymentRecord>().FindAsync(id);
        if (payment == null) return NotFound();

        var user = await _userManager.GetUserAsync(User);
        var isTreasurer = user != null && (await _userManager.IsInRoleAsync(user, "Treasurer") || await _userManager.IsInRoleAsync(user, "Admin"));

        if (!isTreasurer && (payment.Status == PaymentStatus.Pending || payment.Status == PaymentStatus.Rejected))
        {
            payment.Status = PaymentStatus.Pending;
        }

        if (isTreasurer && updatedPayment.Status == PaymentStatus.Approved)
        {
            payment.Status = PaymentStatus.Approved;
            if (user != null) payment.ApprovedById = user.Id;
            payment.ApprovedAt = DateTime.UtcNow;
        }
        else if (isTreasurer && updatedPayment.Status == PaymentStatus.Rejected)
        {
            payment.Status = PaymentStatus.Rejected;
            payment.RejectionReason = updatedPayment.RejectionReason;
        }

        payment.Amount = updatedPayment.Amount;
        payment.Notes = updatedPayment.Notes;
        
        await _context.SaveChangesAsync();
        return Ok(payment);
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

        _context.Set<PaymentRecord>().Remove(payment);
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
}
