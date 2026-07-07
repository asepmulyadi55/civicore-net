using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using CiviCore.Infrastructure.Data;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CiviCore.Domain.Entities;
using System;
using CiviCore.Api.Extensions; // Import extensions
using Microsoft.AspNetCore.Authorization;
using System.Linq;

namespace CiviCore.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Added authorization
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
        var userBlockId = await User.GetBlockIdAsync(_context);
        var cacheKey = userBlockId.HasValue ? $"DashboardStats_{userBlockId.Value}" : "DashboardStats_Global";

        if (!_cache.TryGetValue(cacheKey, out var stats))
        {
            var currentMonthStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            
            var paymentsQuery = _context.Set<PaymentRecord>().AsQueryable();
            var householdersQuery = _context.Set<Householder>().AsQueryable();

            if (userBlockId.HasValue)
            {
                paymentsQuery = paymentsQuery.Where(p => p.BlockId == userBlockId.Value);
                householdersQuery = householdersQuery.Where(h => h.BlockId == userBlockId.Value);
            }

            // 1. This Month's Collections (Approved payments created/approved this month)
            var collections = await paymentsQuery
                .Where(p => p.Status == CiviCore.Domain.Enums.PaymentStatus.Approved && 
                            (p.ApprovedAt >= currentMonthStart || p.CreatedAt >= currentMonthStart))
                .SumAsync(p => p.Amount);

            // 2. Pending Approvals
            var pendingApprovals = await paymentsQuery
                .Where(p => p.Status == CiviCore.Domain.Enums.PaymentStatus.Pending)
                .CountAsync();

            // 3. Active Householders
            var activeHouseholders = await householdersQuery
                .Where(h => h.IsActive)
                .CountAsync();

            // 4. Unpaid Householders
            var paidHouseholdersThisMonth = await paymentsQuery
                .Where(p => p.Status == CiviCore.Domain.Enums.PaymentStatus.Approved && p.PaymentMonth >= currentMonthStart)
                .Select(p => p.HouseholderId)
                .Distinct()
                .CountAsync();
            var unpaidHouseholders = Math.Max(0, activeHouseholders - paidHouseholdersThisMonth);

            // 5. Admin Memo
            var memoSetting = await _context.Set<Setting>().FirstOrDefaultAsync(s => s.Key == "admin_memo");
            var adminMemo = memoSetting?.Value ?? "No memo set. Add one in Settings -> Admin Memo.";

            stats = new 
            { 
                ThisMonthsCollections = collections, 
                PendingApprovals = pendingApprovals, 
                ActiveHouseholders = activeHouseholders,
                UnpaidHouseholders = unpaidHouseholders,
                AdminMemo = adminMemo
            };
            
            _cache.Set(cacheKey, stats, TimeSpan.FromMinutes(5));
        }
        return Ok(stats);
    }
}
