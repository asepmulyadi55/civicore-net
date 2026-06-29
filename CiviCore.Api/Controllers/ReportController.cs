using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CiviCore.Infrastructure.Data;
using CiviCore.Domain.Entities;
using CiviCore.Domain.Enums;
using Microsoft.AspNetCore.Authorization;

namespace CiviCore.Api.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize]
public class ReportController : ControllerBase
{
    private readonly AppDbContext _context;

    public ReportController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? year,
        [FromQuery] string? block_id,
        [FromQuery] string? search,
        [FromQuery] int page = 1)
    {
        int reportYear = year ?? DateTime.UtcNow.Year;
        int pageSize = 25;

        // Build householder query
        var householderQuery = _context.Set<Householder>()
            .Include(h => h.Block)
            .Include(h => h.Unit)
            .Where(h => h.IsActive);

        if (!string.IsNullOrEmpty(block_id) && Guid.TryParse(block_id, out var blockGuid))
        {
            householderQuery = householderQuery.Where(h => h.BlockId == blockGuid);
        }

        if (!string.IsNullOrEmpty(search))
        {
            var s = search.ToLower();
            householderQuery = householderQuery.Where(h =>
                h.Fullname.ToLower().Contains(s) ||
                (h.Unit != null && h.Unit.UnitNumber != null && h.Unit.UnitNumber.ToLower().Contains(s)));
        }

        var total = await householderQuery.CountAsync();
        var householders = await householderQuery
            .OrderBy(h => h.BlockId)
            .ThenBy(h => h.Unit != null ? h.Unit.UnitNumber : "")
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        // Get payment records for the year
        var householderIds = householders.Select(h => h.Id).ToList();
        var payments = await _context.Set<PaymentRecord>()
            .Where(p => householderIds.Contains(p.HouseholderId) && p.PaymentMonth.Year == reportYear)
            .ToListAsync();

        var months = Enumerable.Range(1, 12).ToList();

        var data = householders.Select(h =>
        {
            var hPayments = payments.Where(p => p.HouseholderId == h.Id).ToList();
            var monthlyStatus = months.Select(m =>
            {
                var monthPayment = hPayments.FirstOrDefault(p => p.PaymentMonth.Month == m);
                return new
                {
                    month = m,
                    status = monthPayment?.Status.ToString().ToLower() ?? "unpaid",
                    amount = monthPayment?.Amount ?? 0
                };
            }).ToList();

            return new
            {
                id = h.Id,
                fullname = h.Fullname,
                block_name = h.Block?.Name ?? "",
                unit_number = h.Unit?.UnitNumber ?? "",
                months = monthlyStatus,
                total_paid = hPayments.Where(p => p.Status == PaymentStatus.Approved).Sum(p => p.Amount),
                total_pending = hPayments.Where(p => p.Status == PaymentStatus.Pending).Sum(p => p.Amount)
            };
        }).ToList();

        return Ok(new
        {
            data,
            meta = new
            {
                current_page = page,
                last_page = (int)Math.Ceiling(total / (double)pageSize),
                from = total == 0 ? 0 : (page - 1) * pageSize + 1,
                to = Math.Min(page * pageSize, total),
                total
            }
        });
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats([FromQuery] int? year, [FromQuery] string? block_id)
    {
        int reportYear = year ?? DateTime.UtcNow.Year;

        var paymentQuery = _context.Set<PaymentRecord>()
            .Where(p => p.PaymentMonth.Year == reportYear);

        if (!string.IsNullOrEmpty(block_id) && Guid.TryParse(block_id, out var blockGuid))
        {
            paymentQuery = paymentQuery.Where(p => p.Householder.BlockId == blockGuid);
        }

        var allPayments = await paymentQuery.ToListAsync();

        var totalCollected = allPayments
            .Where(p => p.Status == PaymentStatus.Approved)
            .Sum(p => p.Amount);

        var totalPending = allPayments
            .Where(p => p.Status == PaymentStatus.Pending)
            .Sum(p => p.Amount);

        var paidCount = allPayments.Count(p => p.Status == PaymentStatus.Approved);
        var totalCount = allPayments.Count;

        var collectionRate = totalCount > 0
            ? Math.Round((decimal)paidCount / totalCount * 100, 1)
            : 0;

        return Ok(new
        {
            total_collected = totalCollected,
            total_pending = totalPending,
            collection_rate = collectionRate
        });
    }
}
