using CiviCore.Api.Controllers;
using CiviCore.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;
using System.Threading.Tasks;
using System;
using Moq;

namespace CiviCore.Tests.Controllers;

public class ResidentPortalControllerTests : TestBase
{
    private readonly ResidentPortalController _controller;
    private readonly ApplicationUser _adminUser;

    public ResidentPortalControllerTests()
    {
        _controller = new ResidentPortalController(MockUserManager.Object, DbContext);
        
        _adminUser = new ApplicationUser { Id = Guid.NewGuid(), UserName = "admin", Email = "admin@test.com" };
        SetControllerContextUser(_controller, _adminUser, new[] { "Admin" });
        MockUserManager.Setup(x => x.GetUserAsync(It.IsAny<System.Security.Claims.ClaimsPrincipal>())).ReturnsAsync(_adminUser);
    }

    [Fact]
    public async Task GetOverview_ReturnsOk()
    {
        // Act
        var result = await _controller.GetOverview() as ObjectResult;

        // Assert
        Assert.NotNull(result);
        Assert.Equal(200, result.StatusCode);
    }
}
