using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CiviCore.Infrastructure.Data;
using CiviCore.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.Text.Json;

using CiviCore.Api.Services;

using Microsoft.Extensions.Caching.Distributed;

namespace CiviCore.Api.Controllers;

[ApiController]
[Route("api/homepage")]
[Authorize]
public class HomepageController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILocalStorageService _storageService;
    private readonly IDistributedCache _cache;

    public HomepageController(AppDbContext context, ILocalStorageService storageService, IDistributedCache cache)
    {
        _context = context;
        _storageService = storageService;
        _cache = cache;
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private async Task<string?> GetSettingValue(string key)
    {
        var cacheKey = $"Setting_{key}";
        var cachedValue = await _cache.GetStringAsync(cacheKey);
        
        if (!string.IsNullOrEmpty(cachedValue))
        {
            return cachedValue;
        }

        var s = await _context.Settings.FirstOrDefaultAsync(s => s.Key == key);
        if (s != null && s.Value != null)
        {
            await _cache.SetStringAsync(cacheKey, s.Value, new DistributedCacheEntryOptions 
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(24) // Cache settings for a long time
            });
        }
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
        
        // Invalidate cache immediately when updated
        await _cache.RemoveAsync($"Setting_{key}");
    }

    private async Task<string?> SaveUploadedFile(IFormFile file, string subFolder)
    {
        if (file == null || file.Length == 0) return null;

        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
        var filePath = $"homepage/{subFolder}/{fileName}";

        using var stream = file.OpenReadStream();
        var url = await _storageService.UploadFileAsync(false, filePath, stream);

        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        
        _context.MediaFiles.Add(new MediaFile
        {
            Id = Guid.NewGuid(),
            FileName = file.FileName,
            FilePath = filePath,
            MimeType = file.ContentType ?? "application/octet-stream",
            FileSize = (int)file.Length,
            UserId = !string.IsNullOrEmpty(userIdString) && Guid.TryParse(userIdString, out var uid) ? uid : Guid.Empty,
            ModelType = $"homepage_{subFolder}",
            ModelId = Guid.Empty,
            IsPrivate = false
        });
        await _context.SaveChangesAsync();

        return url;
    }

    private async Task DeleteUploadedFile(string? url)
    {
        if (string.IsNullOrEmpty(url)) return;
        if (url.StartsWith("/public-media/"))
        {
            var filePath = url.Substring("/public-media/".Length);
            await _storageService.RemoveFileAsync(false, filePath);
            
            var mediaFile = await _context.MediaFiles.FirstOrDefaultAsync(m => m.FilePath == filePath);
            if (mediaFile != null)
            {
                _context.MediaFiles.Remove(mediaFile);
                await _context.SaveChangesAsync();
            }
        }
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
        [FromForm] string? cta_label, [FromForm] string? cta_url, IFormFile? background_image)
    {
        var existing = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(
            await GetSettingValue("homepage_hero") ?? "{}") ?? new();

        var data = new Dictionary<string, object?>
        {
            ["title"] = title,
            ["subtitle"] = subtitle,
            ["cta_label"] = cta_label,
            ["cta_url"] = cta_url,
        };

        if (background_image != null)
        {
            if (existing.TryGetValue("background_image_url", out var img) && img.ValueKind != JsonValueKind.Null)
            {
                await DeleteUploadedFile(img.GetString());
            }
            data["background_image_url"] = await SaveUploadedFile(background_image, "hero");
        }
        else if (existing.TryGetValue("background_image_url", out var img))
        {
            data["background_image_url"] = img.GetString();
        }

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
        [FromForm] string? date, [FromForm] string? location, [FromForm] string? category, [FromForm] string? status, [FromForm] string? url, IFormFile? image_file)
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
            ["location"] = location,
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
        [FromForm] string? date, [FromForm] string? location, [FromForm] string? category, [FromForm] string? status, [FromForm] string? url, IFormFile? image_file)
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
                    ["location"] = location,
                    ["category"] = category,
                    ["url"] = url,
                    ["status"] = eventStatus,
                };

                if (image_file != null)
                {
                    if (events[i].TryGetValue("image_url", out var imgEl) && imgEl.ValueKind != JsonValueKind.Null)
                    {
                        await DeleteUploadedFile(imgEl.GetString());
                    }
                    updated["image_url"] = await SaveUploadedFile(image_file, "events");
                }
                else if (events[i].TryGetValue("image_url", out var img))
                {
                    updated["image_url"] = img.GetString();
                }

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

        var eventToRemove = events.FirstOrDefault(e => e.TryGetValue("id", out var idEl) && idEl.GetString() == id);
        if (eventToRemove != null && eventToRemove.TryGetValue("image_url", out var imgEl) && imgEl.ValueKind != JsonValueKind.Null)
        {
            await DeleteUploadedFile(imgEl.GetString());
        }

        events = events.Where(e => !(e.TryGetValue("id", out var idEl) && idEl.GetString() == id)).ToList();

        await SaveSetting("homepage_events", JsonSerializer.Serialize(events));
        return Ok(new { message = "Event removed." });
    }

    // ── Event Settings ────────────────────────────────────────────────────────

    [HttpGet("event-settings")]
    [AllowAnonymous]
    public async Task<IActionResult> GetEventSettings()
    {
        var json = await GetSettingValue("homepage_event_settings");
        if (string.IsNullOrEmpty(json)) return Ok(new { eyebrow = "Discover More", title = "Events", subtitle = "" });
        return Content(json, "application/json");
    }

    [HttpPut("event-settings")]
    public async Task<IActionResult> UpdateEventSettings([FromForm] string? eyebrow, [FromForm] string? title,
        [FromForm] string? subtitle)
    {
        var data = new Dictionary<string, object?>
        {
            ["eyebrow"] = eyebrow ?? "Discover More",
            ["title"] = title ?? "Events",
            ["subtitle"] = subtitle
        };
        await SaveSetting("homepage_event_settings", JsonSerializer.Serialize(data));
        return Ok(new { message = "Settings updated." });
    }

    // ── Gallery Settings ──────────────────────────────────────────────────────

    [HttpGet("gallery-settings")]
    [AllowAnonymous]
    public async Task<IActionResult> GetGallerySettings()
    {
        var json = await GetSettingValue("homepage_gallery_settings");
        if (string.IsNullOrEmpty(json)) return Ok(new { eyebrow = "Visual Tour", title = "Gallery", subtitle = "" });
        return Content(json, "application/json");
    }

    [HttpPut("gallery-settings")]
    public async Task<IActionResult> UpdateGallerySettings([FromForm] string? eyebrow, [FromForm] string? title,
        [FromForm] string? subtitle)
    {
        var data = new Dictionary<string, object?>
        {
            ["eyebrow"] = eyebrow ?? "Visual Tour",
            ["title"] = title ?? "Gallery",
            ["subtitle"] = subtitle
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
    public async Task<IActionResult> StoreAlbum([FromForm] string title, [FromForm] string? description, IFormFile? image_file)
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
            ["image_url"] = imageUrl,
            ["photos"] = new List<object>(),
        });

        await SaveSetting("homepage_gallery", JsonSerializer.Serialize(items));
        return Ok(new { message = "Album added." });
    }

    [HttpPut("gallery/{id}")]
    public async Task<IActionResult> UpdateAlbum(string id, [FromForm] string title, [FromForm] string? description, IFormFile? image_file)
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
                };

                if (items[i].TryGetValue("photos", out var photosEl))
                {
                    updated["photos"] = photosEl;
                }
                else
                {
                    updated["photos"] = new List<object>();
                }

                if (image_file != null)
                {
                    if (items[i].TryGetValue("image_url", out var imgEl) && imgEl.ValueKind != JsonValueKind.Null)
                    {
                        await DeleteUploadedFile(imgEl.GetString());
                    }
                    updated["image_url"] = await SaveUploadedFile(image_file, "gallery");
                }
                else if (items[i].TryGetValue("image_url", out var img))
                {
                    updated["image_url"] = img.GetString();
                }

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

        var albumToRemove = items.FirstOrDefault(e => e.TryGetValue("id", out var idEl) && idEl.GetString() == id);
        if (albumToRemove != null)
        {
            if (albumToRemove.TryGetValue("image_url", out var imgEl) && imgEl.ValueKind != JsonValueKind.Null)
            {
                await DeleteUploadedFile(imgEl.GetString());
            }
            if (albumToRemove.TryGetValue("photos", out var photosEl) && photosEl.ValueKind == JsonValueKind.Array)
            {
                var photosList = JsonSerializer.Deserialize<List<Dictionary<string, JsonElement>>>(photosEl.GetRawText());
                if (photosList != null)
                {
                    foreach (var photo in photosList)
                    {
                        if (photo.TryGetValue("image_url", out var pImgEl) && pImgEl.ValueKind != JsonValueKind.Null)
                        {
                            await DeleteUploadedFile(pImgEl.GetString());
                        }
                    }
                }
            }
        }

        items = items.Where(e => !(e.TryGetValue("id", out var idEl) && idEl.GetString() == id)).ToList();

        await SaveSetting("homepage_gallery", JsonSerializer.Serialize(items));
        return Ok(new { message = "Album removed." });
    }

    [HttpGet("gallery/{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAlbum(string id)
    {
        var items = JsonSerializer.Deserialize<List<Dictionary<string, JsonElement>>>(
            await GetSettingValue("homepage_gallery") ?? "[]") ?? new();

        var album = items.FirstOrDefault(a => a.TryGetValue("id", out var idEl) && idEl.GetString() == id || 
                                              a.TryGetValue("title", out var titleEl) && titleEl.GetString()?.ToLower().Replace(" ", "-") == id);

        if (album == null) return NotFound(new { message = "Album not found." });
        return Ok(album);
    }

    [HttpPost("gallery/{id}/photos")]
    public async Task<IActionResult> StorePhoto(string id, [FromForm] string? title, [FromForm] string? description, IFormFile image_file)
    {
        if (image_file == null) return BadRequest(new { message = "Image file is required." });

        var items = JsonSerializer.Deserialize<List<Dictionary<string, JsonElement>>>(
            await GetSettingValue("homepage_gallery") ?? "[]") ?? new();

        var found = false;
        for (int i = 0; i < items.Count; i++)
        {
            if (items[i].TryGetValue("id", out var idEl) && idEl.GetString() == id)
            {
                var albumDict = JsonSerializer.Deserialize<Dictionary<string, object>>(JsonSerializer.Serialize(items[i]))!;
                var photosList = new List<object>();

                if (items[i].TryGetValue("photos", out var photosEl) && photosEl.ValueKind == JsonValueKind.Array)
                {
                    photosList = JsonSerializer.Deserialize<List<object>>(photosEl.GetRawText()) ?? new List<object>();
                }

                var imageUrl = await SaveUploadedFile(image_file, "gallery_photos");
                photosList.Add(new Dictionary<string, object?>
                {
                    ["id"] = Guid.NewGuid().ToString(),
                    ["title"] = title,
                    ["description"] = description,
                    ["image_url"] = imageUrl,
                    ["created_at"] = DateTime.UtcNow.ToString("O")
                });

                albumDict["photos"] = photosList;
                items[i] = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(JsonSerializer.Serialize(albumDict))!;
                found = true;
                break;
            }
        }

        if (!found) return NotFound(new { message = "Album not found." });

        await SaveSetting("homepage_gallery", JsonSerializer.Serialize(items));
        return Ok(new { message = "Photo added." });
    }

    [HttpDelete("gallery/{id}/photos/{photoId}")]
    public async Task<IActionResult> DestroyPhoto(string id, string photoId)
    {
        var items = JsonSerializer.Deserialize<List<Dictionary<string, JsonElement>>>(
            await GetSettingValue("homepage_gallery") ?? "[]") ?? new();

        var found = false;
        for (int i = 0; i < items.Count; i++)
        {
            if (items[i].TryGetValue("id", out var idEl) && idEl.GetString() == id)
            {
                var albumDict = JsonSerializer.Deserialize<Dictionary<string, object>>(JsonSerializer.Serialize(items[i]))!;
                
                if (items[i].TryGetValue("photos", out var photosEl) && photosEl.ValueKind == JsonValueKind.Array)
                {
                    var photosList = JsonSerializer.Deserialize<List<Dictionary<string, JsonElement>>>(photosEl.GetRawText()) ?? new();
                    var photoToRemove = photosList.FirstOrDefault(p => p.TryGetValue("id", out var pId) && pId.GetString() == photoId);
                    if (photoToRemove != null && photoToRemove.TryGetValue("image_url", out var pImg) && pImg.ValueKind != JsonValueKind.Null)
                    {
                        await DeleteUploadedFile(pImg.GetString());
                    }
                    var updatedPhotosList = photosList.Where(p => !(p.TryGetValue("id", out var pId) && pId.GetString() == photoId)).ToList();
                    albumDict["photos"] = updatedPhotosList;
                }

                items[i] = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(JsonSerializer.Serialize(albumDict))!;
                found = true;
                break;
            }
        }

        if (!found) return NotFound(new { message = "Album not found." });

        await SaveSetting("homepage_gallery", JsonSerializer.Serialize(items));
        return Ok(new { message = "Photo removed." });
    }

    // ── Bulletin Settings ────────────────────────────────────────────────────

    [HttpGet("bulletin-settings")]
    [AllowAnonymous]
    public async Task<IActionResult> GetBulletinSettings()
    {
        var json = await GetSettingValue("homepage_bulletin_settings");
        if (string.IsNullOrEmpty(json)) return Ok(new { });
        return Content(json, "application/json");
    }

    [HttpPut("bulletin-settings")]
    public async Task<IActionResult> UpdateBulletinSettings([FromForm] string? eyebrow, [FromForm] string? title, [FromForm] string? subtitle)
    {
        var data = new
        {
            eyebrow,
            title,
            subtitle
        };
        await SaveSetting("homepage_bulletin_settings", JsonSerializer.Serialize(data));
        return Ok(new { message = "Settings updated." });
    }

    // ── Bulletin (CRUD) ──────────────────────────────────────────────────────

    [HttpGet("bulletin")]
    [AllowAnonymous]
    public async Task<IActionResult> GetBulletin()
    {
        var json = await GetSettingValue("homepage_buletin");
        if (string.IsNullOrEmpty(json)) return Ok(new List<object>());

        var items = JsonSerializer.Deserialize<List<Dictionary<string, JsonElement>>>(json) ?? new();
        var sorted = items.OrderByDescending(i =>
        {
            if (i.TryGetValue("date", out var d) && d.ValueKind == JsonValueKind.String)
            {
                if (DateTime.TryParse(d.GetString(), out var dateVal)) return dateVal;
            }
            return DateTime.MinValue;
        }).ToList();

        return Ok(sorted);
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
                {
                    if (items[i].TryGetValue("image_url", out var imgEl) && imgEl.ValueKind != JsonValueKind.Null)
                    {
                        await DeleteUploadedFile(imgEl.GetString());
                    }
                    updated["image_url"] = await SaveUploadedFile(image_file, "bulletin");
                }
                else if (items[i].TryGetValue("image_url", out var img))
                {
                    updated["image_url"] = img.GetString();
                }

                items[i] = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(JsonSerializer.Serialize(updated))!;
                found = true;
                break;
            }
        }

        if (!found) return NotFound(new { message = "Bulletin not found." });

        await SaveSetting("homepage_buletin", JsonSerializer.Serialize(items));
        return Ok(new { message = "Bulletin updated." });
    }

    [HttpGet("bulletin/{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetBulletinById(string id)
    {
        var items = JsonSerializer.Deserialize<List<Dictionary<string, JsonElement>>>(
            await GetSettingValue("homepage_buletin") ?? "[]") ?? new();

        var bulletin = items.FirstOrDefault(a => a.TryGetValue("id", out var idEl) && idEl.GetString() == id);
        if (bulletin == null) return NotFound(new { message = "Bulletin not found." });
        
        return Ok(bulletin);
    }

    [HttpDelete("bulletin/{id}")]
    public async Task<IActionResult> DestroyBulletin(string id)
    {
        var items = JsonSerializer.Deserialize<List<Dictionary<string, JsonElement>>>(
            await GetSettingValue("homepage_buletin") ?? "[]") ?? new();

        var bulletinToRemove = items.FirstOrDefault(e => e.TryGetValue("id", out var idEl) && idEl.GetString() == id);
        if (bulletinToRemove != null && bulletinToRemove.TryGetValue("image_url", out var imgEl) && imgEl.ValueKind != JsonValueKind.Null)
        {
            await DeleteUploadedFile(imgEl.GetString());
        }

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
    // ── Property Settings ─────────────────────────────────────────────────────

    [HttpGet("property-settings")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPropertySettings()
    {
        var json = await GetSettingValue("homepage_property_settings");
        if (string.IsNullOrEmpty(json)) return Ok(new { eyebrow = "Find Your Home", title = "Available Properties", subtitle = "" });
        return Content(json, "application/json");
    }

    [HttpPut("property-settings")]
    public async Task<IActionResult> UpdatePropertySettings([FromForm] string? eyebrow, [FromForm] string? title, [FromForm] string? subtitle)
    {
        var data = new Dictionary<string, object?>
        {
            ["eyebrow"] = eyebrow ?? "Find Your Home",
            ["title"] = title ?? "Available Properties",
            ["subtitle"] = subtitle
        };

        await SaveSetting("homepage_property_settings", JsonSerializer.Serialize(data));
        return Ok(new { message = "Property settings saved." });
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
        {
            if (existing.TryGetValue("og_image", out var oldOgImage) && !string.IsNullOrEmpty(oldOgImage))
            {
                await DeleteUploadedFile(oldOgImage);
            }
            existing["og_image"] = await SaveUploadedFile(og_image, "seo");
        }

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
