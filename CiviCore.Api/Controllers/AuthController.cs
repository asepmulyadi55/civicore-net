using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using CiviCore.Domain.Entities;
using CiviCore.Api.Services;
using System.Security.Claims;
using OtpNet;
using QRCoder;
using Microsoft.AspNetCore.RateLimiting;

namespace CiviCore.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _config;

        public AuthController(SignInManager<ApplicationUser> signInManager, UserManager<ApplicationUser> userManager, IEmailService emailService, IConfiguration config)
        {
            _signInManager = signInManager;
            _userManager = userManager;
            _emailService = emailService;
            _config = config;
        }

        [HttpPost("login")]
        [EnableRateLimiting("AuthLimit")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
                return BadRequest(new { message = "Email and password are required" });

            var user = await _userManager.FindByEmailAsync(request.Email) ?? await _userManager.FindByNameAsync(request.Email);
            if (user == null)
                return Unauthorized(new { message = "Invalid credentials" });

            var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true);
            
            if (result.IsLockedOut)
                return Unauthorized(new { message = "Account locked out due to multiple failed attempts." });

            if (result.Succeeded)
            {
                // Mirror Laravel exactly: Force 2FA Challenge if they have a secret configured
                if (!string.IsNullOrEmpty(user.TwoFactorSecretKey))
                {
                    return StatusCode(403, new { message = "Two factor authentication required", requires_2fa = true });
                }

                // If they don't have a secret, MANDATORY 2FA dictates they MUST set it up now!
                return StatusCode(403, new { message = "Mandatory Security: You must set up Two-Factor Authentication.", requires_2fa_setup = true });
            }

            return Unauthorized(new { message = "Invalid credentials" });
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

                return Ok(new { message = "Login successful", token = user.SessionToken, user = new { name = user.Name, email = user.Email, role = userRole } });
            }

            return Unauthorized(new { message = "Invalid 2FA code." });
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
                var resetLink = $"{Request.Scheme}://{Request.Host}/reset-password?token={Uri.EscapeDataString(token)}&email={Uri.EscapeDataString(user.Email!)}";
                
                await _emailService.SendEmailAsync(user.Email!, "Reset Password", $"Click here to reset your password: <a href=\"{resetLink}\">Reset Password</a>");
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

            var frontendUrl = _config["FrontendUrl"] ?? "/";
            var loginUrl = frontendUrl.Replace("/dashboard", "/login");
            var registerUrl = frontendUrl.Replace("/dashboard", "/register");

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
                    UserName = email,
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

            user.SessionToken = Guid.NewGuid().ToString();
            await _userManager.UpdateAsync(user);

            await _signInManager.SignInAsync(user, isPersistent: true);
            
            var roles = await _userManager.GetRolesAsync(user);
            var userRole = roles.FirstOrDefault() ?? "";

            var userJson = System.Text.Json.JsonSerializer.Serialize(new { name = user.Name, email = user.Email, role = userRole });
            var encodedUser = Uri.EscapeDataString(userJson);
            
            // Redirect to login page with token so the React frontend can save it to localStorage
            return Redirect($"{loginUrl}?token={user.SessionToken}&user={encodedUser}");
        }

        [HttpPost("2fa/setup")]
        public async Task<IActionResult> Setup2FA([FromBody] Setup2FARequest request)
        {
            // Try to get user from Identity session first
            var user = await _userManager.GetUserAsync(User);
            
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

            var key = KeyGeneration.GenerateRandomKey(20);
            var secret = Base32Encoding.ToString(key);

            user.TwoFactorSecretKey = secret;
            await _userManager.UpdateAsync(user);

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
