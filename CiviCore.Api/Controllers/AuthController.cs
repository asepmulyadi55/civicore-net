using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using CiviCore.Domain.Entities;
using CiviCore.Api.Services;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using OtpNet;
using QRCoder;
using Microsoft.AspNetCore.RateLimiting;

namespace CiviCore.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
{
    private const string InvalidCredentialsMsg = "Invalid credentials";
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<ApplicationRole> _roleManager;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _config;
        private readonly IRecaptchaService _recaptcha;

        public AuthController(SignInManager<ApplicationUser> signInManager, UserManager<ApplicationUser> userManager, RoleManager<ApplicationRole> roleManager, IEmailService emailService, IConfiguration config, IRecaptchaService recaptcha)
        {
            _signInManager = signInManager;
            _userManager = userManager;
            _roleManager = roleManager;
            _emailService = emailService;
            _config = config;
            _recaptcha = recaptcha;
        }

        [HttpPost("login")]
        [EnableRateLimiting("AuthLimit")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
                return BadRequest(new { message = "Email and password are required" });

            var user = await _userManager.FindByEmailAsync(request.Email) ?? await _userManager.FindByNameAsync(request.Email);
            if (user == null)
                return Unauthorized(new { message = InvalidCredentialsMsg });

            var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true);
            
            if (result.IsLockedOut)
                return Unauthorized(new { message = "Account locked out due to multiple failed attempts." });

            if (result.Succeeded)
            {
                if (!user.IsActive)
                {
                    if (user.EmailConfirmed)
                        return Unauthorized(new { message = "Your account has been deactivated." });
                    else
                        return Unauthorized(new { message = "Your account is pending admin approval." });
                }

                // Determine the user's role security mode
                var roles = await _userManager.GetRolesAsync(user);
                var roleName = roles.FirstOrDefault();
                var role = roleName != null ? await _roleManager.FindByNameAsync(roleName) : null;
                var securityMode = role?.SecurityMode ?? "2fa";

                if (securityMode == "captcha")
                {
                    // Return a signal to the client to complete CAPTCHA verification
                    return StatusCode(403, new { message = "CAPTCHA verification required.", requires_captcha = true });
                }

                // 2FA flow (default)
                if (!string.IsNullOrEmpty(user.TwoFactorSecretKey))
                {
                    var claims = new List<Claim> { new Claim(System.Security.Claims.ClaimTypes.Name, user.Id.ToString()) };
                    var identity = new System.Security.Claims.ClaimsIdentity(claims, IdentityConstants.TwoFactorUserIdScheme);
                    await HttpContext.SignInAsync(IdentityConstants.TwoFactorUserIdScheme, new System.Security.Claims.ClaimsPrincipal(identity));
                    
                    return StatusCode(403, new { message = "Two factor authentication required", requires_2fa = true });
                }

                if (securityMode == "none")
                {
                    // No extra security — issue token directly
                    user.SessionToken = Guid.NewGuid().ToString();
                    user.LastLoginAt = DateTime.UtcNow;
                    user.LastActiveAt = DateTime.UtcNow;
                    await _userManager.UpdateAsync(user);
                    await _signInManager.SignInAsync(user, false);
                    return Ok(new { message = "Login successful", token = user.SessionToken, user = new { name = user.Name, email = user.Email, role = roleName ?? "", language = user.Language } });
                }

                // Mandatory 2FA setup
                return StatusCode(403, new { message = "Mandatory Security: You must set up Two-Factor Authentication.", requires_2fa_setup = true });
            }

            return Unauthorized(new { message = InvalidCredentialsMsg });
        }

        [HttpPost("login-captcha")]
        [EnableRateLimiting("AuthLimit")]
        public async Task<IActionResult> LoginCaptcha([FromBody] LoginCaptchaRequest request)
        {
            if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
                return BadRequest(new { message = "Email and password are required." });

            if (string.IsNullOrEmpty(request.CaptchaToken))
                return BadRequest(new { message = "CAPTCHA token is required." });

            var isHuman = await _recaptcha.ValidateAsync(request.CaptchaToken);
            if (!isHuman)
                return Unauthorized(new { message = "CAPTCHA verification failed. Please try again." });

            var user = await _userManager.FindByEmailAsync(request.Email) ?? await _userManager.FindByNameAsync(request.Email);
            if (user == null)
                return Unauthorized(new { message = InvalidCredentialsMsg });

            var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true);
            if (result.IsLockedOut)
                return Unauthorized(new { message = "Account locked out due to multiple failed attempts." });

            if (!result.Succeeded)
                return Unauthorized(new { message = InvalidCredentialsMsg });

            if (!user.IsActive)
                return Unauthorized(new { message = user.EmailConfirmed ? "Your account has been deactivated." : "Your account is pending admin approval." });

            await _signInManager.SignInAsync(user, request.RememberMe);
            user.SessionToken = Guid.NewGuid().ToString();
            user.LastLoginAt = DateTime.UtcNow;
            user.LastActiveAt = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);

            var userRoles = await _userManager.GetRolesAsync(user);
            var userRole = userRoles.FirstOrDefault() ?? "";
            return Ok(new { message = "Login successful", token = user.SessionToken, user = new { name = user.Name, email = user.Email, role = userRole, language = user.Language } });
        }

        [HttpPost("login-2fa")]
        [EnableRateLimiting("AuthLimit")]
        public async Task<IActionResult> Login2FA([FromBody] Login2FARequest request)
        {
            var user = await _signInManager.GetTwoFactorAuthenticationUserAsync();
            
            // Fallback for API clients that do not send cookies
            if (user == null && !string.IsNullOrEmpty(request.Email) && !string.IsNullOrEmpty(request.Password))
            {
                var fallbackUser = await _userManager.FindByEmailAsync(request.Email) ?? await _userManager.FindByNameAsync(request.Email);
                if (fallbackUser != null && await _userManager.CheckPasswordAsync(fallbackUser, request.Password))
                {
                    user = fallbackUser;
                }
            }

            if (user == null)
                return Unauthorized(new { message = "Invalid 2FA session. Please login again." });

            if (!user.IsActive)
                return Unauthorized(new { message = "Your account is pending admin approval." });

            if (string.IsNullOrEmpty(user.TwoFactorSecretKey)) 
                return BadRequest(new { message = "2FA not setup." });

            var totp = new Totp(Base32Encoding.ToBytes(user.TwoFactorSecretKey));
            if (totp.VerifyTotp(request.Code, out _, window: null))
            {
                await _signInManager.SignInAsync(user, request.RememberMe);
                
                user.SessionToken = Guid.NewGuid().ToString();
                user.LastLoginAt = DateTime.UtcNow;
                user.LastActiveAt = DateTime.UtcNow;
                await _userManager.UpdateAsync(user);

                var roles = await _userManager.GetRolesAsync(user);
                var userRole = roles.FirstOrDefault() ?? "";

                return Ok(new { message = "Login successful", token = user.SessionToken, user = new { name = user.Name, email = user.Email, role = userRole, language = user.Language } });
            }

            return Unauthorized(new { message = "Invalid 2FA code." });
        }

        [HttpGet("permissions")]
        [Authorize]
        public async Task<IActionResult> GetPermissions()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            var roles = await _userManager.GetRolesAsync(user);
            var roleName = roles.FirstOrDefault();
            if (string.IsNullOrEmpty(roleName)) return Ok(new List<string>());

            // Super admin bypass
            if (roleName.Equals("Admin", StringComparison.OrdinalIgnoreCase) || roleName.Equals("Super Admin", StringComparison.OrdinalIgnoreCase))
                return Ok(new List<string> { "*" });

            var role = await _roleManager.Roles.Include(r => r.Permissions).FirstOrDefaultAsync(r => r.Name == roleName);
            var perms = role?.Permissions?.Select(p => p.PermissionKey).ToList() ?? new List<string>();
            return Ok(perms);
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user != null)
            {
                user.SessionToken = null;
                await _userManager.UpdateAsync(user);
            }
            await _signInManager.SignOutAsync();
            return Ok(new { message = "Logged out successfully" });
        }

        [HttpPost("register")]
        [EnableRateLimiting("AuthLimit")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (request.Password != request.ConfirmPassword)
                return BadRequest(new { message = "Passwords do not match" });

            var user = new ApplicationUser
            {
                UserName = string.IsNullOrEmpty(request.Username) ? request.Email : request.Username,
                Email = request.Email,
                Name = request.Name,
                IsActive = false // requires approval by default
            };

            var result = await _userManager.CreateAsync(user, request.Password);
            if (result.Succeeded)
            {
                return Ok(new { message = "Registration successful, pending approval." });
            }

            return BadRequest(new { message = "Registration failed", errors = result.Errors });
        }

        [HttpPost("forgot-password")]
        [EnableRateLimiting("AuthLimit")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user != null)
            {
                var token = await _userManager.GeneratePasswordResetTokenAsync(user);
                var frontendUrl = _config["FrontendUrl"]?.TrimEnd('/') ?? "http://localhost:5173";
                var resetLink = $"{frontendUrl}/admin/reset-password?token={Uri.EscapeDataString(token)}&email={Uri.EscapeDataString(user.Email!)}";
                
                var emailBody = $@"
<div style=""font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);"">
    <div style=""text-align: center; margin-bottom: 25px;"">
        <h2 style=""color: #1e293b; margin: 0; font-size: 24px;"">Password Reset Request</h2>
    </div>
    <p style=""color: #475569; font-size: 16px; line-height: 1.6;"">Hello,</p>
    <p style=""color: #475569; font-size: 16px; line-height: 1.6;"">We received a request to reset your password for your CiviCore account. Click the button below to set up a new password:</p>
    <div style=""text-align: center; margin: 35px 0;"">
        <a href=""{resetLink}"" style=""background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-size: 16px; font-weight: 600; display: inline-block; transition: background-color 0.2s;"">Reset My Password</a>
    </div>
    <p style=""color: #475569; font-size: 15px; line-height: 1.6;"">If the button doesn't work, you can also copy and paste the following link into your browser:</p>
    <p style=""background-color: #f8fafc; padding: 12px; border-radius: 4px; word-break: break-all; font-size: 14px; color: #64748b; border: 1px solid #e2e8f0;"">
        {resetLink}
    </p>
    <p style=""color: #475569; font-size: 15px; margin-top: 30px;"">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
    <hr style=""border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;"">
    <p style=""color: #94a3b8; font-size: 14px; text-align: center; margin: 0;"">Best regards,<br><strong>The CiviCore Team</strong></p>
</div>";

                await _emailService.SendEmailAsync(user.Email!, "Reset Your CiviCore Password", emailBody);
            }
            // Always return OK to prevent email enumeration
            return Ok(new { message = "If the email is registered, a password reset link has been sent." });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null) return BadRequest(new { message = "Invalid request." });

            var result = await _userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);
            if (result.Succeeded)
                return Ok(new { message = "Password reset successful." });

            return BadRequest(new { message = "Error resetting password.", errors = result.Errors });
        }

        [HttpGet("google")]
        public IActionResult GoogleLogin([FromQuery] string intent = "login")
        {
            var properties = new AuthenticationProperties { RedirectUri = Url.Action("GoogleResponse", new { intent }) };
            return Challenge(properties, GoogleDefaults.AuthenticationScheme);
        }

        [HttpGet("google-response")]
        public async Task<IActionResult> GoogleResponse([FromQuery] string intent = "login")
        {
            var result = await HttpContext.AuthenticateAsync(IdentityConstants.ExternalScheme);
            if (!result.Succeeded) return BadRequest();

            var email = result.Principal.FindFirstValue(ClaimTypes.Email);
            if (email == null) return BadRequest();

            var frontendUrl = _config["FrontendUrl"]?.TrimEnd('/') ?? "http://localhost:5173";
            var loginUrl = $"{frontendUrl}/admin/login";
            var registerUrl = $"{frontendUrl}/admin/register";

            var user = await _userManager.FindByEmailAsync(email);

            if (user != null && intent == "register")
            {
                return Redirect($"{registerUrl}?error={Uri.EscapeDataString("An account with this Google email already exists. Please sign in instead.")}");
            }

            if (user == null)
            {
                // Auto register google user (pending approval)
                user = new ApplicationUser
                {
                    UserName = email.Contains('@') ? email.Split('@')[0] : email,
                    Email = email,
                    Name = result.Principal.FindFirstValue(ClaimTypes.Name) ?? "Google User",
                    GoogleId = result.Principal.FindFirstValue(ClaimTypes.NameIdentifier),
                    IsActive = false // Requires approval by default!
                };
                await _userManager.CreateAsync(user);
                
                return Redirect($"{loginUrl}?message={Uri.EscapeDataString("Registration successful! Your account is pending admin approval.")}");
            }
            else if (string.IsNullOrEmpty(user.GoogleId))
            {
                user.GoogleId = result.Principal.FindFirstValue(ClaimTypes.NameIdentifier);
                await _userManager.UpdateAsync(user);
            }

            if (!user.IsActive)
            {
                return Redirect($"{loginUrl}?message={Uri.EscapeDataString("Your account is still pending admin approval.")}&isError=true");
            }

            var roles = await _userManager.GetRolesAsync(user);
            var userRole = roles.FirstOrDefault() ?? "";
            var userJson = System.Text.Json.JsonSerializer.Serialize(new { name = user.Name, email = user.Email, role = userRole, language = user.Language });
            var encodedUser = Uri.EscapeDataString(userJson);

            if (!string.IsNullOrEmpty(user.TwoFactorSecretKey))
            {
                var claims = new List<Claim> { new Claim(ClaimTypes.Name, user.Id.ToString()) };
                var identity = new ClaimsIdentity(claims, IdentityConstants.TwoFactorUserIdScheme);
                await HttpContext.SignInAsync(IdentityConstants.TwoFactorUserIdScheme, new ClaimsPrincipal(identity));
                return Redirect($"{loginUrl}?requires_2fa=true&email={Uri.EscapeDataString(user.Email)}");
            }
            
            user.SessionToken = Guid.NewGuid().ToString();
            await _userManager.UpdateAsync(user);
            await _signInManager.SignInAsync(user, isPersistent: true);
            
            // Redirect to login page with token so the React frontend can save it to localStorage
            return Redirect($"{loginUrl}?requires_2fa_setup=true&token={user.SessionToken}&user={encodedUser}&email={Uri.EscapeDataString(user.Email)}");
        }

        [HttpPost("2fa/setup")]
        public async Task<IActionResult> Setup2FA([FromBody] Setup2FARequest request)
        {
            // Try to get user from Identity session first
            var user = await _userManager.GetUserAsync(User);
            
            // Fallback: Check if Bearer token is provided
            if (user == null && Request.Headers.TryGetValue("Authorization", out var authHeader))
            {
                var token = authHeader.ToString().Replace("Bearer ", "").Trim();
                if (!string.IsNullOrEmpty(token))
                {
                    user = await _userManager.Users.FirstOrDefaultAsync(u => u.SessionToken == token);
                }
            }
            
            // Fallback for stateless 2FA setup during login flow
            if (user == null && !string.IsNullOrEmpty(request.Email) && !string.IsNullOrEmpty(request.Password))
            {
                var fallbackUser = await _userManager.FindByEmailAsync(request.Email) ?? await _userManager.FindByNameAsync(request.Email);
                if (fallbackUser != null && await _userManager.CheckPasswordAsync(fallbackUser, request.Password))
                {
                    user = fallbackUser;
                }
            }

            if (user == null) return Unauthorized(new { message = "Invalid credentials." });

            string secret;
            if (!string.IsNullOrEmpty(user.TwoFactorSecretKey))
            {
                secret = user.TwoFactorSecretKey;
            }
            else
            {
                var key = KeyGeneration.GenerateRandomKey(20);
                secret = Base32Encoding.ToString(key);
                user.TwoFactorSecretKey = secret;
                await _userManager.UpdateAsync(user);
            }

            var totpUri = new OtpUri(OtpType.Totp, secret, user.Email, "CiviCore");
            
            using var qrGenerator = new QRCodeGenerator();
            using var qrCodeData = qrGenerator.CreateQrCode(totpUri.ToString(), QRCodeGenerator.ECCLevel.Q);
            using var qrCode = new PngByteQRCode(qrCodeData);
            var qrCodeImage = qrCode.GetGraphic(20);
            
            var base64Image = Convert.ToBase64String(qrCodeImage);

            return Ok(new { secret = secret, qrCode = $"data:image/png;base64,{base64Image}" });
        }

        [HttpPost("2fa/verify")]
        public async Task<IActionResult> Verify2FA([FromBody] Verify2FARequest request)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();
            if (string.IsNullOrEmpty(user.TwoFactorSecretKey)) return BadRequest(new { message = "2FA not setup." });

            var totp = new Totp(Base32Encoding.ToBytes(user.TwoFactorSecretKey));
            if (totp.VerifyTotp(request.Code, out _, window: null))
            {
                user.TwoFactorEnabledAt = DateTime.UtcNow;
                await _userManager.SetTwoFactorEnabledAsync(user, true);
                await _userManager.UpdateAsync(user);
                return Ok(new { message = "2FA enabled successfully." });
            }

            return BadRequest(new { message = "Invalid code." });
        }

        [HttpPost("2fa/disable")]
        public async Task<IActionResult> Disable2FA()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            user.TwoFactorEnabledAt = null;
            user.TwoFactorSecretKey = null;
            await _userManager.SetTwoFactorEnabledAsync(user, false);
            await _userManager.UpdateAsync(user);

            return Ok(new { message = "2FA disabled." });
        }
    }

    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public bool RememberMe { get; set; } = false;
    }

    public class Login2FARequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public bool RememberMe { get; set; } = false;
    }

    public class LoginCaptchaRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string CaptchaToken { get; set; } = string.Empty;
        public bool RememberMe { get; set; } = false;
    }

    public class RegisterRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string ConfirmPassword { get; set; } = string.Empty;
    }

    public class ForgotPasswordRequest { public string Email { get; set; } = string.Empty; }
    public class ResetPasswordRequest 
    { 
        public string Email { get; set; } = string.Empty; 
        public string Token { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
    public class Verify2FARequest { public string Code { get; set; } = string.Empty; }
    public class Setup2FARequest 
    { 
        public string Email { get; set; } = string.Empty; 
        public string Password { get; set; } = string.Empty; 
    }
}
