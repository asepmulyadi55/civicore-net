using CiviCore.Api.Controllers;
using CiviCore.Api.Services;
using CiviCore.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Xunit;
using System.Threading.Tasks;
using System;
using Moq;

using Microsoft.Extensions.Caching.Distributed;

namespace CiviCore.Tests.Controllers;

public class HomepageControllerTests : TestBase
{
    private readonly HomepageController _controller;
    private readonly Mock<ILocalStorageService> _mockStorageService;
    private readonly Mock<IDistributedCache> _mockCache;
    private readonly Mock<IEmailService> _mockEmailService;
    private readonly Mock<IRecaptchaService> _mockRecaptchaService;

    public HomepageControllerTests()
    {
        _mockStorageService = new Mock<ILocalStorageService>();
        _mockCache = new Mock<IDistributedCache>();
        _mockEmailService = new Mock<IEmailService>();
        _mockRecaptchaService = new Mock<IRecaptchaService>();

        _controller = new HomepageController(
            DbContext, 
            _mockStorageService.Object, 
            _mockCache.Object, 
            _mockEmailService.Object, 
            _mockRecaptchaService.Object
        );
        
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
