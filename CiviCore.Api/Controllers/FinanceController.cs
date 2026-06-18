using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CiviCore.Infrastructure.Data;
using CiviCore.Domain.Entities;
using CiviCore.Api.Services;
using Microsoft.AspNetCore.Authorization;
using System.Threading.Tasks;

namespace CiviCore.Api.Controllers;

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
    public async Task<IActionResult> GetTransactions()
    {
        var transactions = await _context.Set<FinanceTransaction>().ToListAsync();
        return Ok(transactions);
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
