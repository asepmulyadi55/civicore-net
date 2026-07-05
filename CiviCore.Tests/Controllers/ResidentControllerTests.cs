using CiviCore.Api.Controllers;
using CiviCore.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Xunit;
using System.Threading.Tasks;
using System;
using System.Collections.Generic;

namespace CiviCore.Tests.Controllers;

public class ResidentControllerTests : TestBase
{
    private readonly ResidentController _controller;

    public ResidentControllerTests()
    {
        _controller = new ResidentController(DbContext);
        
        var adminUser = new ApplicationUser { Id = Guid.NewGuid(), UserName = "admin", Email = "admin@test.com" };
        SetControllerContextUser(_controller, adminUser, new[] { "Admin" });
    }

    [Fact]
    public async Task GetAll_ReturnsOkWithResidents()
    {
        // Arrange
        DbContext.Set<Resident>().Add(new Resident { Id = Guid.NewGuid(), Fullname = "Resident One", Relationship = "Wife" });
        DbContext.Set<Resident>().Add(new Resident { Id = Guid.NewGuid(), Fullname = "Resident Two", Relationship = "Child" });
        await DbContext.SaveChangesAsync();

        // Act
        var result = await _controller.GetAll() as OkObjectResult;

        // Assert
        Assert.NotNull(result);
        Assert.Equal(200, result.StatusCode);
        Assert.NotNull(result.Value);
    }
}
