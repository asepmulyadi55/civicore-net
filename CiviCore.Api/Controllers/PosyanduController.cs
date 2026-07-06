using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using CiviCore.Infrastructure.Data;
using CiviCore.Domain.Entities;

namespace CiviCore.Api.Controllers;

[ApiController]
[Route("api/posyandu")]
[Authorize]
public class PosyanduController : ControllerBase
{
    private readonly AppDbContext _context;

    public PosyanduController(AppDbContext context)
    {
        _context = context;
    }

    private async Task<int> GetSettingInt(string key, int defaultValue)
    {
        var setting = await _context.Set<Setting>().FirstOrDefaultAsync(s => s.Key == key);
        if (setting != null && int.TryParse(setting.Value, out var val))
            return val;
        return defaultValue;
    }

    [HttpGet]
    public async Task<IActionResult> GetPosyandu(
        [FromQuery] string? search = null,
        [FromQuery] string? category = null,
        [FromQuery] string? gender = null,
        [FromQuery] Guid? block_id = null)
    {
        // 1. Fetch settings
        int babyMax = await GetSettingInt("posyandu_baby_max_months", 12);
        int toddlerMax = await GetSettingInt("posyandu_toddler_max_months", 60);
        int childMax = await GetSettingInt("posyandu_child_max_months", 144);
        int teenMax = await GetSettingInt("posyandu_teen_max_months", 216);
        int adultMax = await GetSettingInt("posyandu_adult_max_months", 720);

        // 2. Fetch residents
        var query = _context.Set<Resident>()
            .Include(r => r.Householder)
                .ThenInclude(h => h.Block)
            .Include(r => r.Householder)
                .ThenInclude(h => h.Unit)
            .AsQueryable();

        if (block_id.HasValue)
        {
            query = query.Where(r => r.Householder.BlockId == block_id.Value);
        }

        if (!string.IsNullOrEmpty(search))
        {
            var term = search.ToLower();
            query = query.Where(r => r.Fullname.ToLower().Contains(term) || (r.Householder != null && r.Householder.Fullname != null && r.Householder.Fullname.ToLower().Contains(term)));
        }

        var allResidents = await query.ToListAsync();

        var today = DateTime.UtcNow.Date;

        var results = allResidents.Select(r => 
        {
            string ageCategory = "unknown";
            string ageLabel = "---";

            if (r.BirthDate.HasValue)
            {
                var dob = r.BirthDate.Value;
                int months = (today.Year - dob.Year) * 12 + today.Month - dob.Month;
                if (today.Day < dob.Day) months--;

                if (months < 0) months = 0;

                int years = months / 12;
                int remMonths = months % 12;
                ageLabel = $"{years}y {remMonths}m";

                if (months <= babyMax) ageCategory = "baby";
                else if (months <= toddlerMax) ageCategory = "toddler";
                else if (months <= childMax) ageCategory = "child";
                else if (months <= teenMax) ageCategory = "teen";
                else if (months <= adultMax) ageCategory = "adult";
                else ageCategory = "elderly";
            }

            return new 
            {
                id = r.Id,
                fullname = r.Fullname,
                gender = r.Gender?.ToLower() ?? "unknown",
                birthDate = r.BirthDate?.ToString("yyyy-MM-dd"),
                ageLabel = ageLabel,
                ageCategory = ageCategory,
                relationship = r.Relationship,
                householderName = r.Householder?.Fullname,
                blockName = r.Householder?.Block?.Name,
                unit = r.Householder?.Unit?.UnitNumber
            };
        }).ToList();

        // Stats before filtering by category and gender
        var stats = new 
        {
            gender = new {
                male = results.Count(x => x.gender == "male"),
                female = results.Count(x => x.gender == "female"),
                unknown = results.Count(x => x.gender != "male" && x.gender != "female"),
                total = results.Count
            },
            categories = new {
                baby = results.Count(x => x.ageCategory == "baby"),
                toddler = results.Count(x => x.ageCategory == "toddler"),
                child = results.Count(x => x.ageCategory == "child"),
                teen = results.Count(x => x.ageCategory == "teen"),
                adult = results.Count(x => x.ageCategory == "adult"),
                elderly = results.Count(x => x.ageCategory == "elderly"),
                unknown = results.Count(x => x.ageCategory == "unknown")
            }
        };

        // Apply filters
        if (!string.IsNullOrEmpty(category) && category != "all")
        {
            results = results.Where(x => x.ageCategory == category).ToList();
        }

        if (!string.IsNullOrEmpty(gender) && gender != "all")
        {
            results = results.Where(x => x.gender == gender).ToList();
        }

        // Sort by fullname
        results = results.OrderBy(x => x.fullname).ToList();

        return Ok(new {
            stats = stats,
            data = results
        });
    }
}
