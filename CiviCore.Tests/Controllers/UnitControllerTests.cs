using CiviCore.Api.Controllers;
using CiviCore.Domain.Entities;
using CiviCore.Domain.Enums;
using Microsoft.AspNetCore.Mvc;
using Xunit;
using System.Threading.Tasks;
using System;
using System.Collections.Generic;

namespace CiviCore.Tests.Controllers;

public class UnitControllerTests : TestBase
{
    private readonly UnitController _controller;

    public UnitControllerTests()
    {
        _controller = new UnitController(DbContext);
        
        var adminUser = new ApplicationUser { Id = Guid.NewGuid(), UserName = "admin", Email = "admin@test.com" };
        SetControllerContextUser(_controller, adminUser, new[] { "Admin" });
    }

    [Fact]
    public async Task GetAll_ReturnsOkWithUnits()
    {
        // Arrange
        var blockId = Guid.NewGuid();
        DbContext.Set<Unit>().Add(new Unit { Id = Guid.NewGuid(), BlockId = blockId, UnitNumber = "A-1", HouseStatus = HouseStatus.OwnerOccupied });
        DbContext.Set<Unit>().Add(new Unit { Id = Guid.NewGuid(), BlockId = blockId, UnitNumber = "A-2", HouseStatus = HouseStatus.Rented });
        await DbContext.SaveChangesAsync();

        // Act
        var result = await _controller.GetAll() as OkObjectResult;

        // Assert
        Assert.NotNull(result);
        Assert.Equal(200, result.StatusCode);
        Assert.NotNull(result.Value);
    }
}
