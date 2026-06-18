using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CiviCore.Infrastructure.Data;
using CiviCore.Domain.Entities;
using CiviCore.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using CiviCore.Api.Services;

namespace CiviCore.Api.Controllers;

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
    public async Task<IActionResult> GetAll()
    {
        var payments = await _context.Set<PaymentRecord>()
            .Include(p => p.Block)
            .Include(p => p.Householder)
            .ToListAsync();
        return Ok(payments);
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
    public async Task<IActionResult> Create([FromBody] PaymentRecord payment)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user != null) payment.SubmittedById = user.Id;
        
        var isTreasurer = user != null && (await _userManager.IsInRoleAsync(user, "Treasurer") || await _userManager.IsInRoleAsync(user, "Admin"));

        if (isTreasurer)
        {
            payment.Status = PaymentStatus.Approved;
            if (user != null) payment.ApprovedById = user.Id;
            payment.ApprovedAt = DateTime.UtcNow;
        }
        else
        {
            payment.Status = PaymentStatus.Pending;
        }

        var householder = await _context.Set<Householder>().FindAsync(payment.HouseholderId);
        var block = await _context.Set<Block>().FindAsync(payment.BlockId);
        if (householder != null) payment.HouseholderName = householder.Fullname;
        if (block != null) payment.UnitNumber = block.Name; // assuming snapshot
        
        _context.Set<PaymentRecord>().Add(payment);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = payment.Id }, payment);
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
