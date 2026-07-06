using CiviCore.Api.Controllers;
using CiviCore.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Xunit;
using System.Threading.Tasks;
using System;

namespace CiviCore.Tests.Controllers;

public class NavigationControllerTests : TestBase
{
    private readonly NavigationController _controller;

    public NavigationControllerTests()
    {
        _controller = new NavigationController(DbContext);
        
        var adminUser = new ApplicationUser { Id = Guid.NewGuid(), UserName = "admin", Email = "admin@test.com" };
        SetControllerContextUser(_controller, adminUser, new[] { "Admin" });
    }

    [Fact]
    public async Task GetAll_ReturnsOkWithLinks()
    {
        // Arrange
        DbContext.Set<NavigationLink>().Add(new NavigationLink { Id = Guid.NewGuid(), Title = "Home", Url = "/" });
        await DbContext.SaveChangesAsync();

        // Act
        var result = await _controller.GetAll() as OkObjectResult;

        // Assert
        Assert.NotNull(result);
        Assert.Equal(200, result.StatusCode);
        Assert.NotNull(result.Value);
    }
}
