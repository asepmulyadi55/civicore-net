using CiviCore.Api.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CiviCore.Infrastructure.Data;
using CiviCore.Domain.Entities;
using CiviCore.Domain.Enums;
using CiviCore.Api.Services;
using Microsoft.AspNetCore.Authorization;
using System.Threading.Tasks;

namespace CiviCore.Api.Controllers;

public class FinanceTransactionDto
{
    public string Type { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    required public decimal Amount { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
[RequirePermissionModule("finance")]
public class FinanceController : ControllerBase
{
    private readonly AppDbContext _context;

    public FinanceController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("transactions")]
    public async Task<IActionResult> GetTransactions([FromQuery] string? type, [FromQuery] string? category, [FromQuery] string? search, [FromQuery] int? month, [FromQuery] int? year, [FromQuery] int page = 1)
    {
        var query = _context.Set<FinanceTransaction>().AsQueryable();

        if (!string.IsNullOrEmpty(type) && Enum.TryParse<FinanceTransactionType>(type, true, out var t))
        {
            query = query.Where(x => x.Type == t);
        }

        if (!string.IsNullOrEmpty(category))
        {
            query = query.Where(x => x.Category == category);
        }

        if (!string.IsNullOrEmpty(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(x => x.Description.ToLower().Contains(searchLower) || x.Category.ToLower().Contains(searchLower));
        }

        if (month.HasValue && year.HasValue)
        {
            query = query.Where(x => x.Date.Month == month.Value && x.Date.Year == year.Value);
        }
        else if (year.HasValue)
        {
            query = query.Where(x => x.Date.Year == year.Value);
        }

        int pageSize = 10;
        var total = await query.CountAsync();
        var transactions = await query
            .OrderByDescending(x => x.Date)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new
        {
            data = transactions.Select(x => new
            {
                id = x.Id,
                type = x.Type.ToString().ToLower(),
                category = x.Category,
                amount = x.Amount,
                description = x.Description,
                date = x.Date.ToString("yyyy-MM-ddTHH:mm:ss")
            }),
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

    [HttpPost("transactions")]
    public async Task<IActionResult> CreateTransaction([FromBody] FinanceTransactionDto dto)
    {
        if (!Enum.TryParse<FinanceTransactionType>(dto.Type, true, out var type))
        {
            return BadRequest(new { message = "Invalid transaction type" });
        }

        var transaction = new FinanceTransaction
        {
            Type = type,
            Category = dto.Category ?? "other",
            Amount = dto.Amount,
            Description = dto.Description ?? string.Empty,
            Date = DateTime.Parse(dto.Date, System.Globalization.CultureInfo.InvariantCulture).ToUniversalTime()
        };

        _context.Set<FinanceTransaction>().Add(transaction);
        await _context.SaveChangesAsync();

        return Ok(transaction);
    }

    [HttpPut("transactions/{id}")]
    public async Task<IActionResult> UpdateTransaction(Guid id, [FromBody] FinanceTransactionDto dto)
    {
        var transaction = await _context.Set<FinanceTransaction>().FindAsync(id);
        if (transaction == null)
            return NotFound();

        if (!Enum.TryParse<FinanceTransactionType>(dto.Type, true, out var type))
            return BadRequest(new { message = "Invalid transaction type" });

        transaction.Type = type;
        transaction.Category = dto.Category ?? "other";
        transaction.Amount = dto.Amount;
        transaction.Description = dto.Description ?? string.Empty;
        transaction.Date = DateTime.Parse(dto.Date, System.Globalization.CultureInfo.InvariantCulture).ToUniversalTime();

        await _context.SaveChangesAsync();
        return Ok(transaction);
    }

    [HttpDelete("transactions/{id}")]
    public async Task<IActionResult> DeleteTransaction(Guid id)
    {
        var transaction = await _context.Set<FinanceTransaction>().FindAsync(id);
        if (transaction == null)
            return NotFound();

        _context.Set<FinanceTransaction>().Remove(transaction);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Transaction deleted" });
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats([FromQuery] int? month, [FromQuery] int? year)
    {
        var targetMonth = month ?? DateTime.UtcNow.Month;
        var targetYear = year ?? DateTime.UtcNow.Year;
        
        var startOfTargetMonth = new DateTime(targetYear, targetMonth, 1, 0, 0, 0, DateTimeKind.Utc);
        var endOfTargetMonth = startOfTargetMonth.AddMonths(1).AddTicks(-1);

        // Get manual transactions
        var allTransactions = await _context.Set<FinanceTransaction>().ToListAsync();

        var manualIncome = allTransactions
            .Where(t => t.Type == FinanceTransactionType.Income && t.Date >= startOfTargetMonth && t.Date <= endOfTargetMonth)
            .Sum(t => t.Amount);

        // Calculate payment income exactly like Laravel
        var paymentIncome = await _context.Set<PaymentRecord>()
            .Where(p => p.Status == PaymentStatus.Approved && (
                (p.PaymentMonth.Year == targetYear && p.PaymentMonth.Month == targetMonth && p.UpdatedAt <= endOfTargetMonth) ||
                (p.PaymentMonth < startOfTargetMonth && p.UpdatedAt >= startOfTargetMonth && p.UpdatedAt <= endOfTargetMonth)
            ))
            .SumAsync(p => p.Amount);

        var periodIncome = manualIncome + paymentIncome;
            
        var periodExpense = allTransactions
            .Where(t => t.Type == FinanceTransactionType.Expense && t.Date >= startOfTargetMonth && t.Date <= endOfTargetMonth)
            .Sum(t => t.Amount);

        // Pending payments
        var pendingPayments = await _context.Set<PaymentRecord>()
            .Where(p => p.Status == PaymentStatus.Pending)
            .SumAsync(p => p.Amount);

        // Pending approvals (Reports)
        var pendingApprovals = await _context.Set<FinanceReport>()
            .Where(r => r.Status == FinanceReportStatus.Pending)
            .OrderByDescending(r => r.PeriodStart)
            .Select(r => new { r.Id, Month = r.PeriodStart.Month, Year = r.PeriodStart.Year, r.TotalIncome, r.TotalExpense })
            .ToListAsync();

        // Calculate 6 months trend
        var trends = new List<object>();
        for (int i = 5; i >= 0; i--)
        {
            var m = startOfTargetMonth.AddMonths(-i);
            var mEnd = m.AddMonths(1).AddTicks(-1);
            
            var mIncomeManual = allTransactions.Where(t => t.Type == FinanceTransactionType.Income && t.Date >= m && t.Date <= mEnd).Sum(t => t.Amount);
            var mIncomePayment = await _context.Set<PaymentRecord>()
                .Where(p => p.Status == PaymentStatus.Approved && (
                    (p.PaymentMonth.Year == m.Year && p.PaymentMonth.Month == m.Month && p.UpdatedAt <= mEnd) ||
                    (p.PaymentMonth < m && p.UpdatedAt >= m && p.UpdatedAt <= mEnd)
                ))
                .SumAsync(p => p.Amount);
                
            var mExpense = allTransactions.Where(t => t.Type == FinanceTransactionType.Expense && t.Date >= m && t.Date <= mEnd).Sum(t => t.Amount);
            trends.Add(new { month = m.ToString("MMM"), income = mIncomeManual + mIncomePayment, expense = mExpense });
        }

        // Real overall balance (sum of all manual incomes + all approved payments - all manual expenses)
        var totalManualIncome = allTransactions.Where(t => t.Type == FinanceTransactionType.Income).Sum(t => t.Amount);
        var totalManualExpense = allTransactions.Where(t => t.Type == FinanceTransactionType.Expense).Sum(t => t.Amount);
        var totalPaymentIncome = await _context.Set<PaymentRecord>().Where(p => p.Status == PaymentStatus.Approved).SumAsync(p => p.Amount);

        return Ok(new
        {
            balance = totalManualIncome + totalPaymentIncome - totalManualExpense,
            period_income = periodIncome,
            period_expense = periodExpense,
            pending_payments = pendingPayments,
            trends = trends,
            pending_approvals = pendingApprovals
        });
    }

    [HttpGet("export")]
    public async Task<IActionResult> ExportTransactions([FromServices] IExcelExportService exportService)
    {
        var transactions = await _context.Set<FinanceTransaction>().ToListAsync();
        var fileBytes = exportService.ExportFinanceTransactions(transactions);
        return File(fileBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "finance_transactions.xlsx");
    }

    [HttpGet("reports")]
    public async Task<IActionResult> GetReports()
    {
        var isAdmin = User.IsInRole("Admin") || User.IsInRole("Super Admin") || User.IsInRole("admin") || User.IsInRole("super-admin");
        var query = _context.Set<FinanceReport>().AsQueryable();

        if (!isAdmin)
        {
            query = query.Where(r => r.Status == FinanceReportStatus.Approved);
        }

        var reports = await query.OrderByDescending(r => r.PeriodStart).ToListAsync();
        return Ok(reports);
    }

    public class GenerateReportDto
    {
        public required int Month { get; set; }
        public required int Year { get; set; }
    }

    [HttpPost("reports/generate")]
    [Authorize(Roles = "Admin,Super Admin,admin,super-admin")]
    public async Task<IActionResult> GenerateReport([FromBody] GenerateReportDto dto)
    {
        var startOfTargetMonth = new DateTime(dto.Year, dto.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var endOfTargetMonth = startOfTargetMonth.AddMonths(1).AddTicks(-1);

        var report = await _context.Set<FinanceReport>()
            .FirstOrDefaultAsync(r => r.PeriodStart.Year == dto.Year && r.PeriodStart.Month == dto.Month);

        if (report != null && report.Status == FinanceReportStatus.Approved)
        {
            return BadRequest(new { message = "Cannot regenerate an approved report." });
        }

        if (report == null)
        {
            report = new FinanceReport
            {
                Title = $"Finance Report {startOfTargetMonth:MMMM yyyy}",
                PeriodStart = startOfTargetMonth,
                PeriodEnd = endOfTargetMonth
            };
            _context.Set<FinanceReport>().Add(report);
        }

        // Calculate Opening Balance (Closing Balance of previous month's report)
        var previousMonth = startOfTargetMonth.AddMonths(-1);
        var previousReport = await _context.Set<FinanceReport>()
            .FirstOrDefaultAsync(r => r.PeriodStart.Year == previousMonth.Year && r.PeriodStart.Month == previousMonth.Month);
        
        report.OpeningBalance = previousReport?.ClosingBalance ?? 0;

        // Manual Income and Expense
        var manualTransactions = await _context.Set<FinanceTransaction>()
            .Where(t => t.Date >= startOfTargetMonth && t.Date <= endOfTargetMonth)
            .ToListAsync();

        var manualIncome = manualTransactions.Where(t => t.Type == FinanceTransactionType.Income).Sum(t => t.Amount);
        var manualExpense = manualTransactions.Where(t => t.Type == FinanceTransactionType.Expense).Sum(t => t.Amount);

        // Payment Income
        var paymentIncome = await _context.Set<PaymentRecord>()
            .Where(p => p.Status == PaymentStatus.Approved && (
                (p.PaymentMonth.Year == dto.Year && p.PaymentMonth.Month == dto.Month && p.UpdatedAt <= endOfTargetMonth) ||
                (p.PaymentMonth < startOfTargetMonth && p.UpdatedAt >= startOfTargetMonth && p.UpdatedAt <= endOfTargetMonth)
            ))
            .SumAsync(p => p.Amount);

        report.TotalIncome = manualIncome + paymentIncome;
        report.TotalExpense = manualExpense;
        report.ClosingBalance = report.OpeningBalance + report.TotalIncome - report.TotalExpense;
        report.Status = FinanceReportStatus.Draft;
        report.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(report);
    }

    [HttpPatch("reports/{id}/submit")]
    [Authorize(Roles = "Admin,Super Admin,admin,super-admin")]
    public async Task<IActionResult> SubmitReport(Guid id)
    {
        var report = await _context.Set<FinanceReport>().FindAsync(id);
        if (report == null) return NotFound();

        if (report.Status != FinanceReportStatus.Draft && report.Status != FinanceReportStatus.Rejected)
            return BadRequest(new { message = "Only draft or rejected reports can be submitted." });

        report.Status = FinanceReportStatus.Pending;
        report.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(report);
    }

    [RequirePermission("finance.approve")]
    [HttpPatch("reports/{id}/approve")]
    [Authorize(Roles = "Admin,Super Admin,admin,super-admin")]
    public async Task<IActionResult> ApproveReport(Guid id)
    {
        var report = await _context.Set<FinanceReport>().FindAsync(id);
        if (report == null) return NotFound();

        if (report.Status != FinanceReportStatus.Pending)
            return BadRequest(new { message = "Only pending reports can be approved." });

        report.Status = FinanceReportStatus.Approved;
        report.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(report);
    }

    public class RejectReportDto { public string Reason { get; set; } = string.Empty; }

    [RequirePermission("finance.approve")]
    [HttpPatch("reports/{id}/reject")]
    [Authorize(Roles = "Admin,Super Admin,admin,super-admin")]
    public async Task<IActionResult> RejectReport(Guid id, [FromBody] RejectReportDto dto)
    {
        var report = await _context.Set<FinanceReport>().FindAsync(id);
        if (report == null) return NotFound();

        if (report.Status != FinanceReportStatus.Pending)
            return BadRequest(new { message = "Only pending reports can be rejected." });

        report.Status = FinanceReportStatus.Rejected;
        report.RejectedReason = dto.Reason;
        report.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(report);
    }

    [HttpDelete("reports/{id}")]
    [Authorize(Roles = "Admin,Super Admin,admin,super-admin")]
    public async Task<IActionResult> DeleteReport(Guid id)
    {
        var report = await _context.Set<FinanceReport>().FindAsync(id);
        if (report == null) return NotFound();

        if (report.Status != FinanceReportStatus.Draft && report.Status != FinanceReportStatus.Rejected)
            return BadRequest(new { message = "Only draft or rejected reports can be deleted." });

        _context.Set<FinanceReport>().Remove(report);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    public class UpdateOpeningBalanceDto { public decimal OpeningBalance { get; set; } }

    [HttpPatch("reports/{id}/opening-balance")]
    [Authorize(Roles = "Admin,Super Admin,admin,super-admin")]
    public async Task<IActionResult> UpdateOpeningBalance(Guid id, [FromBody] UpdateOpeningBalanceDto dto)
    {
        var report = await _context.Set<FinanceReport>().FindAsync(id);
        if (report == null) return NotFound();

        if (report.Status == FinanceReportStatus.Approved)
            return BadRequest(new { message = "Cannot edit opening balance of an approved report." });

        report.OpeningBalance = dto.OpeningBalance;
        report.ClosingBalance = report.OpeningBalance + report.TotalIncome - report.TotalExpense;
        report.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(report);
    }
}
