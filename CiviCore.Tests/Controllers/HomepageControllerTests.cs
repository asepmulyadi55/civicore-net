using CiviCore.Api.Controllers;
using CiviCore.Api.Services;
using CiviCore.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Xunit;
using System.Threading.Tasks;
using System;
using Moq;

namespace CiviCore.Tests.Controllers;

public class HomepageControllerTests : TestBase
{
    private readonly HomepageController _controller;
    private readonly Mock<ILocalStorageService> _mockStorageService;

    public HomepageControllerTests()
    {
        _mockStorageService = new Mock<ILocalStorageService>();
        _controller = new HomepageController(DbContext, _mockStorageService.Object);
        
        var adminUser = new ApplicationUser { Id = Guid.NewGuid(), UserName = "admin", Email = "admin@test.com" };
        SetControllerContextUser(_controller, adminUser, new[] { "Admin" });
    }

    [Fact]
    public async Task GetHero_ReturnsOkWithHero()
    {
        // Act
        var result = await _controller.GetHero() as OkObjectResult;

        // Assert
        Assert.NotNull(result);
        Assert.Equal(200, result.StatusCode);
    }
}
