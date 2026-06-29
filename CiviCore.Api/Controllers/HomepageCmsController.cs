using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CiviCore.Infrastructure.Data;
using CiviCore.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using System.Text.Json;

namespace CiviCore.Api.Controllers;

[ApiController]
[Route("api/homepage")]
[Authorize]
public class HomepageCmsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _env;

    public HomepageCmsController(AppDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private async Task<string?> GetSettingValue(string key)
    {
        var s = await _context.Settings.FirstOrDefaultAsync(s => s.Key == key);
        return s?.Value;
    }

    private async Task SaveSetting(string key, string value)
    {
        var existing = await _context.Settings.FirstOrDefaultAsync(s => s.Key == key);
        if (existing != null)
        {
            existing.Value = value;
            existing.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            _context.Settings.Add(new Setting { Key = key, Value = value });
        }
        await _context.SaveChangesAsync();
    }

    private async Task<string?> SaveUploadedFile(IFormFile file, string subFolder)
    {
        if (file == null || file.Length == 0) return null;

        var uploadsDir = Path.Combine(_env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot"), "uploads", "homepage", subFolder);
        Directory.CreateDirectory(uploadsDir);

        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
        var filePath = Path.Combine(uploadsDir, fileName);

        using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        return $"/uploads/homepage/{subFolder}/{fileName}";
    }

    // ── Hero Section ─────────────────────────────────────────────────────────

    [HttpGet("hero")]
    [AllowAnonymous]
    public async Task<IActionResult> GetHero()
    {
        var json = await GetSettingValue("homepage_hero");
        if (string.IsNullOrEmpty(json)) return Ok(new { });
        return Content(json, "application/json");
    }

    [HttpPut("hero")]
    public async Task<IActionResult> UpdateHero([FromForm] string? title, [FromForm] string? subtitle,
        [FromForm] string? cta_label, IFormFile? background_image)
    {
        var existing = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(
            await GetSettingValue("homepage_hero") ?? "{}") ?? new();

        var data = new Dictionary<string, object?>
        {
            ["title"] = title,
            ["subtitle"] = subtitle,
            ["cta_label"] = cta_label,
        };

        if (background_image != null)
            data["background_image_url"] = await SaveUploadedFile(background_image, "hero");
        else if (existing.TryGetValue("background_image_url", out var img))
            data["background_image_url"] = img.GetString();

        await SaveSetting("homepage_hero", JsonSerializer.Serialize(data));
        return Ok(new { message = "Hero section saved." });
    }

    // ── Events (CRUD) ────────────────────────────────────────────────────────

    [HttpGet("events")]
    [AllowAnonymous]
    public async Task<IActionResult> GetEvents()
    {
        var json = await GetSettingValue("homepage_events");
        if (string.IsNullOrEmpty(json)) return Ok(new List<object>());
        return Content(json, "application/json");
    }

    [HttpPost("events")]
    public async Task<IActionResult> StoreEvent([FromForm] string title, [FromForm] string? description,
        [FromForm] string? date, [FromForm] string? category, [FromForm] string? status, [FromForm] string? url, IFormFile? image_file)
    {
        var events = JsonSerializer.Deserialize<List<Dictionary<string, object?>>>(
            await GetSettingValue("homepage_events") ?? "[]") ?? new();

        string? imageUrl = null;
        if (image_file != null) imageUrl = await SaveUploadedFile(image_file, "events");

        var eventStatus = status;
        if (string.IsNullOrEmpty(eventStatus))
        {
            eventStatus = !string.IsNullOrEmpty(date) && DateTime.TryParse(date, out var d) && d < DateTime.Today ? "past" : "upcoming";
        }

        events.Add(new Dictionary<string, object?>
        {
            ["id"] = Guid.NewGuid().ToString(),
            ["title"] = title,
            ["description"] = description,
            ["date"] = date,
            ["category"] = category,
            ["url"] = url,
            ["image_url"] = imageUrl,
            ["status"] = eventStatus,
        });

        await SaveSetting("homepage_events", JsonSerializer.Serialize(events));
        return Ok(new { message = "Event added." });
    }

    [HttpPut("events/{id}")]
    public async Task<IActionResult> UpdateEvent(string id, [FromForm] string title, [FromForm] string? description,
        [FromForm] string? date, [FromForm] string? category, [FromForm] string? status, [FromForm] string? url, IFormFile? image_file)
    {
        var events = JsonSerializer.Deserialize<List<Dictionary<string, JsonElement>>>(
            await GetSettingValue("homepage_events") ?? "[]") ?? new();

        var found = false;
        for (int i = 0; i < events.Count; i++)
        {
            if (events[i].TryGetValue("id", out var idEl) && idEl.GetString() == id)
            {
                var eventStatus = status;
                if (string.IsNullOrEmpty(eventStatus))
                {
                    eventStatus = !string.IsNullOrEmpty(date) && DateTime.TryParse(date, out var d) && d < DateTime.Today ? "past" : "upcoming";
                }

                var updated = new Dictionary<string, object?>
                {
                    ["id"] = id,
                    ["title"] = title,
                    ["description"] = description,
                    ["date"] = date,
                    ["category"] = category,
                    ["url"] = url,
                    ["status"] = eventStatus,
                };

                if (image_file != null)
                    updated["image_url"] = await SaveUploadedFile(image_file, "events");
                else if (events[i].TryGetValue("image_url", out var img))
                    updated["image_url"] = img.GetString();

                events[i] = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(JsonSerializer.Serialize(updated))!;
                found = true;
                break;
            }
        }

        if (!found) return NotFound(new { message = "Event not found." });

        await SaveSetting("homepage_events", JsonSerializer.Serialize(events));
        return Ok(new { message = "Event updated." });
    }

    [HttpDelete("events/{id}")]
    public async Task<IActionResult> DestroyEvent(string id)
    {
        var events = JsonSerializer.Deserialize<List<Dictionary<string, JsonElement>>>(
            await GetSettingValue("homepage_events") ?? "[]") ?? new();

        events = events.Where(e => !(e.TryGetValue("id", out var idEl) && idEl.GetString() == id)).ToList();

        await SaveSetting("homepage_events", JsonSerializer.Serialize(events));
        return Ok(new { message = "Event removed." });
    }

    // ── Gallery Settings ──────────────────────────────────────────────────────

    [HttpGet("gallery-settings")]
    [AllowAnonymous]
    public async Task<IActionResult> GetGallerySettings()
    {
        var json = await GetSettingValue("homepage_gallery_settings");
        if (string.IsNullOrEmpty(json)) return Ok(new { eyebrow = "Visual Tour", title = "Gallery", subtitle = "", archive_url = "/gallery" });
        return Content(json, "application/json");
    }

    [HttpPut("gallery-settings")]
    public async Task<IActionResult> UpdateGallerySettings([FromForm] string? eyebrow, [FromForm] string? title,
        [FromForm] string? subtitle, [FromForm] string? archive_url)
    {
        var data = new Dictionary<string, object?>
        {
            ["eyebrow"] = eyebrow ?? "Visual Tour",
            ["title"] = title ?? "Gallery",
            ["subtitle"] = subtitle,
            ["archive_url"] = archive_url ?? "/gallery"
        };
        await SaveSetting("homepage_gallery_settings", JsonSerializer.Serialize(data));
        return Ok(new { message = "Gallery settings saved." });
    }

    // ── Gallery Albums (CRUD) ────────────────────────────────────────────────

    [HttpGet("gallery")]
    [AllowAnonymous]
    public async Task<IActionResult> GetGallery()
    {
        var json = await GetSettingValue("homepage_gallery");
        if (string.IsNullOrEmpty(json)) return Ok(new List<object>());
        return Content(json, "application/json");
    }

    [HttpPost("gallery")]
    public async Task<IActionResult> StoreAlbum([FromForm] string title, [FromForm] string? description,
        [FromForm] string? count, IFormFile? image_file)
    {
        var items = JsonSerializer.Deserialize<List<Dictionary<string, object?>>>(
            await GetSettingValue("homepage_gallery") ?? "[]") ?? new();

        string? imageUrl = null;
        if (image_file != null) imageUrl = await SaveUploadedFile(image_file, "gallery");

        items.Add(new Dictionary<string, object?>
        {
            ["id"] = Guid.NewGuid().ToString(),
            ["title"] = title,
            ["description"] = description,
            ["count"] = count,
            ["image_url"] = imageUrl,
        });

        await SaveSetting("homepage_gallery", JsonSerializer.Serialize(items));
        return Ok(new { message = "Album added." });
    }

    [HttpPut("gallery/{id}")]
    public async Task<IActionResult> UpdateAlbum(string id, [FromForm] string title, [FromForm] string? description,
        [FromForm] string? count, IFormFile? image_file)
    {
        var items = JsonSerializer.Deserialize<List<Dictionary<string, JsonElement>>>(
            await GetSettingValue("homepage_gallery") ?? "[]") ?? new();

        var found = false;
        for (int i = 0; i < items.Count; i++)
        {
            if (items[i].TryGetValue("id", out var idEl) && idEl.GetString() == id)
            {
                var updated = new Dictionary<string, object?>
                {
                    ["id"] = id,
                    ["title"] = title,
                    ["description"] = description,
                    ["count"] = count,
                };

                if (image_file != null)
                    updated["image_url"] = await SaveUploadedFile(image_file, "gallery");
                else if (items[i].TryGetValue("image_url", out var img))
                    updated["image_url"] = img.GetString();

                items[i] = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(JsonSerializer.Serialize(updated))!;
                found = true;
                break;
            }
        }

        if (!found) return NotFound(new { message = "Album not found." });

        await SaveSetting("homepage_gallery", JsonSerializer.Serialize(items));
        return Ok(new { message = "Album updated." });
    }

    [HttpDelete("gallery/{id}")]
    public async Task<IActionResult> DestroyAlbum(string id)
    {
        var items = JsonSerializer.Deserialize<List<Dictionary<string, JsonElement>>>(
            await GetSettingValue("homepage_gallery") ?? "[]") ?? new();

        items = items.Where(e => !(e.TryGetValue("id", out var idEl) && idEl.GetString() == id)).ToList();

        await SaveSetting("homepage_gallery", JsonSerializer.Serialize(items));
        return Ok(new { message = "Album removed." });
    }

    // ── Bulletin (CRUD) ──────────────────────────────────────────────────────

    [HttpGet("bulletin")]
    [AllowAnonymous]
    public async Task<IActionResult> GetBulletin()
    {
        var json = await GetSettingValue("homepage_buletin");
        if (string.IsNullOrEmpty(json)) return Ok(new List<object>());
        return Content(json, "application/json");
    }

    [HttpPost("bulletin")]
    public async Task<IActionResult> StoreBulletin([FromForm] string title, [FromForm] string? description,
        [FromForm] string? date, [FromForm] string? category, [FromForm] string? url, IFormFile? image_file)
    {
        var items = JsonSerializer.Deserialize<List<Dictionary<string, object?>>>(
            await GetSettingValue("homepage_buletin") ?? "[]") ?? new();

        string? imageUrl = null;
        if (image_file != null) imageUrl = await SaveUploadedFile(image_file, "bulletin");

        items.Add(new Dictionary<string, object?>
        {
            ["id"] = Guid.NewGuid().ToString(),
            ["title"] = title,
            ["description"] = description,
            ["date"] = date,
            ["category"] = category,
            ["url"] = url,
            ["image_url"] = imageUrl,
        });

        await SaveSetting("homepage_buletin", JsonSerializer.Serialize(items));
        return Ok(new { message = "Bulletin added." });
    }

    [HttpPut("bulletin/{id}")]
    public async Task<IActionResult> UpdateBulletin(string id, [FromForm] string title, [FromForm] string? description,
        [FromForm] string? date, [FromForm] string? category, [FromForm] string? url, IFormFile? image_file)
    {
        var items = JsonSerializer.Deserialize<List<Dictionary<string, JsonElement>>>(
            await GetSettingValue("homepage_buletin") ?? "[]") ?? new();

        var found = false;
        for (int i = 0; i < items.Count; i++)
        {
            if (items[i].TryGetValue("id", out var idEl) && idEl.GetString() == id)
            {
                var updated = new Dictionary<string, object?>
                {
                    ["id"] = id,
                    ["title"] = title,
                    ["description"] = description,
                    ["date"] = date,
                    ["category"] = category,
                    ["url"] = url,
                };

                if (image_file != null)
                    updated["image_url"] = await SaveUploadedFile(image_file, "bulletin");
                else if (items[i].TryGetValue("image_url", out var img))
                    updated["image_url"] = img.GetString();

                items[i] = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(JsonSerializer.Serialize(updated))!;
                found = true;
                break;
            }
        }

        if (!found) return NotFound(new { message = "Bulletin not found." });

        await SaveSetting("homepage_buletin", JsonSerializer.Serialize(items));
        return Ok(new { message = "Bulletin updated." });
    }

    [HttpDelete("bulletin/{id}")]
    public async Task<IActionResult> DestroyBulletin(string id)
    {
        var items = JsonSerializer.Deserialize<List<Dictionary<string, JsonElement>>>(
            await GetSettingValue("homepage_buletin") ?? "[]") ?? new();

        items = items.Where(e => !(e.TryGetValue("id", out var idEl) && idEl.GetString() == id)).ToList();

        await SaveSetting("homepage_buletin", JsonSerializer.Serialize(items));
        return Ok(new { message = "Bulletin removed." });
    }

    // ── Footer ───────────────────────────────────────────────────────────────

    [HttpGet("footer")]
    [AllowAnonymous]
    public async Task<IActionResult> GetFooter()
    {
        var json = await GetSettingValue("homepage_footer");
        if (string.IsNullOrEmpty(json)) return Ok(new { });
        return Content(json, "application/json");
    }

    [HttpPut("footer")]
    public async Task<IActionResult> UpdateFooter([FromBody] JsonElement body)
    {
        await SaveSetting("homepage_footer", body.GetRawText());
        return Ok(new { message = "Footer saved." });
    }

    // ── SEO & Metadata ──────────────────────────────────────────────────────

    [HttpGet("metadata")]
    [AllowAnonymous]
    public async Task<IActionResult> GetMetadata()
    {
        var json = await GetSettingValue("homepage_metadata");
        if (string.IsNullOrEmpty(json)) return Ok(new { });
        return Content(json, "application/json");
    }

    [HttpPut("metadata")]
    public async Task<IActionResult> UpdateMetadata([FromForm] string? page_title, [FromForm] string? meta_description,
        [FromForm] string? meta_keywords, [FromForm] string? og_title, [FromForm] string? og_description,
        IFormFile? og_image)
    {
        var existing = JsonSerializer.Deserialize<Dictionary<string, string?>>(
            await GetSettingValue("homepage_metadata") ?? "{}") ?? new();

        if (page_title != null) existing["page_title"] = page_title;
        if (meta_description != null) existing["meta_description"] = meta_description;
        if (meta_keywords != null) existing["meta_keywords"] = meta_keywords;
        if (og_title != null) existing["og_title"] = og_title;
        if (og_description != null) existing["og_description"] = og_description;

        if (og_image != null)
            existing["og_image"] = await SaveUploadedFile(og_image, "seo");

        await SaveSetting("homepage_metadata", JsonSerializer.Serialize(existing));
        return Ok(new { message = "Metadata saved." });
    }

    // ── Section Labels ───────────────────────────────────────────────────────

    [HttpGet("section-labels")]
    [AllowAnonymous]
    public async Task<IActionResult> GetSectionLabels()
    {
        var json = await GetSettingValue("homepage_section_labels");
        if (string.IsNullOrEmpty(json)) return Ok(new { });
        return Content(json, "application/json");
    }

    [HttpPut("section-labels")]
    public async Task<IActionResult> UpdateSectionLabels([FromBody] JsonElement body)
    {
        var existing = JsonSerializer.Deserialize<Dictionary<string, string>>(
            await GetSettingValue("homepage_section_labels") ?? "{}") ?? new();

        var incoming = JsonSerializer.Deserialize<Dictionary<string, string>>(body.GetRawText()) ?? new();
        foreach (var kvp in incoming)
        {
            existing[kvp.Key] = kvp.Value;
        }

        await SaveSetting("homepage_section_labels", JsonSerializer.Serialize(existing));
        return Ok(new { message = "Section labels saved." });
    }

    // ── Legacy endpoint (keep backward compat) ──────────────────────────────

    [HttpGet("content")]
    [AllowAnonymous]
    public async Task<IActionResult> GetContent()
    {
        var keys = new[] { "hero_title", "hero_subtitle", "hero_cta_label", "about_title", "about_body", "contact_phone", "contact_email", "contact_address" };
        var settings = await _context.Settings.Where(s => keys.Contains(s.Key)).ToListAsync();
        var result = new Dictionary<string, string?>();
        foreach (var key in keys)
        {
            var setting = settings.FirstOrDefault(s => s.Key == key);
            result[key] = setting?.Value;
        }
        return Ok(result);
    }
}
