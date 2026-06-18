using Microsoft.AspNetCore.Mvc;
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

    public MediaController(ISupabaseStorageService storageService)
    {
        _storageService = storageService;
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetMedia(Guid id, [FromServices] AppDbContext context)
    {
        var media = await context.Set<MediaFile>().FindAsync(id);
        if (media == null) return NotFound();

        var url = await _storageService.GetSignedUrlAsync("civicore-media", media.FilePath);
        return Redirect(url);
    }
}
