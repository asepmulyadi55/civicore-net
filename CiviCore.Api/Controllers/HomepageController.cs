using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CiviCore.Infrastructure.Data;
using CiviCore.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.Text.Json;

using CiviCore.Api.Services;

using Microsoft.Extensions.Caching.Distributed;
using Microsoft.AspNetCore.RateLimiting;

namespace CiviCore.Api.Controllers;

[ApiController]
[Route("api/homepage")]
[Authorize]
public class HomepageController : ControllerBase
{
    private const string HeaderXCache = "X-Cache";
    private const string MediaTypeJson = "application/json";
    private const string PropBackgroundImageUrl = "background_image_url";
    private const string KeyHomepageEvents = "homepage_events";
    private const string PropImageUrl = "image_url";
    private const string KeyHomepageGallery = "homepage_gallery";
    private const string PropPhotos = "photos";
    private const string MsgAlbumNotFound = "Album not found.";
    private const string KeyHomepageBuletin = "homepage_buletin";
    private const string KeyHomepageFooter = "homepage_footer";
    private const string MsgCaptchaFailed = "CAPTCHA verification failed. Please try again.";
    private readonly AppDbContext _context;
    private readonly ILocalStorageService _storageService;
    private readonly IDistributedCache _cache;
    private readonly IEmailService _emailService;
    private readonly IRecaptchaService _recaptcha;

    public HomepageController(AppDbContext context, ILocalStorageService storageService, IDistributedCache cache, IEmailService emailService, IRecaptchaService recaptcha)
    {
        _context = context;
        _storageService = storageService;
        _cache = cache;
        _emailService = emailService;
        _recaptcha = recaptcha;
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private async Task<string?> GetSettingValue(string key)
    {
        var cacheKey = $"Setting_{key}";
        var cachedValue = await _cache.GetStringAsync(cacheKey);
        
        if (!string.IsNullOrEmpty(cachedValue))
        {
            if (!Response.Headers.ContainsKey(HeaderXCache))
                Response.Headers.Append(HeaderXCache, "HIT");
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
        if (!Response.Headers.ContainsKey(HeaderXCache))
            Response.Headers.Append(HeaderXCache, "MISS");
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
        return Content(json, MediaTypeJson);
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
            if (existing.TryGetValue(PropBackgroundImageUrl, out var img) && img.ValueKind != JsonValueKind.Null)
            {
                await DeleteUploadedFile(img.GetString());
            }
            data[PropBackgroundImageUrl] = await SaveUploadedFile(background_image, "hero");
        }
        else if (existing.TryGetValue(PropBackgroundImageUrl, out var img))
        {
            data[PropBackgroundImageUrl] = img.GetString();
        }

        await SaveSetting("homepage_hero", JsonSerializer.Serialize(data));
        return Ok(new { message = "Hero section saved." });
    }

    // ── Events (CRUD) ────────────────────────────────────────────────────────

    [HttpGet("events")]
    [AllowAnonymous]
    public async Task<IActionResult> GetEvents()
    {
        var json = await GetSettingValue(KeyHomepageEvents);
        if (string.IsNullOrEmpty(json)) return Ok(new List<object>());
        return Content(json, MediaTypeJson);
    }

    [HttpPost("events")]
    public async Task<IActionResult> StoreEvent([FromForm] string title, [FromForm] string? description,
        [FromForm] string? date, [FromForm] string? location, [FromForm] string? category, [FromForm] string? status, [FromForm] string? url, IFormFile? image_file)
    {
        var events = JsonSerializer.Deserialize<List<Dictionary<string, object?>>>(
            await GetSettingValue(KeyHomepageEvents) ?? "[]") ?? new();

        string? imageUrl = null;
        if (image_file != null) imageUrl = await SaveUploadedFile(image_file, "events");

        var eventStatus = status;
        if (string.IsNullOrEmpty(eventStatus))
        {
            eventStatus = !string.IsNullOrEmpty(date) && DateTime.TryParse(date, System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None, out var d) && d < DateTime.Today ? "past" : "upcoming";
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
            [PropImageUrl] = imageUrl,
            ["status"] = eventStatus,
        });

        await SaveSetting(KeyHomepageEvents, JsonSerializer.Serialize(events));
        return Ok(new { message = "Event added." });
    }

    [HttpPut("events/{id}")]
    public async Task<IActionResult> UpdateEvent(string id, [FromForm] string title, [FromForm] string? description,
        [FromForm] string? date, [FromForm] string? location, [FromForm] string? category, [FromForm] string? status, [FromForm] string? url, IFormFile? image_file)
    {
        var events = JsonSerializer.Deserialize<List<Dictionary<string, JsonElement>>>(
            await GetSettingValue(KeyHomepageEvents) ?? "[]") ?? new();

        var found = false;
        for (int i = 0; i < events.Count; i++)
        {
            if (events[i].TryGetValue("id", out var idEl) && idEl.GetString() == id)
            {
                var eventStatus = status;
                if (string.IsNullOrEmpty(eventStatus))
                {
                    eventStatus = !string.IsNullOrEmpty(date) && DateTime.TryParse(date, System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None, out var d) && d < DateTime.Today ? "past" : "upcoming";
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
                    if (events[i].TryGetValue(PropImageUrl, out var imgEl) && imgEl.ValueKind != JsonValueKind.Null)
                    {
                        await DeleteUploadedFile(imgEl.GetString());
                    }
                    updated[PropImageUrl] = await SaveUploadedFile(image_file, "events");
                }
                else if (events[i].TryGetValue(PropImageUrl, out var img))
                {
                    updated[PropImageUrl] = img.GetString();
                }

                events[i] = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(JsonSerializer.Serialize(updated))!;
                found = true;
                break;
            }
        }

        if (!found) return NotFound(new { message = "Event not found." });

        await SaveSetting(KeyHomepageEvents, JsonSerializer.Serialize(events));
        return Ok(new { message = "Event updated." });
    }

    [HttpDelete("events/{id}")]
    public async Task<IActionResult> DestroyEvent(string id)
    {
        var events = JsonSerializer.Deserialize<List<Dictionary<string, JsonElement>>>(
            await GetSettingValue(KeyHomepageEvents) ?? "[]") ?? new();

        var eventToRemove = events.FirstOrDefault(e => e.TryGetValue("id", out var idEl) && idEl.GetString() == id);
        if (eventToRemove != null && eventToRemove.TryGetValue(PropImageUrl, out var imgEl) && imgEl.ValueKind != JsonValueKind.Null)
        {
            await DeleteUploadedFile(imgEl.GetString());
        }

        events = events.Where(e => !(e.TryGetValue("id", out var idEl) && idEl.GetString() == id)).ToList();

        await SaveSetting(KeyHomepageEvents, JsonSerializer.Serialize(events));
        return Ok(new { message = "Event removed." });
    }

    // ── Event Settings ────────────────────────────────────────────────────────

    [HttpGet("event-settings")]
    [AllowAnonymous]
    public async Task<IActionResult> GetEventSettings()
    {
        var json = await GetSettingValue("homepage_event_settings");
        if (string.IsNullOrEmpty(json)) return Ok(new { eyebrow = "Discover More", title = "Events", subtitle = "" });
        return Content(json, MediaTypeJson);
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
        return Content(json, MediaTypeJson);
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
        var json = await GetSettingValue(KeyHomepageGallery);
        if (string.IsNullOrEmpty(json)) return Ok(new List<object>());
        return Content(json, MediaTypeJson);
    }

    [HttpPost("gallery")]
    public async Task<IActionResult> StoreAlbum([FromForm] string title, [FromForm] string? description, IFormFile? image_file)
    {
        var items = JsonSerializer.Deserialize<List<Dictionary<string, object?>>>(
            await GetSettingValue(KeyHomepageGallery) ?? "[]") ?? new();

        string? imageUrl = null;
        if (image_file != null) imageUrl = await SaveUploadedFile(image_file, "gallery");

        items.Add(new Dictionary<string, object?>
        {
            ["id"] = Guid.NewGuid().ToString(),
            ["title"] = title,
            ["description"] = description,
            [PropImageUrl] = imageUrl,
            [PropPhotos] = new List<object>(),
        });

        await SaveSetting(KeyHomepageGallery, JsonSerializer.Serialize(items));
        return Ok(new { message = "Album added." });
    }

    [HttpPut("gallery/{id}")]
    public async Task<IActionResult> UpdateAlbum(string id, [FromForm] string title, [FromForm] string? description, IFormFile? image_file)
    {
        var items = JsonSerializer.Deserialize<List<Dictionary<string, JsonElement>>>(
            await GetSettingValue(KeyHomepageGallery) ?? "[]") ?? new();

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

                if (items[i].TryGetValue(PropPhotos, out var photosEl))
                {
                    updated[PropPhotos] = photosEl;
                }
                else
                {
                    updated[PropPhotos] = new List<object>();
                }

                if (image_file != null)
                {
                    if (items[i].TryGetValue(PropImageUrl, out var imgEl) && imgEl.ValueKind != JsonValueKind.Null)
                    {
                        await DeleteUploadedFile(imgEl.GetString());
                    }
                    updated[PropImageUrl] = await SaveUploadedFile(image_file, "gallery");
                }
                else if (items[i].TryGetValue(PropImageUrl, out var img))
                {
                    updated[PropImageUrl] = img.GetString();
                }

                items[i] = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(JsonSerializer.Serialize(updated))!;
                found = true;
                break;
            }
        }

        if (!found) return NotFound(new { message = MsgAlbumNotFound });

        await SaveSetting(KeyHomepageGallery, JsonSerializer.Serialize(items));
        return Ok(new { message = "Album updated." });
    }

    [HttpDelete("gallery/{id}")]
    public async Task<IActionResult> DestroyAlbum(string id)
    {
        var items = JsonSerializer.Deserialize<List<Dictionary<string, JsonElement>>>(
            await GetSettingValue(KeyHomepageGallery) ?? "[]") ?? new();

        var albumToRemove = items.FirstOrDefault(e => e.TryGetValue("id", out var idEl) && idEl.GetString() == id);
        if (albumToRemove != null)
        {
            if (albumToRemove.TryGetValue(PropImageUrl, out var imgEl) && imgEl.ValueKind != JsonValueKind.Null)
            {
                await DeleteUploadedFile(imgEl.GetString());
            }
            if (albumToRemove.TryGetValue(PropPhotos, out var photosEl) && photosEl.ValueKind == JsonValueKind.Array)
            {
                var photosList = JsonSerializer.Deserialize<List<Dictionary<string, JsonElement>>>(photosEl.GetRawText());
                if (photosList != null)
                {
                    foreach (var photo in photosList)
                    {
                        if (photo.TryGetValue(PropImageUrl, out var pImgEl) && pImgEl.ValueKind != JsonValueKind.Null)
                        {
                            await DeleteUploadedFile(pImgEl.GetString());
                        }
                    }
                }
            }
        }

        items = items.Where(e => !(e.TryGetValue("id", out var idEl) && idEl.GetString() == id)).ToList();

        await SaveSetting(KeyHomepageGallery, JsonSerializer.Serialize(items));
        return Ok(new { message = "Album removed." });
    }

    [HttpGet("gallery/{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAlbum(string id)
    {
        var items = JsonSerializer.Deserialize<List<Dictionary<string, JsonElement>>>(
            await GetSettingValue(KeyHomepageGallery) ?? "[]") ?? new();

        var album = items.FirstOrDefault(a => a.TryGetValue("id", out var idEl) && idEl.GetString() == id || 
                                              a.TryGetValue("title", out var titleEl) && titleEl.GetString()?.ToLower().Replace(" ", "-") == id);

        if (album == null) return NotFound(new { message = MsgAlbumNotFound });
        return Ok(album);
    }

    [HttpPost("gallery/{id}/photos")]
    public async Task<IActionResult> StorePhoto(string id, [FromForm] string? title, [FromForm] string? description, IFormFile image_file)
    {
        if (image_file == null) return BadRequest(new { message = "Image file is required." });

        var items = JsonSerializer.Deserialize<List<Dictionary<string, JsonElement>>>(
            await GetSettingValue(KeyHomepageGallery) ?? "[]") ?? new();

        var found = false;
        for (int i = 0; i < items.Count; i++)
        {
            if (items[i].TryGetValue("id", out var idEl) && idEl.GetString() == id)
            {
                var albumDict = JsonSerializer.Deserialize<Dictionary<string, object>>(JsonSerializer.Serialize(items[i]))!;
                var photosList = new List<object>();

                if (items[i].TryGetValue(PropPhotos, out var photosEl) && photosEl.ValueKind == JsonValueKind.Array)
                {
                    photosList = JsonSerializer.Deserialize<List<object>>(photosEl.GetRawText()) ?? new List<object>();
                }

                var imageUrl = await SaveUploadedFile(image_file, "gallery_photos");
                photosList.Add(new Dictionary<string, object?>
                {
                    ["id"] = Guid.NewGuid().ToString(),
                    ["title"] = title,
                    ["description"] = description,
                    [PropImageUrl] = imageUrl,
                    ["created_at"] = DateTime.UtcNow.ToString("O")
                });

                albumDict[PropPhotos] = photosList;
                items[i] = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(JsonSerializer.Serialize(albumDict))!;
                found = true;
                break;
            }
        }

        if (!found) return NotFound(new { message = MsgAlbumNotFound });

        await SaveSetting(KeyHomepageGallery, JsonSerializer.Serialize(items));
        return Ok(new { message = "Photo added." });
    }

    [HttpDelete("gallery/{id}/photos/{photoId}")]
    public async Task<IActionResult> DestroyPhoto(string id, string photoId)
    {
        var items = JsonSerializer.Deserialize<List<Dictionary<string, JsonElement>>>(
            await GetSettingValue(KeyHomepageGallery) ?? "[]") ?? new();

        var found = false;
        for (int i = 0; i < items.Count; i++)
        {
            if (items[i].TryGetValue("id", out var idEl) && idEl.GetString() == id)
            {
                var albumDict = JsonSerializer.Deserialize<Dictionary<string, object>>(JsonSerializer.Serialize(items[i]))!;
                
                if (items[i].TryGetValue(PropPhotos, out var photosEl) && photosEl.ValueKind == JsonValueKind.Array)
                {
                    var photosList = JsonSerializer.Deserialize<List<Dictionary<string, JsonElement>>>(photosEl.GetRawText()) ?? new();
                    var photoToRemove = photosList.FirstOrDefault(p => p.TryGetValue("id", out var pId) && pId.GetString() == photoId);
                    if (photoToRemove != null && photoToRemove.TryGetValue(PropImageUrl, out var pImg) && pImg.ValueKind != JsonValueKind.Null)
                    {
                        await DeleteUploadedFile(pImg.GetString());
                    }
                    var updatedPhotosList = photosList.Where(p => !(p.TryGetValue("id", out var pId) && pId.GetString() == photoId)).ToList();
                    albumDict[PropPhotos] = updatedPhotosList;
                }

                items[i] = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(JsonSerializer.Serialize(albumDict))!;
                found = true;
                break;
            }
        }

        if (!found) return NotFound(new { message = MsgAlbumNotFound });

        await SaveSetting(KeyHomepageGallery, JsonSerializer.Serialize(items));
        return Ok(new { message = "Photo removed." });
    }

    // ── Bulletin Settings ────────────────────────────────────────────────────

    [HttpGet("bulletin-settings")]
    [AllowAnonymous]
    public async Task<IActionResult> GetBulletinSettings()
    {
        var json = await GetSettingValue("homepage_bulletin_settings");
        if (string.IsNullOrEmpty(json)) return Ok(new { });
        return Content(json, MediaTypeJson);
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
        var json = await GetSettingValue(KeyHomepageBuletin);
        if (string.IsNullOrEmpty(json)) return Ok(new List<object>());

        var items = JsonSerializer.Deserialize<List<Dictionary<string, JsonElement>>>(json) ?? new();
        var sorted = items.OrderByDescending(i =>
        {
            if (i.TryGetValue("date", out var d) && d.ValueKind == JsonValueKind.String)
            {
                if (DateTime.TryParse(d.GetString(), System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None, out var dateVal)) return dateVal;
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
            await GetSettingValue(KeyHomepageBuletin) ?? "[]") ?? new();

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
            [PropImageUrl] = imageUrl,
        });

        await SaveSetting(KeyHomepageBuletin, JsonSerializer.Serialize(items));
        return Ok(new { message = "Bulletin added." });
    }

    [HttpPut("bulletin/{id}")]
    public async Task<IActionResult> UpdateBulletin(string id, [FromForm] string title, [FromForm] string? description,
        [FromForm] string? date, [FromForm] string? category, [FromForm] string? url, IFormFile? image_file)
    {
        var items = JsonSerializer.Deserialize<List<Dictionary<string, JsonElement>>>(
            await GetSettingValue(KeyHomepageBuletin) ?? "[]") ?? new();

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
                    if (items[i].TryGetValue(PropImageUrl, out var imgEl) && imgEl.ValueKind != JsonValueKind.Null)
                    {
                        await DeleteUploadedFile(imgEl.GetString());
                    }
                    updated[PropImageUrl] = await SaveUploadedFile(image_file, "bulletin");
                }
                else if (items[i].TryGetValue(PropImageUrl, out var img))
                {
                    updated[PropImageUrl] = img.GetString();
                }

                items[i] = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(JsonSerializer.Serialize(updated))!;
                found = true;
                break;
            }
        }

        if (!found) return NotFound(new { message = "Bulletin not found." });

        await SaveSetting(KeyHomepageBuletin, JsonSerializer.Serialize(items));
        return Ok(new { message = "Bulletin updated." });
    }

    [HttpGet("bulletin/{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetBulletinById(string id)
    {
        var items = JsonSerializer.Deserialize<List<Dictionary<string, JsonElement>>>(
            await GetSettingValue(KeyHomepageBuletin) ?? "[]") ?? new();

        var bulletin = items.FirstOrDefault(a => a.TryGetValue("id", out var idEl) && idEl.GetString() == id);
        if (bulletin == null) return NotFound(new { message = "Bulletin not found." });
        
        return Ok(bulletin);
    }

    [HttpDelete("bulletin/{id}")]
    public async Task<IActionResult> DestroyBulletin(string id)
    {
        var items = JsonSerializer.Deserialize<List<Dictionary<string, JsonElement>>>(
            await GetSettingValue(KeyHomepageBuletin) ?? "[]") ?? new();

        var bulletinToRemove = items.FirstOrDefault(e => e.TryGetValue("id", out var idEl) && idEl.GetString() == id);
        if (bulletinToRemove != null && bulletinToRemove.TryGetValue(PropImageUrl, out var imgEl) && imgEl.ValueKind != JsonValueKind.Null)
        {
            await DeleteUploadedFile(imgEl.GetString());
        }

        items = items.Where(e => !(e.TryGetValue("id", out var idEl) && idEl.GetString() == id)).ToList();

        await SaveSetting(KeyHomepageBuletin, JsonSerializer.Serialize(items));
        return Ok(new { message = "Bulletin removed." });
    }

    // ── Footer ───────────────────────────────────────────────────────────────

    [HttpGet("footer")]
    [AllowAnonymous]
    public async Task<IActionResult> GetFooter()
    {
        var json = await GetSettingValue(KeyHomepageFooter);
        if (string.IsNullOrEmpty(json)) return Ok(new { });
        return Content(json, MediaTypeJson);
    }

    [HttpPut("footer")]
    public async Task<IActionResult> UpdateFooter(IFormCollection formData, IFormFile? logo)
    {
        var dict = new Dictionary<string, object>();
        foreach (var key in formData.Keys)
        {
            if (key != "logo")
            {
                dict[key] = formData[key].ToString();
            }
        }

        if (logo != null)
        {
            var oldJson = await GetSettingValue(KeyHomepageFooter);
            if (!string.IsNullOrEmpty(oldJson))
            {
                var oldDict = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(oldJson);
                if (oldDict != null && oldDict.TryGetValue("logo", out var imgEl) && imgEl.ValueKind != JsonValueKind.Null)
                {
                    var oldImgUrl = imgEl.GetString();
                    if (!string.IsNullOrEmpty(oldImgUrl))
                    {
                        await DeleteUploadedFile(oldImgUrl);
                    }
                }
            }
            dict["logo"] = await SaveUploadedFile(logo, "footer");
        }
        else
        {
            var oldJson = await GetSettingValue(KeyHomepageFooter);
            if (!string.IsNullOrEmpty(oldJson))
            {
                var oldDict = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(oldJson);
                if (oldDict != null && oldDict.TryGetValue("logo", out var imgEl) && imgEl.ValueKind != JsonValueKind.Null)
                {
                    dict["logo"] = imgEl.GetString()!;
                }
            }
        }

        var json = JsonSerializer.Serialize(dict);
        await SaveSetting(KeyHomepageFooter, json);
        return Ok(new { message = "Footer saved." });
    }
    // ── Property Settings ─────────────────────────────────────────────────────

    [HttpGet("property-settings")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPropertySettings()
    {
        var json = await GetSettingValue("homepage_property_settings");
        if (string.IsNullOrEmpty(json)) return Ok(new { eyebrow = "Find Your Home", title = "Available Properties", subtitle = "" });
        return Content(json, MediaTypeJson);
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
        return Content(json, MediaTypeJson);
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
        return Content(json, MediaTypeJson);
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

    // ── Global Config (Public) ────────────────────────────────────────────────

    [HttpGet("config")]
    [AllowAnonymous]
    public async Task<IActionResult> GetConfig()
    {
        var gaId = await GetSettingValue("ga_measurement_id");
        return Ok(new { ga_measurement_id = gaId });
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

    // ── Emergency Contacts ─────────────────────────────────────────────────────

    [HttpGet("emergency-contacts")]
    [AllowAnonymous]
    public async Task<IActionResult> GetEmergencyContacts()
    {
        var json = await GetSettingValue("homepage_emergency_contacts");
        if (string.IsNullOrEmpty(json))
        {
            // Default contacts
            var defaults = new[]
            {
                new { label = "Pos Keamanan", phone = "+62 123 4567 890", icon = "local_police" },
                new { label = "Klinik Setempat", phone = "+62 111 2222 333", icon = "local_hospital" },
                new { label = "Pemadam Kebakaran", phone = "113", icon = "local_fire_department" },
                new { label = "Kantor Manajemen", phone = "+62 987 6543 210", icon = "support_agent" },
            };
            return Ok(defaults);
        }
        return Content(json, MediaTypeJson);
    }

    [HttpPut("emergency-contacts")]
    public async Task<IActionResult> UpdateEmergencyContacts([FromBody] JsonElement body)
    {
        await SaveSetting("homepage_emergency_contacts", body.GetRawText());
        return Ok(new { message = "Kontak darurat disimpan." });
    }

    // ── Form Submissions ──────────────────────────────────────────────────────

    private async Task<string> GetReceiverEmail()
    {
        var footerJson = await GetSettingValue(KeyHomepageFooter);
        if (!string.IsNullOrEmpty(footerJson))
        {
            try
            {
                var footer = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(footerJson);
                if (footer != null && footer.TryGetValue("contact_email", out var emailEl) && emailEl.ValueKind == JsonValueKind.String)
                {
                    var email = emailEl.GetString();
                    if (!string.IsNullOrWhiteSpace(email)) return email;
                }
            }
            catch { /* Ignored by design */ }
        }
        return _emailService != null ? (await Task.FromResult("admin@civicore.com")) : "admin@civicore.com";
    }

    private static string BuildEmailHtml(string title, Dictionary<string, string?> fields)
    {
        var rows = string.Join("", fields.Select(f =>
        {
            var valueHtml = System.Web.HttpUtility.HtmlEncode(f.Value ?? "-");
            if (!string.IsNullOrEmpty(f.Value) && f.Value.StartsWith("http") && f.Key.Contains("Foto"))
            {
                valueHtml = $"<a href='{f.Value}' style='color:#064e3b;text-decoration:underline;'>Lihat Foto</a><br/><img src='{f.Value}' style='max-width:100%;max-height:300px;margin-top:10px;border-radius:8px;border:1px solid #e5e7eb;' alt='Lampiran'/>";
            }
            else if (!string.IsNullOrEmpty(f.Value) && f.Value.StartsWith("cid:"))
            {
                valueHtml = $"<img src='{f.Value}' style='max-width:100%;max-height:300px;margin-top:10px;border-radius:8px;border:1px solid #e5e7eb;' alt='Lampiran Foto'/>";
            }
            return "<tr><td style='padding:8px 12px;font-weight:600;background:#f3f4f6;border:1px solid #e5e7eb;white-space:nowrap;vertical-align:top'>" + f.Key + "</td>" +
                   "<td style='padding:8px 12px;border:1px solid #e5e7eb;vertical-align:top'>" + valueHtml + "</td></tr>";
        }));
        return "<html><body style='font-family:sans-serif;color:#111'>" +
               "<h2 style='color:#064e3b'>" + title + "</h2>" +
               "<table style='border-collapse:collapse;width:100%;max-width:600px'>" + rows + "</table>" +
               "<p style='margin-top:24px;color:#6b7280;font-size:13px'>Pesan ini dikirim otomatis dari sistem CiviCore.</p>" +
               "</body></html>";
    }

    [HttpPost("submit/visit")]
    [AllowAnonymous]
    [EnableRateLimiting("AuthLimit")]
    public async Task<IActionResult> SubmitVisit([FromForm] string name, [FromForm] string phone, [FromForm] string email,
        [FromForm] string? property, [FromForm] string? date, [FromForm] string? time, [FromForm] string? notes,
        [FromForm] string? captchaToken)
    {
        if (!string.IsNullOrWhiteSpace(captchaToken) && !await _recaptcha.ValidateAsync(captchaToken, 0.3f))
            return BadRequest(new { message = MsgCaptchaFailed });

        var submission = new CiviCore.Domain.Entities.FormSubmission
        {
            Type = "visit",
            Data = System.Text.Json.JsonSerializer.Serialize(new { name, phone, email, property, date, time, notes }),
        };
        _context.FormSubmissions.Add(submission);
        await _context.SaveChangesAsync();

        try
        {
            var receiver = await GetReceiverEmail();
            var html = BuildEmailHtml("📅 Permintaan Jadwal Kunjungan Baru", new Dictionary<string, string?>
            {
                ["Nama"] = name, ["Telepon"] = phone, ["Email"] = email,
                ["Properti"] = property, ["Tanggal"] = date, ["Waktu"] = time, ["Catatan"] = notes
            });
            await _emailService.SendEmailAsync(receiver, "Permintaan Jadwal Kunjungan Baru", html);
        }
        catch { /* Email failures should not block submission */ }

        return Ok(new { message = "Permintaan kunjungan Anda telah diterima. Kami akan menghubungi Anda segera." });
    }

    [HttpPost("submit/report")]
    [AllowAnonymous]
    [EnableRateLimiting("AuthLimit")]
    public async Task<IActionResult> SubmitReport([FromForm] string? category, [FromForm] string? location,
        [FromForm] string subject, [FromForm] string description, [FromForm] string? reporter_name, [FromForm] string? reporter_phone,
        IFormFile? photo, [FromForm] string? captchaToken)
    {
        if (!string.IsNullOrWhiteSpace(captchaToken) && !await _recaptcha.ValidateAsync(captchaToken, 0.3f))
            return BadRequest(new { message = MsgCaptchaFailed });

        // File validation
        if (photo != null)
        {
            if (photo.Length > 5 * 1024 * 1024)
                return BadRequest(new { message = "File foto terlalu besar. Maksimum 5MB." });

            var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp" };
            if (!allowedTypes.Contains(photo.ContentType.ToLower()))
                return BadRequest(new { message = "Hanya file JPG, PNG, dan WEBP yang diizinkan." });
        }

        string? photoUrl = null;
        byte[]? photoBytes = null;
        string? photoCid = null;
        if (photo != null)
        {
            photoUrl = await SaveUploadedFile(photo, "reports");
            using var ms = new System.IO.MemoryStream();
            await photo.CopyToAsync(ms);
            photoBytes = ms.ToArray();
            photoCid = Guid.NewGuid().ToString();
        }

        var submission = new CiviCore.Domain.Entities.FormSubmission
        {
            Type = "report",
            Data = System.Text.Json.JsonSerializer.Serialize(new { category, location, subject, description, reporter_name, reporter_phone, photo_url = photoUrl }),
        };
        _context.FormSubmissions.Add(submission);
        await _context.SaveChangesAsync();

        try
        {
            var receiver = await GetReceiverEmail();
            var html = BuildEmailHtml("🚨 Laporan Warga Baru", new Dictionary<string, string?>
            {
                ["Kategori"] = category, ["Lokasi"] = location, ["Subjek"] = subject,
                ["Deskripsi"] = description, ["Pelapor"] = reporter_name, ["Telepon"] = reporter_phone,
                ["Foto"] = photoCid != null ? $"cid:{photoCid}" : null
            });
            await _emailService.SendEmailAsync(receiver, $"Laporan Warga Baru: {subject}", html, photoBytes, photoCid);
        }
        catch { /* Ignored by design */ }

        return Ok(new { message = "Laporan Anda telah berhasil dikirim. Terima kasih telah membantu menjaga komunitas kita." });
    }

    [HttpPost("submit/rsvp")]
    [AllowAnonymous]
    [EnableRateLimiting("AuthLimit")]
    public async Task<IActionResult> SubmitRsvp([FromForm] string name, [FromForm] string unit,
        [FromForm] string? guests, [FromForm] string? event_id, [FromForm] string? event_title,
        [FromForm] string? captchaToken)
    {
        if (!string.IsNullOrWhiteSpace(captchaToken) && !await _recaptcha.ValidateAsync(captchaToken, 0.3f))
            return BadRequest(new { message = MsgCaptchaFailed });
        var submission = new CiviCore.Domain.Entities.FormSubmission
        {
            Type = "rsvp",
            Data = System.Text.Json.JsonSerializer.Serialize(new { name, unit, guests, event_id, event_title }),
        };
        _context.FormSubmissions.Add(submission);
        await _context.SaveChangesAsync();

        try
        {
            var receiver = await GetReceiverEmail();
            var html = BuildEmailHtml($"✅ RSVP Acara: {event_title}", new Dictionary<string, string?>
            {
                ["Acara"] = event_title, ["Nama"] = name, ["Nomor Unit"] = unit, ["Jumlah Tamu"] = guests
            });
            await _emailService.SendEmailAsync(receiver, $"RSVP Baru: {event_title}", html);
        }
        catch { /* Ignored by design */ }

        return Ok(new { message = "RSVP Anda telah berhasil dikirim! Kami menantikan kehadiran Anda." });
    }

    [HttpPost("submit/message")]
    [AllowAnonymous]
    [EnableRateLimiting("AuthLimit")]
    public async Task<IActionResult> SubmitMessage([FromForm] string name, [FromForm] string? email, [FromForm] string? phone,
        [FromForm] string message, [FromForm] string? related_to, [FromForm] string? captchaToken)
    {
        if (!string.IsNullOrWhiteSpace(captchaToken) && !await _recaptcha.ValidateAsync(captchaToken, 0.3f))
            return BadRequest(new { message = MsgCaptchaFailed });
        var submission = new CiviCore.Domain.Entities.FormSubmission
        {
            Type = "message",
            Data = System.Text.Json.JsonSerializer.Serialize(new { name, email, phone, message, related_to }),
        };
        _context.FormSubmissions.Add(submission);
        await _context.SaveChangesAsync();

        try
        {
            var receiver = await GetReceiverEmail();
            var html = BuildEmailHtml("💬 Pesan Dukungan Baru", new Dictionary<string, string?>
            {
                ["Nama"] = name, ["Email"] = email, ["Telepon"] = phone, ["Terkait"] = related_to, ["Pesan"] = message
            });
            await _emailService.SendEmailAsync(receiver, "Pesan Dukungan Baru dari Warga", html);
        }
        catch { /* Ignored by design */ }

        return Ok(new { message = "Pesan Anda telah terkirim. Tim kami akan segera merespons." });
    }
}
