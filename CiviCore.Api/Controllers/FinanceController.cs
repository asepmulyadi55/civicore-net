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
    public async Task<IActionResult> GetTransactions([FromQuery] string? type, [FromQuery] string? category, [FromQuery] int page = 1)
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
    public async Task<IActionResult> GetStats()
    {
        var now = DateTime.UtcNow;
        var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var transactions = await _context.Set<FinanceTransaction>().ToListAsync();

        var totalIncome = transactions.Where(t => t.Type == FinanceTransactionType.Income).Sum(t => t.Amount);
        var totalExpense = transactions.Where(t => t.Type == FinanceTransactionType.Expense).Sum(t => t.Amount);
        var thisMonthIncome = transactions.Where(t => t.Type == FinanceTransactionType.Income && t.Date >= startOfMonth).Sum(t => t.Amount);

        return Ok(new
        {
            total_income = totalIncome,
            total_expense = totalExpense,
            balance = totalIncome - totalExpense,
            this_month_income = thisMonthIncome
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
