using CiviCore.Api.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CiviCore.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using CiviCore.Infrastructure.Data;
using CiviCore.Api.Services;
using OtpNet;
using QRCoder;

namespace CiviCore.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
[RequirePermissionModule("users")]
public class UserController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<ApplicationRole> _roleManager;
    private readonly AppDbContext _context;
    private readonly IEmailService _emailService;

    public UserController(UserManager<ApplicationUser> userManager, RoleManager<ApplicationRole> roleManager, AppDbContext context, IEmailService emailService)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _context = context;
        _emailService = emailService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] string? role, [FromQuery] string? status, [FromQuery] int page = 1, [FromQuery] int per_page = 15)
    {
        var query = _userManager.Users.AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            search = search.ToLower();
            query = query.Where(u => (u.Name != null && u.Name.ToLower().Contains(search)) || (u.Email != null && u.Email.ToLower().Contains(search)) || (u.UserName != null && u.UserName.ToLower().Contains(search)));
        }

        if (!string.IsNullOrEmpty(status))
        {
            if (status == "active") query = query.Where(u => u.IsActive);
            else if (status == "inactive") query = query.Where(u => !u.IsActive && u.EmailConfirmed); // Using EmailConfirmed as proxy for approved but inactive, or just use custom logic. Actually let's just check IsActive.
            else if (status == "pending") query = query.Where(u => !u.IsActive);
        }

        if (!string.IsNullOrEmpty(role))
        {
            if (Guid.TryParse(role, out var roleId))
            {
                var roleEntity = await _roleManager.Roles.FirstOrDefaultAsync(r => r.Id == roleId);
                if (roleEntity != null && roleEntity.Name != null)
                {
                    var usersInRole = await _userManager.GetUsersInRoleAsync(roleEntity.Name);
                    var userIds = usersInRole.Select(u => u.Id).ToList();
                    query = query.Where(u => userIds.Contains(u.Id));
                }
            }
            else
            {
                var roleEntity = await _roleManager.Roles.FirstOrDefaultAsync(r => r.NormalizedName == role.ToUpper() || (r.Name != null && r.Name.ToLower() == role.ToLower()));
                if (roleEntity != null && roleEntity.Name != null)
                {
                    var usersInRole = await _userManager.GetUsersInRoleAsync(roleEntity.Name);
                    var userIds = usersInRole.Select(u => u.Id).ToList();
                    query = query.Where(u => userIds.Contains(u.Id));
                }
                else
                {
                    // If the role doesn't exist, return no users
                    query = query.Where(u => false);
                }
            }
        }

        var total = await query.CountAsync();
        var users = await query.Skip((page - 1) * per_page).Take(per_page).ToListAsync();

        var resultData = new List<object>();
        var allUserIds = users.Select(u => u.Id).ToList();
        var householders = await _context.Set<Householder>().Where(h => h.UserId != null && allUserIds.Contains(h.UserId.Value)).ToListAsync();

        foreach (var u in users)
        {
            var userRoles = await _userManager.GetRolesAsync(u);
            var mainRoleName = userRoles.FirstOrDefault();
            ApplicationRole? mainRole = null;
            if (mainRoleName != null)
            {
                mainRole = await _roleManager.Roles.FirstOrDefaultAsync(r => r.Name == mainRoleName);
            }
            
            var h = householders.FirstOrDefault(x => x.UserId == u.Id);

            resultData.Add(new
            {
                id = u.Id,
                name = u.Name,
                username = u.UserName,
                email = u.Email,
                role_id = mainRole?.Id,
                roleName = mainRoleName,
                role = mainRole,
                is_active = u.IsActive,
                email_verified_at = u.EmailConfirmed ? "verified" : null,
                photo = u.Avatar,
                householder_id = h?.Id
            });
        }

        if (per_page >= 100 && page == 1) // Likely from Blocks.tsx just wanting the array directly or inside data
        {
            return Ok(new { data = resultData, meta = new { current_page = page, total = total, last_page = (int)Math.Ceiling((double)total / per_page) } });
        }

        return Ok(new
        {
            data = resultData,
            meta = new
            {
                current_page = page,
                last_page = (int)Math.Ceiling((double)total / per_page),
                total = total
            }
        });
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var total = await _userManager.Users.CountAsync();
        var active = await _userManager.Users.CountAsync(u => u.IsActive);
        var pending = await _userManager.Users.CountAsync(u => !u.IsActive);
        
        var adminUsers = await _userManager.GetUsersInRoleAsync("Admin");
        var admins = adminUsers.Count;

        return Ok(new { total, active, pending, admins });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UserCreateDto dto)
    {
        var user = new ApplicationUser
        {
            UserName = dto.Username,
            Email = dto.Email,
            Name = dto.Name,
            IsActive = dto.Is_Active
        };

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded) return BadRequest(new { errors = result.Errors });

        if (!string.IsNullOrEmpty(dto.Role_Id) && Guid.TryParse(dto.Role_Id, out var roleId))
        {
            var role = await _roleManager.Roles.FirstOrDefaultAsync(r => r.Id == roleId);
            if (role != null && role.Name != null) await _userManager.AddToRoleAsync(user, role.Name);
        }

        await LinkHouseholderAsync(user.Id, dto.HouseholderId);

        return Ok(user);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UserUpdateDto dto)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null) return NotFound();

        user.Name = dto.Name ?? user.Name;
        user.UserName = dto.Username ?? user.UserName;
        user.Email = dto.Email ?? user.Email;
        
        if (dto.Is_Active.HasValue) user.IsActive = dto.Is_Active.Value;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded) return BadRequest(new { errors = result.Errors });

        if (!string.IsNullOrEmpty(dto.Password))
        {
            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            await _userManager.ResetPasswordAsync(user, token, dto.Password);
        }

        if (!string.IsNullOrEmpty(dto.Role_Id) && Guid.TryParse(dto.Role_Id, out var roleId))
        {
            var role = await _roleManager.Roles.FirstOrDefaultAsync(r => r.Id == roleId);
            if (role != null && role.Name != null)
            {
                var currentRoles = await _userManager.GetRolesAsync(user);
                await _userManager.RemoveFromRolesAsync(user, currentRoles);
                await _userManager.AddToRoleAsync(user, role.Name);
            }
        }

        await LinkHouseholderAsync(user.Id, dto.HouseholderId);

        return Ok(user);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null) return NotFound();

        // Unlink Householders attached to this user
        var householders = await _context.Set<Householder>().Where(h => h.UserId == id).ToListAsync();
        foreach (var h in householders)
        {
            h.UserId = null;
        }
        await _context.SaveChangesAsync();

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded) return BadRequest(new { message = "Failed to delete user.", errors = result.Errors });
        
        return NoContent();
    }

    [RequirePermission("users.approve")]
    [HttpPost("{id}/approve")]
    public async Task<IActionResult> Approve(Guid id, [FromBody] ApproveDto dto)
    {
        if (!dto.HouseholderId.HasValue || dto.HouseholderId.Value == Guid.Empty)
            return BadRequest(new { message = "Linked householder is required." });

        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null) return NotFound();

        user.IsActive = true;
        user.EmailConfirmed = true; // Mark as verified/approved so they don't revert to Pending if deactivated
        await _userManager.UpdateAsync(user);

        if (!string.IsNullOrEmpty(dto.Role_Id) && Guid.TryParse(dto.Role_Id, out var roleId))
        {
            var role = await _roleManager.Roles.FirstOrDefaultAsync(r => r.Id == roleId);
            if (role != null && role.Name != null)
            {
                var expectedNormalized = _roleManager.NormalizeKey(role.Name);
                if (role.NormalizedName != expectedNormalized)
                {
                    role.NormalizedName = expectedNormalized;
                    await _roleManager.UpdateAsync(role);
                }

                var currentRoles = await _userManager.GetRolesAsync(user);
                await _userManager.RemoveFromRolesAsync(user, currentRoles);
                await _userManager.AddToRoleAsync(user, role.Name);
            }
        }

        await LinkHouseholderAsync(user.Id, dto.HouseholderId);

        return Ok(new { message = "User approved" });
    }

    [RequirePermission("users.edit")]
    [HttpPost("{id}/deactivate")]
    public async Task<IActionResult> Deactivate(Guid id)
    {
        var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (currentUserId == id.ToString())
            return BadRequest(new { message = "You cannot deactivate your own account." });

        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null) return NotFound();

        user.IsActive = false;
        user.EmailConfirmed = true; // Mark as verified so they appear as Inactive, not Pending
        await _userManager.UpdateAsync(user);

        return Ok(new { message = "User deactivated" });
    }

    [RequirePermission("users.edit")]
    [HttpPost("{id}/reactivate")]
    public async Task<IActionResult> Reactivate(Guid id)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null) return NotFound();

        user.IsActive = true;
        user.EmailConfirmed = true;
        await _userManager.UpdateAsync(user);

        return Ok(new { message = "User reactivated" });
    }

    private async Task LinkHouseholderAsync(Guid userId, Guid? householderId)
    {
        // Unlink any existing householders attached to this user
        var existingLinks = await _context.Set<Householder>().Where(h => h.UserId == userId).ToListAsync();
        foreach (var h in existingLinks)
        {
            h.UserId = null;
        }

        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user != null)
        {
            user.BlockId = null;
        }

        if (householderId.HasValue)
        {
            var newLink = await _context.Set<Householder>().FindAsync(householderId.Value);
            if (newLink != null)
            {
                newLink.UserId = userId;
                if (user != null)
                {
                    user.BlockId = newLink.BlockId;
                }
            }
        }

        if (user != null)
        {
            var updateResult = await _userManager.UpdateAsync(user);
            if (!updateResult.Succeeded)
            {
                var errors = string.Join(", ", updateResult.Errors.Select(e => e.Description));
                throw new Exception($"Failed to update user block ID: {errors}");
            }
        }

        await _context.SaveChangesAsync();
    }

    [RequirePermission("users.edit")]
    [HttpPost("{id}/2fa/send-qr")]
    public async Task<IActionResult> SendQrCode(Guid id)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null) return NotFound(new { message = "User not found." });

        if (string.IsNullOrEmpty(user.TwoFactorSecretKey))
        {
            return BadRequest(new { message = "User does not have 2FA set up. Please use regenerate option instead." });
        }

        await SendQrEmailAsync(user, user.TwoFactorSecretKey);
        return Ok(new { message = "QR code sent." });
    }

    [RequirePermission("users.edit")]
    [HttpPost("{id}/2fa/regenerate-qr")]
    public async Task<IActionResult> RegenerateQrCode(Guid id)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null) return NotFound(new { message = "User not found." });

        var key = KeyGeneration.GenerateRandomKey(20);
        var secret = Base32Encoding.ToString(key);

        user.TwoFactorSecretKey = secret;
        await _userManager.UpdateAsync(user);

        await SendQrEmailAsync(user, secret);
        return Ok(new { message = "New QR code generated and sent." });
    }

    private async Task SendQrEmailAsync(ApplicationUser user, string secret)
    {
        var totpUri = new OtpUri(OtpType.Totp, secret, user.Email, "CiviCore");
        
        using var qrGenerator = new QRCodeGenerator();
        using var qrCodeData = qrGenerator.CreateQrCode(totpUri.ToString(), QRCodeGenerator.ECCLevel.Q);
        using var qrCode = new PngByteQRCode(qrCodeData);
        var qrCodeImage = qrCode.GetGraphic(10); // Reduced from 20 to 10 pixels per module
        
        var cid = "qr-code-image";

        var emailBody = $@"
<div style=""font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);"">
    <div style=""text-align: center; margin-bottom: 25px;"">
        <h2 style=""color: #1e293b; margin: 0; font-size: 24px;"">Two-Factor Authentication Setup</h2>
    </div>
    <p style=""color: #475569; font-size: 16px; line-height: 1.6;"">Hello {user.Name},</p>
    <p style=""color: #475569; font-size: 16px; line-height: 1.6;"">Here is your Two-Factor Authentication QR code. Please scan this with Google Authenticator or a similar app.</p>
    
    <div style=""text-align: center; margin: 30px 0;"">
        <img src=""cid:{cid}"" alt=""QR Code"" style=""width: 200px; max-width: 100%; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px;"" />
    </div>

    <p style=""color: #475569; font-size: 16px; line-height: 1.6; text-align: center;"">
        Or enter this code manually: <br/>
        <strong style=""font-size: 20px; letter-spacing: 2px; color: #3b82f6;"">{secret}</strong>
    </p>

    <hr style=""border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;"">
    <p style=""color: #94a3b8; font-size: 14px; text-align: center; margin: 0;"">Best regards,<br><strong>The CiviCore Team</strong></p>
</div>";

        await _emailService.SendEmailAsync(user.Email!, "Your 2FA QR Code", emailBody, qrCodeImage, cid);
    }
}

public class UserCreateDto
{
    public string Name { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Role_Id { get; set; } = string.Empty;
    public bool Is_Active { get; set; } = true;
    public Guid? HouseholderId { get; set; }
}

public class UserUpdateDto
{
    public string? Name { get; set; }
    public string? Username { get; set; }
    public string? Email { get; set; }
    public string? Password { get; set; }
    public string? Role_Id { get; set; }
    public bool? Is_Active { get; set; }
    public Guid? HouseholderId { get; set; }
}

public class ApproveDto
{
    public string Role_Id { get; set; } = string.Empty;
    public Guid? HouseholderId { get; set; }
}
