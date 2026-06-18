using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using CiviCore.Infrastructure.Data;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CiviCore.Domain.Entities;
using System;

namespace CiviCore.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IMemoryCache _cache;

    public DashboardController(AppDbContext context, IMemoryCache cache)
    {
        _context = context;
        _cache = cache;
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        if (!_cache.TryGetValue("DashboardStats", out var stats))
        {
            var householders = await _context.Set<Householder>().CountAsync();
            var payments = await _context.Set<PaymentRecord>().CountAsync();

            stats = new { TotalHouseholders = householders, TotalPayments = payments };
            _cache.Set("DashboardStats", stats, TimeSpan.FromMinutes(5));
        }
        return Ok(stats);
    }
}
