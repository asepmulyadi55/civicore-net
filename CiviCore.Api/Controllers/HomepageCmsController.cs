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

    // ── Featured Event ───────────────────────────────────────────────────────

    [HttpGet("featured-event")]
    public async Task<IActionResult> GetFeaturedEvent()
    {
        var json = await GetSettingValue("homepage_featured_event");
        if (string.IsNullOrEmpty(json)) return Ok(new { });
        return Content(json, "application/json");
    }

    [HttpPut("featured-event")]
    public async Task<IActionResult> UpdateFeaturedEvent([FromForm] string? type, [FromForm] string? title,
        [FromForm] string? youtube_id, [FromForm] string? date, [FromForm] string? featured_eyebrow,
        IFormFile? image_file, IFormFile? mobile_image_file)
    {
        var existing = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(
            await GetSettingValue("homepage_featured_event") ?? "{}") ?? new();

        var data = new Dictionary<string, object?>
        {
            ["type"] = type ?? "full",
            ["title"] = title,
            ["youtube_id"] = youtube_id,
            ["date"] = date,
        };

        if (image_file != null)
            data["image_url"] = await SaveUploadedFile(image_file, "featured");
        else if (existing.TryGetValue("image_url", out var img))
            data["image_url"] = img.GetString();

        if (mobile_image_file != null)
            data["mobile_image_url"] = await SaveUploadedFile(mobile_image_file, "featured");
        else if (existing.TryGetValue("mobile_image_url", out var mImg))
            data["mobile_image_url"] = mImg.GetString();

        if (type == "simple") { data["youtube_id"] = null; data["date"] = null; }

        await SaveSetting("homepage_featured_event", JsonSerializer.Serialize(data));

        // Save eyebrow label
        if (featured_eyebrow != null)
        {
            var labels = JsonSerializer.Deserialize<Dictionary<string, string>>(
                await GetSettingValue("homepage_section_labels") ?? "{}") ?? new();
            labels["featured_eyebrow"] = featured_eyebrow;
            await SaveSetting("homepage_section_labels", JsonSerializer.Serialize(labels));
        }

        return Ok(new { message = "Featured event saved." });
    }

    // ── Events (CRUD) ────────────────────────────────────────────────────────

    [HttpGet("events")]
    public async Task<IActionResult> GetEvents()
    {
        var json = await GetSettingValue("homepage_events");
        if (string.IsNullOrEmpty(json)) return Ok(new List<object>());
        return Content(json, "application/json");
    }

    [HttpPost("events")]
    public async Task<IActionResult> StoreEvent([FromForm] string title, [FromForm] string? description,
        [FromForm] string? date, [FromForm] string? category, [FromForm] string? url, IFormFile? image_file)
    {
        var events = JsonSerializer.Deserialize<List<Dictionary<string, object?>>>(
            await GetSettingValue("homepage_events") ?? "[]") ?? new();

        string? imageUrl = null;
        if (image_file != null) imageUrl = await SaveUploadedFile(image_file, "events");

        var status = !string.IsNullOrEmpty(date) && DateTime.TryParse(date, out var d) && d < DateTime.Today ? "past" : "upcoming";

        events.Add(new Dictionary<string, object?>
        {
            ["id"] = Guid.NewGuid().ToString(),
            ["title"] = title,
            ["description"] = description,
            ["date"] = date,
            ["category"] = category,
            ["url"] = url,
            ["image_url"] = imageUrl,
            ["status"] = status,
        });

        await SaveSetting("homepage_events", JsonSerializer.Serialize(events));
        return Ok(new { message = "Event added." });
    }

    [HttpPut("events/{id}")]
    public async Task<IActionResult> UpdateEvent(string id, [FromForm] string title, [FromForm] string? description,
        [FromForm] string? date, [FromForm] string? category, [FromForm] string? url, IFormFile? image_file)
    {
        var events = JsonSerializer.Deserialize<List<Dictionary<string, JsonElement>>>(
            await GetSettingValue("homepage_events") ?? "[]") ?? new();

        var found = false;
        for (int i = 0; i < events.Count; i++)
        {
            if (events[i].TryGetValue("id", out var idEl) && idEl.GetString() == id)
            {
                var updated = new Dictionary<string, object?>
                {
                    ["id"] = id,
                    ["title"] = title,
                    ["description"] = description,
                    ["date"] = date,
                    ["category"] = category,
                    ["url"] = url,
                    ["status"] = !string.IsNullOrEmpty(date) && DateTime.TryParse(date, out var d) && d < DateTime.Today ? "past" : "upcoming",
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

    // ── Memorable Moments ────────────────────────────────────────────────────

    [HttpGet("memorable-moments")]
    public async Task<IActionResult> GetMemorableMoments()
    {
        var json = await GetSettingValue("homepage_memorable_moments");
        if (string.IsNullOrEmpty(json)) return Ok(new { });
        return Content(json, "application/json");
    }

    [HttpPut("memorable-moments")]
    public async Task<IActionResult> UpdateMemorableMoments([FromForm] string? eyebrow, [FromForm] string? title,
        [FromForm] string? subtitle, [FromForm] string? archive_url,
        [FromForm] string? caption_0, [FromForm] string? caption_1, [FromForm] string? caption_2, [FromForm] string? caption_3,
        IFormFile? image_0, IFormFile? image_1, IFormFile? image_2, IFormFile? image_3)
    {
        var existing = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(
            await GetSettingValue("homepage_memorable_moments") ?? "{}") ?? new();

        var existingImages = new List<Dictionary<string, string?>>();
        if (existing.TryGetValue("images", out var imgsEl))
        {
            existingImages = JsonSerializer.Deserialize<List<Dictionary<string, string?>>>(imgsEl.GetRawText()) ?? new();
        }
        while (existingImages.Count < 4) existingImages.Add(new Dictionary<string, string?> { ["url"] = null, ["caption"] = null });

        var imageFiles = new IFormFile?[] { image_0, image_1, image_2, image_3 };
        var captions = new string?[] { caption_0, caption_1, caption_2, caption_3 };

        for (int i = 0; i < 4; i++)
        {
            if (imageFiles[i] != null)
                existingImages[i]["url"] = await SaveUploadedFile(imageFiles[i]!, "moments");
            if (captions[i] != null)
                existingImages[i]["caption"] = captions[i];
        }

        var data = new Dictionary<string, object?>
        {
            ["eyebrow"] = eyebrow ?? (existing.TryGetValue("eyebrow", out var ey) ? ey.GetString() : "The Gallery"),
            ["title"] = title,
            ["subtitle"] = subtitle,
            ["archive_url"] = archive_url,
            ["images"] = existingImages,
        };

        await SaveSetting("homepage_memorable_moments", JsonSerializer.Serialize(data));
        return Ok(new { message = "Memorable moments saved." });
    }

    // ── Bulletin (CRUD) ──────────────────────────────────────────────────────

    [HttpGet("bulletin")]
    public async Task<IActionResult> GetBulletin()
    {
        var json = await GetSettingValue("homepage_buletin");
        if (string.IsNullOrEmpty(json)) return Ok(new List<object>());
        return Content(json, "application/json");
    }

    [HttpPost("bulletin")]
    public async Task<IActionResult> StoreBulletin([FromForm] string title, [FromForm] string? description,
        [FromForm] string? date, [FromForm] string? url, IFormFile? image_file)
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
            ["url"] = url,
            ["image_url"] = imageUrl,
        });

        await SaveSetting("homepage_buletin", JsonSerializer.Serialize(items));
        return Ok(new { message = "Bulletin added." });
    }

    [HttpPut("bulletin/{id}")]
    public async Task<IActionResult> UpdateBulletin(string id, [FromForm] string title, [FromForm] string? description,
        [FromForm] string? date, [FromForm] string? url, IFormFile? image_file)
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

    // ── About Section ────────────────────────────────────────────────────────

    [HttpGet("about")]
    public async Task<IActionResult> GetAbout()
    {
        var json = await GetSettingValue("homepage_about");
        if (string.IsNullOrEmpty(json)) return Ok(new { });
        return Content(json, "application/json");
    }

    [HttpPut("about")]
    public async Task<IActionResult> UpdateAbout([FromBody] JsonElement body)
    {
        await SaveSetting("homepage_about", body.GetRawText());
        return Ok(new { message = "About section saved." });
    }

    // ── Footer ───────────────────────────────────────────────────────────────

    [HttpGet("footer")]
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
