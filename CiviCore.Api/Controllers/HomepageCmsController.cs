using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CiviCore.Infrastructure.Data;
using CiviCore.Domain.Entities;
using Microsoft.AspNetCore.Authorization;

namespace CiviCore.Api.Controllers;

[ApiController]
[Route("api/homepage")]
[Authorize]
public class HomepageCmsController : ControllerBase
{
    private readonly AppDbContext _context;

    // Keys that make up the homepage content
    private static readonly string[] HomepageKeys = new[]
    {
        "hero_title", "hero_subtitle", "hero_cta_label",
        "about_title", "about_body",
        "contact_phone", "contact_email", "contact_address"
    };

    public HomepageCmsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("content")]
    public async Task<IActionResult> GetContent()
    {
        var settings = await _context.Settings
            .Where(s => HomepageKeys.Contains(s.Key))
            .ToListAsync();

        var result = new Dictionary<string, string?>();
        foreach (var key in HomepageKeys)
        {
            var setting = settings.FirstOrDefault(s => s.Key == key);
            result[key] = setting?.Value;
        }

        return Ok(result);
    }

    [HttpPut("content")]
    public async Task<IActionResult> UpdateContent([FromBody] Dictionary<string, string?> content)
    {
        var existingSettings = await _context.Settings
            .Where(s => HomepageKeys.Contains(s.Key))
            .ToListAsync();

        foreach (var kvp in content)
        {
            if (!HomepageKeys.Contains(kvp.Key)) continue;

            var existing = existingSettings.FirstOrDefault(s => s.Key == kvp.Key);
            if (existing != null)
            {
                existing.Value = kvp.Value;
                existing.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                _context.Settings.Add(new Setting
                {
                    Key = kvp.Key,
                    Value = kvp.Value
                });
            }
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Homepage content saved successfully." });
    }
}
