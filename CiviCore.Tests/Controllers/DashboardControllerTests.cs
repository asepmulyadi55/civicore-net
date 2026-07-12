using CiviCore.Api.Controllers;
using CiviCore.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;
using Moq;
using Xunit;
using System.Threading.Tasks;
using System;

namespace CiviCore.Tests.Controllers;

public class DashboardControllerTests : TestBase
{
    private readonly DashboardController _controller;
    private readonly Mock<IDistributedCache> _mockCache;

    public DashboardControllerTests()
    {
        _mockCache = new Mock<IDistributedCache>();
        _controller = new DashboardController(DbContext, _mockCache.Object);
        
        var adminUser = new ApplicationUser { Id = Guid.NewGuid(), UserName = "admin", Email = "admin@test.com" };
        SetControllerContextUser(_controller, adminUser, new[] { "Admin" });
    }

    [Fact]
    public async Task GetStats_ReturnsOkWithStats()
    {
        // Act
        var result = await _controller.GetStats() as OkObjectResult;

        // Assert
        Assert.NotNull(result);
        Assert.Equal(200, result.StatusCode);
        Assert.NotNull(result.Value);
    }
}
