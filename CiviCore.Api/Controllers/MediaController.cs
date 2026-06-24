using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Configuration;
using CiviCore.Api.Services;
using System.Threading.Tasks;
using System;
using CiviCore.Infrastructure.Data;
using CiviCore.Domain.Entities;

namespace CiviCore.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MediaController : ControllerBase
{
    private readonly ISupabaseStorageService _storageService;
    private readonly IConfiguration _configuration;
    private string PrivateBucket => _configuration["Supabase:PrivateBucket"] ?? "civicore-private";

    public MediaController(ISupabaseStorageService storageService, IConfiguration configuration)
    {
        _storageService = storageService;
        _configuration = configuration;
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetMedia(Guid id, [FromServices] AppDbContext context)
    {
        var media = await context.Set<MediaFile>().FindAsync(id);
        if (media == null) return NotFound();

        var url = await _storageService.GetSignedUrlAsync(PrivateBucket, media.FilePath);
        return Redirect(url);
    }

    [HttpGet("path/{*filePath}")]
    [Authorize]
    public async Task<IActionResult> GetMediaByPath(string filePath)
    {
        if (string.IsNullOrEmpty(filePath)) return BadRequest();
        var url = await _storageService.GetSignedUrlAsync(PrivateBucket, filePath);
        return Redirect(url);
    }

    [HttpPost("upload")]
    [Authorize]
    public async Task<IActionResult> UploadMedia([FromForm] IFormFile file, [FromForm] string? replacePath = null)
    {
        if (file == null || file.Length == 0) return BadRequest("No file uploaded");

        var extension = System.IO.Path.GetExtension(file.FileName);
        var filePath = $"uploads/{Guid.NewGuid()}{extension}";

        if (!string.IsNullOrEmpty(replacePath))
        {
            try
            {
                await _storageService.RemoveFileAsync(PrivateBucket, replacePath);
            }
            catch (Exception ex)
            {
                // If it fails to delete the old one (e.g. not found), we log it but still proceed with the upload.
                Console.WriteLine($"Failed to delete old file: {ex.Message}");
            }
        }

        using var stream = file.OpenReadStream();
        await _storageService.UploadFileAsync(PrivateBucket, filePath, stream);
        
        return Ok(new { filePath });
    }
}
