using CiviCore.Api.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using CiviCore.Domain.Entities;
using CiviCore.Infrastructure.Data;
using CiviCore.Api.Services;

namespace CiviCore.Api.Controllers;

[ApiController]
[Route("api/resident-portal")]
[Authorize]
public class ResidentPortalController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly AppDbContext _context;

    public ResidentPortalController(UserManager<ApplicationUser> userManager, AppDbContext context)
    {
        _userManager = userManager;
        _context = context;
    }

    private async Task<Householder?> GetOwnHouseholderAsync(ApplicationUser user)
    {
        // Primary lookup: By linked UserId
        var householder = await _context.Set<Householder>()
            .Include(h => h.Block)
            .Include(h => h.Unit)
            .Include(h => h.FeeHistories)
            .FirstOrDefaultAsync(h => h.UserId == user.Id);

        // Fallback 1: Email
        if (householder == null && !string.IsNullOrEmpty(user.Email))
        {
            householder = await _context.Set<Householder>()
                .Include(h => h.Block)
                .Include(h => h.Unit)
                .Include(h => h.FeeHistories)
                .FirstOrDefaultAsync(h => h.Email == user.Email);

            if (householder != null)
            {
                householder.UserId = user.Id;
                await _context.SaveChangesAsync();
            }
        }

        // Fallback 2: BlockId & UnitNumber
        if (householder == null && user.BlockId.HasValue && !string.IsNullOrEmpty(user.UnitNumber))
        {
            householder = await _context.Set<Householder>()
                .Include(h => h.Block)
                .Include(h => h.Unit)
                .Include(h => h.FeeHistories)
                .FirstOrDefaultAsync(h => h.BlockId == user.BlockId && h.Unit.UnitNumber == user.UnitNumber);

            if (householder != null)
            {
                householder.UserId = user.Id;
                await _context.SaveChangesAsync();
            }
        }

        return householder;
    }

    [RequirePermission("overview.view")]
    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        var resident = await GetOwnHouseholderAsync(user);
        if (resident == null)
        {
            return Ok(new { hasHousehold = false });
        }

        var currentYear = DateTime.UtcNow.Year;
        var previousYear = currentYear - 1;

        var currentFeeHistory = resident.FeeHistories.OrderByDescending(f => f.EffectiveFrom).FirstOrDefault();
        var currentFee = currentFeeHistory?.Amount ?? 0;

        var currentRecords = await _context.Set<PaymentRecord>()
            .Where(r => r.HouseholderId == resident.Id && r.PaymentMonth.Year == currentYear)
            .OrderBy(r => r.PaymentMonth)
            .ToListAsync();

        var previousRecords = await _context.Set<PaymentRecord>()
            .Where(r => r.HouseholderId == resident.Id && r.PaymentMonth.Year == previousYear)
            .OrderBy(r => r.PaymentMonth)
            .ToListAsync();

        var totalPaidYear = currentRecords.Where(r => r.Status == CiviCore.Domain.Enums.PaymentStatus.Approved).Sum(r => r.Amount);
        var paidMonthsYear = currentRecords.Count(r => r.Status == CiviCore.Domain.Enums.PaymentStatus.Approved);

        return Ok(new
        {
            hasHousehold = true,
            householder = new
            {
                id = resident.Id,
                fullname = resident.Fullname,
                blockName = resident.Block.Name,
                unitNumber = resident.Unit.UnitNumber
            },
            currentFee,
            currentYear,
            previousYear,
            currentRecords = currentRecords.Select(r => new { month = r.PaymentMonth.Month, status = r.Status.ToString(), amount = r.Amount }),
            previousRecords = previousRecords.Select(r => new { month = r.PaymentMonth.Month, status = r.Status.ToString(), amount = r.Amount }),
            totalPaidYear,
            paidMonthsYear
        });
    }

    [RequirePermission("my_household.view")]
    [HttpGet("household")]
    public async Task<IActionResult> GetHousehold()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        var resident = await GetOwnHouseholderAsync(user);
        if (resident == null) return NotFound(new { message = "No household found." });

        // Load residents explicitly if not loaded
        await _context.Entry(resident).Collection(h => h.Residents).LoadAsync();

        return Ok(new
        {
            id = resident.Id,
            fullname = resident.Fullname,
            phone = resident.Phone,
            email = resident.Email,
            familyCardNumber = resident.FamilyCardNumber, // Need encryption logic if required
            notes = resident.Notes,
            photoPath = resident.PhotoPath,
            blockName = resident.Block.Name,
            unitNumber = resident.Unit.UnitNumber,
            blockId = resident.BlockId,
            unitId = resident.UnitId,
            monthlyFee = resident.FeeHistories.OrderByDescending(f => f.EffectiveFrom).FirstOrDefault()?.Amount ?? 0,
            houseStatus = resident.Unit.HouseStatus,
            isActive = resident.IsActive,
            residents = resident.Residents.Select(r => new
            {
                id = r.Id,
                fullname = r.Fullname,
                relationship = r.Relationship,
                gender = r.Gender,
                birthDate = r.BirthDate?.ToString("yyyy-MM-dd"),
                occupation = r.Occupation,
                education = r.Education,
                photoPath = r.PhotoPath
            })
        });
    }

    public class UpdateHouseholdDto
    {
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? Notes { get; set; }
        public string? PhotoPath { get; set; }
    }

    [RequirePermission("my_household.edit")]
    [HttpPut("household")]
    public async Task<IActionResult> UpdateHousehold([FromBody] UpdateHouseholdDto dto)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        var resident = await GetOwnHouseholderAsync(user);
        if (resident == null) return NotFound(new { message = "No household found." });

        resident.Phone = dto.Phone;
        resident.Email = dto.Email;
        resident.Notes = dto.Notes;
        resident.PhotoPath = dto.PhotoPath;

        await _context.SaveChangesAsync();
        return Ok(new { message = "Household updated successfully." });
    }

    public class ResidentDto
    {
        public string Fullname { get; set; } = string.Empty;
        public string Relationship { get; set; } = "other";
        public string? Gender { get; set; }
        public DateTime? BirthDate { get; set; }
        public string? Occupation { get; set; }
        public string? Education { get; set; }
        public string? PhotoPath { get; set; }
    }

    [RequirePermission("my_household.edit")]
    [HttpPost("household/residents")]
    public async Task<IActionResult> AddResident([FromBody] ResidentDto dto)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        var resident = await GetOwnHouseholderAsync(user);
        if (resident == null) return NotFound(new { message = "No household found." });

        var newResident = new Resident
        {
            HouseholderId = resident.Id,
            Fullname = dto.Fullname,
            Relationship = dto.Relationship,
            Gender = dto.Gender,
            BirthDate = dto.BirthDate.HasValue ? DateTime.SpecifyKind(dto.BirthDate.Value, DateTimeKind.Utc) : null,
            Occupation = dto.Occupation,
            Education = dto.Education,
            PhotoPath = dto.PhotoPath
        };

        _context.Set<Resident>().Add(newResident);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Resident added successfully.", id = newResident.Id });
    }

    [RequirePermission("my_household.edit")]
    [HttpPut("household/residents/{id}")]
    public async Task<IActionResult> UpdateResident(Guid id, [FromBody] ResidentDto dto)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        var householder = await GetOwnHouseholderAsync(user);
        if (householder == null) return NotFound();

        var resident = await _context.Set<Resident>().FirstOrDefaultAsync(r => r.Id == id && r.HouseholderId == householder.Id);
        if (resident == null) return NotFound(new { message = "Resident not found in your household." });

        resident.Fullname = dto.Fullname;
        resident.Relationship = dto.Relationship;
        resident.Gender = dto.Gender;
        resident.BirthDate = dto.BirthDate.HasValue ? DateTime.SpecifyKind(dto.BirthDate.Value, DateTimeKind.Utc) : null;
        resident.Occupation = dto.Occupation;
        resident.Education = dto.Education;
        resident.PhotoPath = dto.PhotoPath;

        await _context.SaveChangesAsync();
        return Ok(new { message = "Resident updated successfully." });
    }

    [RequirePermission("my_household.edit")]
    [HttpDelete("household/residents/{id}")]
    public async Task<IActionResult> DeleteResident(Guid id)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        var householder = await GetOwnHouseholderAsync(user);
        if (householder == null) return NotFound();

        var resident = await _context.Set<Resident>().FirstOrDefaultAsync(r => r.Id == id && r.HouseholderId == householder.Id);
        if (resident == null) return NotFound(new { message = "Resident not found in your household." });

        _context.Set<Resident>().Remove(resident);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Resident deleted successfully." });
    }

    [RequirePermission("my_household.edit")]
    [HttpPatch("household/residents/{id}/set-head")]
    public async Task<IActionResult> SetResidentHead(Guid id)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        var householder = await GetOwnHouseholderAsync(user);
        if (householder == null) return NotFound();

        var residents = await _context.Set<Resident>().Where(r => r.HouseholderId == householder.Id).ToListAsync();
        var targetResident = residents.FirstOrDefault(r => r.Id == id);
        if (targetResident == null) return NotFound(new { message = "Resident not found in your household." });

        // Demote existing head if any
        foreach (var r in residents.Where(r => r.Relationship == "head"))
        {
            r.Relationship = "other"; // Default fallback
        }

        targetResident.Relationship = "head";
        await _context.SaveChangesAsync();

        return Ok(new { message = "Head of household updated." });
    }
}
