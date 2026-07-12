using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using CiviCore.Domain.Entities;
using CiviCore.Infrastructure.Data;
using CiviCore.Api.Services;

namespace CiviCore.Api.Controllers;

[ApiController]
[Route("api/settings")]
[Authorize]
public class SettingsController : ControllerBase
{
    private const string AdminRole = "Admin";
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly AppDbContext _context;
    private readonly IConfiguration _config;
    private readonly ILocalStorageService _storage;

    public SettingsController(UserManager<ApplicationUser> userManager, AppDbContext context, IConfiguration config, ILocalStorageService storage)
    {
        _userManager = userManager;
        _context = context;
        _config = config;
        _storage = storage;
    }

    // ── Profile ───────────────────────────────────────────────────────────

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        var roles = await _userManager.GetRolesAsync(user);

        return Ok(new
        {
            id = user.Id,
            name = user.Name,
            email = user.Email,
            username = user.UserName,
            language = user.Language,
            avatar = user.Avatar,
            googleId = user.GoogleId,
            role = roles.FirstOrDefault() ?? "",
            twoFactorEnabled = !string.IsNullOrEmpty(user.TwoFactorSecretKey),
            twoFactorEnabledAt = user.TwoFactorEnabledAt
        });
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromForm] ProfileUpdateDto dto)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        if (!string.IsNullOrEmpty(dto.Name))
            user.Name = dto.Name;

        if (!string.IsNullOrEmpty(dto.Language) && (dto.Language == "en" || dto.Language == "id"))
            user.Language = dto.Language;

        // Handle avatar upload
        if (dto.Avatar != null && dto.Avatar.Length > 0)
        {
            if (dto.Avatar.Length > 2 * 1024 * 1024) // 2MB max
                return BadRequest(new { message = "Avatar file too large. Max 2MB." });

            var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp" };
            if (!allowedTypes.Contains(dto.Avatar.ContentType))
                return BadRequest(new { message = "Only JPG, PNG and WEBP files are allowed." });

            var oldAvatarPath = user.Avatar;
            if (!string.IsNullOrEmpty(oldAvatarPath) && oldAvatarPath.StartsWith("/api/media/path/"))
            {
                var internalPath = oldAvatarPath.Replace("/api/media/path/", "");
                try { await _storage.RemoveFileAsync(true, internalPath); } catch { /* Ignored by design */ }
            }

            var ext = System.IO.Path.GetExtension(dto.Avatar.FileName);
            var filePath = $"profiles/{Guid.NewGuid()}{ext}";

            using var ms = dto.Avatar.OpenReadStream();
            await _storage.UploadFileAsync(true, filePath, ms);
            
            user.Avatar = $"/api/media/path/{filePath}";
        }

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
            return BadRequest(new { message = "Failed to update profile.", errors = result.Errors });

        return Ok(new { message = "Profile updated successfully." });
    }

    // ── Password ──────────────────────────────────────────────────────────

    [HttpPut("password")]
    public async Task<IActionResult> UpdatePassword([FromBody] PasswordUpdateDto dto)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        // Google OAuth users don't have a known password
        var hasKnownPassword = string.IsNullOrEmpty(user.GoogleId);

        if (hasKnownPassword)
        {
            if (string.IsNullOrEmpty(dto.CurrentPassword))
                return BadRequest(new { message = "Current password is required." });

            var checkResult = await _userManager.CheckPasswordAsync(user, dto.CurrentPassword);
            if (!checkResult)
                return BadRequest(new { message = "The current password is incorrect." });
        }

        if (string.IsNullOrEmpty(dto.Password) || dto.Password.Length < 8)
            return BadRequest(new { message = "New password must be at least 8 characters." });

        if (dto.Password != dto.PasswordConfirmation)
            return BadRequest(new { message = "Password confirmation does not match." });

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var resetResult = await _userManager.ResetPasswordAsync(user, token, dto.Password);

        if (!resetResult.Succeeded)
            return BadRequest(new { message = "Failed to change password.", errors = resetResult.Errors });

        return Ok(new { message = "Password changed successfully." });
    }

    // ── Security (admin only) ─────────────────────────────────────────────

    [HttpGet("security")]
    public async Task<IActionResult> GetSecurity()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        var timeout = await GetSettingValue("session_timeout_minutes", "30");
        var gaId = await GetSettingValue("ga_measurement_id", "");

        return Ok(new
        {
            session_timeout_minutes = int.TryParse(timeout, out var t) ? t : 30,
            ga_measurement_id = gaId
        });
    }

    [HttpPut("security")]
    public async Task<IActionResult> UpdateSecurity([FromBody] SecurityUpdateDto dto)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        var roles = await _userManager.GetRolesAsync(user);
        if (!roles.Any(r => r.Equals(AdminRole, StringComparison.OrdinalIgnoreCase)))
            return Forbid();

        if (dto.SessionTimeoutMinutes < 5 || dto.SessionTimeoutMinutes > 120)
            return BadRequest(new { message = "Session timeout must be between 5 and 120 minutes." });

        await SetSettingValue("session_timeout_minutes", dto.SessionTimeoutMinutes.ToString());
        await SetSettingValue("ga_measurement_id", dto.GaMeasurementId?.Trim() ?? "");

        return Ok(new { message = "Security settings saved." });
    }

    // ── Admin Memo ────────────────────────────────────────────────────────

    [HttpGet("memo")]
    public async Task<IActionResult> GetMemo()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        var roles = await _userManager.GetRolesAsync(user);
        if (!roles.Any(r => r.Equals(AdminRole, StringComparison.OrdinalIgnoreCase)))
            return Forbid();

        var memo = await GetSettingValue("admin_memo", "");
        return Ok(new { admin_memo = memo });
    }

    [HttpPut("memo")]
    public async Task<IActionResult> UpdateMemo([FromBody] MemoUpdateDto dto)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        var roles = await _userManager.GetRolesAsync(user);
        if (!roles.Any(r => r.Equals(AdminRole, StringComparison.OrdinalIgnoreCase)))
            return Forbid();

        await SetSettingValue("admin_memo", dto.AdminMemo ?? "");
        return Ok(new { message = "Memo saved." });
    }

    // ── Posyandu (admin only) ─────────────────────────────────────────────

    [HttpGet("posyandu")]
    public async Task<IActionResult> GetPosyandu()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        var roles = await _userManager.GetRolesAsync(user);
        if (!roles.Any(r => r.Equals(AdminRole, StringComparison.OrdinalIgnoreCase)))
            return Forbid();

        return Ok(new
        {
            posyandu_baby_max_months = int.TryParse(await GetSettingValue("posyandu_baby_max_months", "12"), out var a) ? a : 12,
            posyandu_toddler_max_months = int.TryParse(await GetSettingValue("posyandu_toddler_max_months", "36"), out var b) ? b : 36,
            posyandu_child_max_months = int.TryParse(await GetSettingValue("posyandu_child_max_months", "72"), out var c) ? c : 72,
            posyandu_teen_max_months = int.TryParse(await GetSettingValue("posyandu_teen_max_months", "168"), out var d) ? d : 168,
            posyandu_adult_max_months = int.TryParse(await GetSettingValue("posyandu_adult_max_months", "720"), out var e) ? e : 720,
        });
    }

    [HttpPut("posyandu")]
    public async Task<IActionResult> UpdatePosyandu([FromBody] PosyanduUpdateDto dto)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        var roles = await _userManager.GetRolesAsync(user);
        if (!roles.Any(r => r.Equals(AdminRole, StringComparison.OrdinalIgnoreCase)))
            return Forbid();

        await SetSettingValue("posyandu_baby_max_months", dto.PosyanduBabyMaxMonths.ToString());
        await SetSettingValue("posyandu_toddler_max_months", dto.PosyanduToddlerMaxMonths.ToString());
        await SetSettingValue("posyandu_child_max_months", dto.PosyanduChildMaxMonths.ToString());
        await SetSettingValue("posyandu_teen_max_months", dto.PosyanduTeenMaxMonths.ToString());
        await SetSettingValue("posyandu_adult_max_months", dto.PosyanduAdultMaxMonths.ToString());

        return Ok(new { message = "Posyandu settings saved." });
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private async Task<string> GetSettingValue(string key, string defaultValue)
    {
        var setting = await _context.Set<Setting>().FirstOrDefaultAsync(s => s.Key == key);
        return setting?.Value ?? defaultValue;
    }

    private async Task SetSettingValue(string key, string value)
    {
        var setting = await _context.Set<Setting>().FirstOrDefaultAsync(s => s.Key == key);
        if (setting == null)
        {
            setting = new Setting { Key = key, Value = value };
            _context.Set<Setting>().Add(setting);
        }
        else
        {
            setting.Value = value;
            setting.UpdatedAt = DateTime.UtcNow;
        }
        await _context.SaveChangesAsync();
    }
}

// ── DTOs ─────────────────────────────────────────────────────────────────

public class ProfileUpdateDto
{
    public string? Name { get; set; }
    public string? Language { get; set; }
    public IFormFile? Avatar { get; set; }
}

public class PasswordUpdateDto
{
    public string? CurrentPassword { get; set; }
    public string Password { get; set; } = string.Empty;
    public string PasswordConfirmation { get; set; } = string.Empty;
}

public class SecurityUpdateDto
{
    public int SessionTimeoutMinutes { get; set; } = 30;
    public string? GaMeasurementId { get; set; }
}

public class MemoUpdateDto
{
    public string? AdminMemo { get; set; }
}

public class PosyanduUpdateDto
{
    public int PosyanduBabyMaxMonths { get; set; } = 12;
    public int PosyanduToddlerMaxMonths { get; set; } = 36;
    public int PosyanduChildMaxMonths { get; set; } = 72;
    public int PosyanduTeenMaxMonths { get; set; } = 168;
    public int PosyanduAdultMaxMonths { get; set; } = 720;
}
