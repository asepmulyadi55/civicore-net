using CiviCore.Api.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CiviCore.Infrastructure.Data;
using CiviCore.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace CiviCore.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[RequirePermissionModule("payments")]
public class FeeHistoryController : ControllerBase
{
    private readonly AppDbContext _context;

    public FeeHistoryController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("{householderId}/{year}/{month}")]
    public async Task<IActionResult> GetFeeForMonth(Guid householderId, int year, int month)
    {
        var targetDate = new DateTime(year, month, 1);
        var fee = await _context.Set<FeeHistory>()
            .Where(f => f.HouseholderId == householderId && f.EffectiveFrom <= targetDate)
            .OrderByDescending(f => f.EffectiveFrom)
            .FirstOrDefaultAsync();

        if (fee == null) return Ok(new { amount = 0 });
        return Ok(fee);
    }
}
