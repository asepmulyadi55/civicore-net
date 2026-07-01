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
            .Take(100)
            .Select(m => new
            {
                id = m.Id,
                name = m.FileName,
                url = $"/api/media/path/{m.FilePath}",
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
    public async Task<IActionResult> UploadMedia(List<IFormFile>? files, IFormFile? file, [FromForm] string? replacePath = null)
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
            var filePath = $"uploads/{Guid.NewGuid()}{extension}";

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
                ModelId = Guid.Empty
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
            await _storageService.RemoveFileAsync(true, media.FilePath);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to delete file from storage: {ex.Message}");
        }

        _context.MediaFiles.Remove(media);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
