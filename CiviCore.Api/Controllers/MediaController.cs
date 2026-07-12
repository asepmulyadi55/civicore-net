using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using CiviCore.Api.Services;
using CiviCore.Infrastructure.Data;
using CiviCore.Domain.Entities;
using System.Security.Claims;

namespace CiviCore.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MediaController : ControllerBase
{
    private readonly ILocalStorageService _storageService;
    private readonly IConfiguration _configuration;
    private readonly AppDbContext _context;

    public MediaController(ILocalStorageService storageService, IConfiguration configuration, AppDbContext context)
    {
        _storageService = storageService;
        _configuration = configuration;
        _context = context;
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetAll([FromQuery] string? search)
    {
        var query = _context.MediaFiles.AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            var s = search.ToLower();
            query = query.Where(m => m.FileName.ToLower().Contains(s) || m.FilePath.ToLower().Contains(s));
        }

        var files = await query
            .OrderByDescending(m => m.CreatedAt)
            .Take(500)
            .Select(m => new
            {
                id = m.Id,
                name = m.FileName,
                // Use the correct URL based on storage location
                url = m.IsPrivate
                    ? $"/api/media/path/{m.FilePath}"
                    : $"/public-media/{m.FilePath}",
                file_path = m.FilePath,
                is_private = m.IsPrivate,
                mime_type = m.MimeType,
                size = m.FileSize,
                created_at = m.CreatedAt
            })
            .ToListAsync();

        return Ok(files);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetMedia(Guid id)
    {
        var media = await _context.MediaFiles.FindAsync(id);
        if (media == null) return NotFound();

        var url = $"/api/media/path/{media.FilePath}";
        return Redirect(url);
    }

    [HttpGet("path/{*filePath}")]
    [Authorize]
    public async Task<IActionResult> GetMediaByPath(string filePath)
    {
        if (string.IsNullOrEmpty(filePath)) return BadRequest();
        
        try
        {
            var bytes = await _storageService.DownloadFileAsync(true, filePath);
            
            var ext = System.IO.Path.GetExtension(filePath).ToLowerInvariant();
            var mimeType = ext switch
            {
                ".png" => "image/png",
                ".jpg" => "image/jpeg",
                ".jpeg" => "image/jpeg",
                ".webp" => "image/webp",
                ".gif" => "image/gif",
                ".pdf" => "application/pdf",
                _ => "application/octet-stream"
            };

            Response.Headers.Append("Cache-Control", "private, max-age=3600");
            
            return File(bytes, mimeType);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error proxying image {filePath}: {ex.Message}");
            return NotFound();
        }
    }

    [HttpPost("upload")]
    [Authorize]
    public async Task<IActionResult> UploadMedia(List<IFormFile>? files, IFormFile? file, [FromForm] string? replacePath = null, [FromForm] string? module = null)
    {
        // Support both single file upload and multi-file upload (files[] or file)
        var fileList = new List<IFormFile>();
        if (files != null && files.Any()) fileList.AddRange(files);
        else if (file != null) fileList.Add(file);
        
        if (!fileList.Any()) return BadRequest("No file uploaded");

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var results = new List<object>();

        if (!string.IsNullOrEmpty(replacePath))
        {
            try { await _storageService.RemoveFileAsync(true, replacePath); }
            catch (Exception ex) { Console.WriteLine($"Failed to delete old file: {ex.Message}"); }
        }

        foreach (var f in fileList)
        {
            var extension = System.IO.Path.GetExtension(f.FileName);
            string filePath;
            
            if (!string.IsNullOrEmpty(module))
            {
                var safeModule = string.Join("_", module.Split(Path.GetInvalidFileNameChars())).ToLower();
                filePath = $"{safeModule}/{Guid.NewGuid()}{extension}";
            }
            else
            {
                filePath = $"uploads/{Guid.NewGuid()}{extension}";
            }

            using var stream = f.OpenReadStream();
            await _storageService.UploadFileAsync(true, filePath, stream);

            var mediaFile = new MediaFile
            {
                FileName = f.FileName,
                FilePath = filePath,
                MimeType = f.ContentType ?? "application/octet-stream",
                FileSize = (int)f.Length,
                UserId = userId != null ? Guid.Parse(userId) : Guid.Empty,
                ModelType = "upload",
                ModelId = Guid.Empty,
                IsPrivate = true  // Manual uploads always go to private storage
            };

            _context.MediaFiles.Add(mediaFile);
            await _context.SaveChangesAsync();

            results.Add(new
            {
                id = mediaFile.Id,
                name = mediaFile.FileName,
                url = $"/api/media/path/{filePath}",
                mime_type = mediaFile.MimeType,
                size = mediaFile.FileSize,
                filePath
            });
        }

        return Ok(results.Count == 1 ? results[0] : results);
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteMedia(Guid id)
    {
        var media = await _context.MediaFiles.FindAsync(id);
        if (media == null) return NotFound();

        try
        {
            // Delete from the correct storage location based on IsPrivate flag
            await _storageService.RemoveFileAsync(media.IsPrivate, media.FilePath);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to delete file from storage: {ex.Message}");
        }

        _context.MediaFiles.Remove(media);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private async Task<bool> IsFileInUse(string path)
    {
        // For public images, the path in entities might have /public-media/ prefix,
        // but MediaFile.FilePath does not. So we match against the filename or partial path.
        var filename = System.IO.Path.GetFileName(path);

        if (await _context.Users.AnyAsync(u => u.Avatar != null && u.Avatar.Contains(filename))) return true;
        if (await _context.PaymentRecords.AnyAsync(p => p.ProofPath != null && p.ProofPath.Contains(filename))) return true;
        if (await _context.Householders.AnyAsync(h => h.PhotoPath != null && h.PhotoPath.Contains(filename))) return true;
        if (await _context.Residents.AnyAsync(r => r.PhotoPath != null && r.PhotoPath.Contains(filename))) return true;
        if (await _context.MeetingImages.AnyAsync(m => m.ImagePath != null && m.ImagePath.Contains(filename))) return true;
        
        var properties = await _context.PropertyListings.ToListAsync();
        if (properties.Any(p => p.Images != null && p.Images.Any(i => i.Contains(filename)))) return true;
        
        // Settings (homepage)
        var settings = await _context.Settings.ToListAsync();
        foreach (var s in settings)
        {
            if (s.Value != null && s.Value.Contains(filename)) return true;
        }

        return false;
    }

    /// <summary>
    /// Removes DB records and physical files for media that is no longer in use, 
    /// as well as cleaning up ghost records (404s).
    /// </summary>
    [HttpPost("cleanup-orphans")]
    [Authorize]
    public async Task<IActionResult> CleanupOrphans()
    {
        var allFiles = await _context.MediaFiles.ToListAsync();
        var removed = new List<MediaFile>();

        var privatePath = _configuration["LocalMedia:PrivatePath"]
            ?? System.IO.Path.Combine(System.IO.Directory.GetCurrentDirectory(), "App_Data", "PrivateMedia");
        var publicPath = _configuration["LocalMedia:PublicPath"]
            ?? System.IO.Path.Combine(System.IO.Directory.GetCurrentDirectory(), "wwwroot", "public-media");

        foreach (var file in allFiles)
        {
            string basePath = file.IsPrivate ? privatePath : publicPath;
            var fullPath = System.IO.Path.Combine(basePath, file.FilePath.Replace('/', System.IO.Path.DirectorySeparatorChar));

            bool isGhost = !System.IO.File.Exists(fullPath);
            bool inUse = !isGhost && await IsFileInUse(file.FilePath);

            if (isGhost || !inUse)
            {
                removed.Add(file);
                if (!isGhost)
                {
                    // Also delete the physical file since it's unused
                    try { System.IO.File.Delete(fullPath); } catch { /* Ignored by design */ }
                }
            }
        }

        if (removed.Count > 0)
        {
            _context.MediaFiles.RemoveRange(removed);
            await _context.SaveChangesAsync();
        }

        Console.WriteLine($"[CleanupOrphans] Removed {removed.Count} unused/ghost media file(s).");

        return Ok(new { removed = removed.Count });
    }
}
