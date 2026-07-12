using CiviCore.Api.Controllers;
using CiviCore.Api.Services;
using CiviCore.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Xunit;
using System.Threading.Tasks;
using System;
using System.Collections.Generic;
using Moq;

namespace CiviCore.Tests.Controllers;

public class SettingsControllerTests : TestBase
{
    private readonly SettingsController _controller;
    private readonly Mock<ILocalStorageService> _mockStorageService;
    private readonly IConfiguration _configuration;

    public SettingsControllerTests()
    {
        _mockStorageService = new Mock<ILocalStorageService>();
        
        var myConfiguration = new System.Collections.Generic.Dictionary<string, string?>
        {
            {"AppUrl", "http://localhost"}
        };
        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(myConfiguration)
            .Build();

        _controller = new SettingsController(MockUserManager.Object, DbContext, _configuration, _mockStorageService.Object);
        
        var adminUser = new ApplicationUser { Id = Guid.NewGuid(), UserName = "admin", Email = "admin@test.com" };
        SetControllerContextUser(_controller, adminUser, new[] { "Admin" });
        MockUserManager.Setup(x => x.GetUserAsync(It.IsAny<System.Security.Claims.ClaimsPrincipal>())).ReturnsAsync(adminUser);
        MockUserManager.Setup(x => x.GetRolesAsync(adminUser)).ReturnsAsync(new List<string> { "Admin" });
    }

    [Fact]
    public async Task GetPosyandu_ReturnsOkWithSettings()
    {
        // Arrange
        DbContext.Set<Setting>().Add(new Setting { Id = Guid.NewGuid(), Key = "posyandu_toddler_max_age_months", Value = "60" });
        await DbContext.SaveChangesAsync();

        // Act
        var result = await _controller.GetPosyandu() as OkObjectResult;

        // Assert
        Assert.NotNull(result);
        Assert.Equal(200, result.StatusCode);
        Assert.NotNull(result.Value);
    }
}
