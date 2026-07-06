using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CiviCore.Infrastructure.Data;
using CiviCore.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace CiviCore.Api.Controllers;

public class NavigationLinkDto
{
    public string Title { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public bool ShowInNavigation { get; set; } = true;
    public bool ShowInFooter { get; set; } = true;
    public int Order { get; set; } = 0;
}

[ApiController]
[Route("api/navigation")]
[Authorize]
public class NavigationController : ControllerBase
{
    private readonly AppDbContext _context;

    public NavigationController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var links = await _context.NavigationLinks
            .OrderBy(n => n.Order)
            .ToListAsync();
        
        return Ok(new { data = links });
    }

    [HttpGet("public")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublic()
    {
        var links = await _context.NavigationLinks
            .OrderBy(n => n.Order)
            .ToListAsync();
            
        return Ok(new { data = links });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] NavigationLinkDto dto)
    {
        var link = new NavigationLink
        {
            Id = Guid.NewGuid(),
            Title = dto.Title,
            Url = dto.Url,
            ShowInNavigation = dto.ShowInNavigation,
            ShowInFooter = dto.ShowInFooter,
            Order = dto.Order,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.NavigationLinks.Add(link);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Navigation link created successfully", data = link });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] NavigationLinkDto dto)
    {
        var link = await _context.NavigationLinks.FindAsync(id);
        if (link == null)
            return NotFound(new { message = "Navigation link not found" });

        link.Title = dto.Title;
        link.Url = dto.Url;
        link.ShowInNavigation = dto.ShowInNavigation;
        link.ShowInFooter = dto.ShowInFooter;
        link.Order = dto.Order;
        link.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(new { message = "Navigation link updated successfully", data = link });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var link = await _context.NavigationLinks.FindAsync(id);
        if (link == null)
            return NotFound(new { message = "Navigation link not found" });

        _context.NavigationLinks.Remove(link);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Navigation link deleted successfully" });
    }
}
