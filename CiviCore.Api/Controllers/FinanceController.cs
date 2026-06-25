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
    public decimal Amount { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
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
            Date = DateTime.Parse(dto.Date).ToUniversalTime()
        };

        _context.Set<FinanceTransaction>().Add(transaction);
        await _context.SaveChangesAsync();

        return Ok(transaction);
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats([FromQuery] int? month, [FromQuery] int? year)
    {
        var targetMonth = month ?? DateTime.UtcNow.Month;
        var targetYear = year ?? DateTime.UtcNow.Year;
        
        var startOfTargetMonth = new DateTime(targetYear, targetMonth, 1, 0, 0, 0, DateTimeKind.Utc);
        var endOfTargetMonth = startOfTargetMonth.AddMonths(1).AddTicks(-1);

        var allTransactions = await _context.Set<FinanceTransaction>().ToListAsync();

        var periodIncome = allTransactions
            .Where(t => t.Type == FinanceTransactionType.Income && t.Date >= startOfTargetMonth && t.Date <= endOfTargetMonth)
            .Sum(t => t.Amount);
            
        var periodExpense = allTransactions
            .Where(t => t.Type == FinanceTransactionType.Expense && t.Date >= startOfTargetMonth && t.Date <= endOfTargetMonth)
            .Sum(t => t.Amount);

        // Calculate 6 months trend
        var trends = new List<object>();
        for (int i = 5; i >= 0; i--)
        {
            var m = startOfTargetMonth.AddMonths(-i);
            var mEnd = m.AddMonths(1).AddTicks(-1);
            var mIncome = allTransactions.Where(t => t.Type == FinanceTransactionType.Income && t.Date >= m && t.Date <= mEnd).Sum(t => t.Amount);
            var mExpense = allTransactions.Where(t => t.Type == FinanceTransactionType.Expense && t.Date >= m && t.Date <= mEnd).Sum(t => t.Amount);
            trends.Add(new { month = m.ToString("MMM"), income = mIncome, expense = mExpense });
        }

        // Mock pending payments and approvals as they don't exist in DB yet
        var pendingPayments = 0;
        var pendingApprovals = new List<object>();

        // Real overall balance
        var totalIncome = allTransactions.Where(t => t.Type == FinanceTransactionType.Income).Sum(t => t.Amount);
        var totalExpense = allTransactions.Where(t => t.Type == FinanceTransactionType.Expense).Sum(t => t.Amount);

        return Ok(new
        {
            balance = totalIncome - totalExpense,
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
        var reports = await _context.Set<FinanceReport>().ToListAsync();
        return Ok(reports);
    }
}
