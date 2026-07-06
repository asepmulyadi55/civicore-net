using CiviCore.Api.Controllers;
using CiviCore.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Xunit;
using System.Threading.Tasks;
using System;

namespace CiviCore.Tests.Controllers;

public class DashboardControllerTests : TestBase
{
    private readonly DashboardController _controller;
    private readonly IMemoryCache _memoryCache;

    public DashboardControllerTests()
    {
        _memoryCache = new MemoryCache(new MemoryCacheOptions());
        _controller = new DashboardController(DbContext, _memoryCache);
        
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
