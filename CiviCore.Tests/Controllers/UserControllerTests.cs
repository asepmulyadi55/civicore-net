using CiviCore.Api.Controllers;
using CiviCore.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using Xunit;
using System.Threading.Tasks;
using System;
using System.Collections.Generic;
using Moq;
using System.Linq;

namespace CiviCore.Tests.Controllers;

public class UserControllerTests : TestBase
{
    private readonly UserController _controller;

    public UserControllerTests()
    {
        _controller = new UserController(MockUserManager.Object, MockRoleManager.Object, DbContext);
        
        var adminUser = new ApplicationUser { Id = Guid.NewGuid(), UserName = "admin", Email = "admin@test.com" };
        SetControllerContextUser(_controller, adminUser, new[] { "Admin" });
    }

    [Fact]
    public async Task GetAll_ReturnsOkWithUsers()
    {
        // Arrange
        DbContext.Users.Add(new ApplicationUser { Id = Guid.NewGuid(), UserName = "user1", Email = "user1@test.com" });
        DbContext.Users.Add(new ApplicationUser { Id = Guid.NewGuid(), UserName = "user2", Email = "user2@test.com" });
        await DbContext.SaveChangesAsync();

        MockUserManager.Setup(x => x.Users).Returns(DbContext.Users);
        MockUserManager.Setup(x => x.GetRolesAsync(It.IsAny<ApplicationUser>())).ReturnsAsync(new List<string> { "Admin" });
        MockRoleManager.Setup(x => x.Roles).Returns(DbContext.Roles);

        // Act
        var result = await _controller.GetAll(null, null, null, 1, 10) as OkObjectResult;

        // Assert
        Assert.NotNull(result);
        Assert.Equal(200, result.StatusCode);
        Assert.NotNull(result.Value);
    }
}
