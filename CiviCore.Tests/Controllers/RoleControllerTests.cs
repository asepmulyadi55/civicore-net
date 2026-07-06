using CiviCore.Api.Controllers;
using CiviCore.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Xunit;
using System.Threading.Tasks;
using System;
using System.Collections.Generic;

namespace CiviCore.Tests.Controllers;

public class RoleControllerTests : TestBase
{
    private readonly RoleController _controller;

    public RoleControllerTests()
    {
        _controller = new RoleController(DbContext);
        
        var adminUser = new ApplicationUser { Id = Guid.NewGuid(), UserName = "admin", Email = "admin@test.com" };
        SetControllerContextUser(_controller, adminUser, new[] { "Admin" });
    }

    [Fact]
    public async Task GetAll_ReturnsOkWithRoles()
    {
        // Arrange
        DbContext.Set<ApplicationRole>().Add(new ApplicationRole { Id = Guid.NewGuid(), Name = "Admin", Description = "Admin Role" });
        DbContext.Set<ApplicationRole>().Add(new ApplicationRole { Id = Guid.NewGuid(), Name = "User", Description = "User Role" });
        await DbContext.SaveChangesAsync();

        // Act
        var result = await _controller.GetAll() as OkObjectResult;

        // Assert
        Assert.NotNull(result);
        Assert.Equal(200, result.StatusCode);
        Assert.NotNull(result.Value);
    }
}
