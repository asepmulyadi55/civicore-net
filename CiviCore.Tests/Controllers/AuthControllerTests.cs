using CiviCore.Api.Controllers;
using CiviCore.Api.Services;
using CiviCore.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;

namespace CiviCore.Tests.Controllers;

public class AuthControllerTests : TestBase
{
    private readonly Mock<IEmailService> _mockEmailService;
    private readonly IConfiguration _config;
    private readonly AuthController _controller;

    public AuthControllerTests()
    {
        _mockEmailService = new Mock<IEmailService>();
        
        var inMemorySettings = new Dictionary<string, string> {
            {"Jwt:Key", "SuperSecretKeyForTestingWhichNeedsToBeLongEnough"},
            {"Jwt:Issuer", "TestIssuer"},
            {"Jwt:Audience", "TestAudience"}
        };
        _config = new ConfigurationBuilder().AddInMemoryCollection(inMemorySettings).Build();

        _controller = new AuthController(
            MockSignInManager.Object,
            MockUserManager.Object,
            MockRoleManager.Object,
            _mockEmailService.Object,
            _config
        );
    }

    [Fact]
    public async Task Login_InvalidCredentials_ReturnsUnauthorized()
    {
        // Arrange
        var request = new LoginRequest { Email = "test@example.com", Password = "WrongPassword" };
        MockUserManager.Setup(x => x.FindByEmailAsync(request.Email)).ReturnsAsync((ApplicationUser?)null);

        // Act
        var result = await _controller.Login(request) as UnauthorizedObjectResult;

        // Assert
        Assert.NotNull(result);
        Assert.Equal(401, result.StatusCode);
    }

    [Fact]
    public async Task Login_ValidCredentials_Returns403_Requires2FASetup()
    {
        // Arrange
        var request = new LoginRequest { Email = "test@example.com", Password = "Password123!" };
        var user = new ApplicationUser { Id = Guid.NewGuid(), Email = request.Email, UserName = request.Email, IsActive = true };
        
        MockUserManager.Setup(x => x.FindByEmailAsync(request.Email)).ReturnsAsync(user);
        MockSignInManager.Setup(x => x.CheckPasswordSignInAsync(user, request.Password, true))
            .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Success);
        MockUserManager.Setup(x => x.GetRolesAsync(user)).ReturnsAsync((IList<string>)new List<string>());

        // Act
        var result = await _controller.Login(request) as ObjectResult;

        // Assert
        Assert.NotNull(result);
        Assert.Equal(403, result.StatusCode);
        Assert.Contains("requires_2fa_setup", result.Value?.ToString() ?? "");
    }
}
