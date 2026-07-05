using CiviCore.Api.Controllers;
using CiviCore.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Xunit;
using System.Threading.Tasks;
using System;
using System.Collections.Generic;

namespace CiviCore.Tests.Controllers;

public class OrganizationPositionControllerTests : TestBase
{
    private readonly OrganizationPositionController _controller;

    public OrganizationPositionControllerTests()
    {
        _controller = new OrganizationPositionController(DbContext);
        
        var adminUser = new ApplicationUser { Id = Guid.NewGuid(), UserName = "admin", Email = "admin@test.com" };
        SetControllerContextUser(_controller, adminUser, new[] { "Admin" });
    }

    [Fact]
    public async Task GetAll_ReturnsOkWithPositions()
    {
        // Arrange
        var periodId = Guid.NewGuid();
        DbContext.Set<OrganizationPosition>().Add(new OrganizationPosition { Id = Guid.NewGuid(), PeriodId = periodId, PositionName = "Ketua RT", SortOrder = 1 });
        DbContext.Set<OrganizationPosition>().Add(new OrganizationPosition { Id = Guid.NewGuid(), PeriodId = periodId, PositionName = "Sekretaris", SortOrder = 2 });
        await DbContext.SaveChangesAsync();

        // Act
        var result = await _controller.GetAll(periodId) as OkObjectResult;

        // Assert
        Assert.NotNull(result);
        Assert.Equal(200, result.StatusCode);
        Assert.NotNull(result.Value);
    }
}
