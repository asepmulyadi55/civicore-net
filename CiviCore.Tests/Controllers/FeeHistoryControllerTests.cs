using CiviCore.Api.Controllers;
using CiviCore.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Xunit;
using System.Threading.Tasks;
using System;

namespace CiviCore.Tests.Controllers;

public class FeeHistoryControllerTests : TestBase
{
    private readonly FeeHistoryController _controller;

    public FeeHistoryControllerTests()
    {
        _controller = new FeeHistoryController(DbContext);
        
        var adminUser = new ApplicationUser { Id = Guid.NewGuid(), UserName = "admin", Email = "admin@test.com" };
        SetControllerContextUser(_controller, adminUser, new[] { "Admin" });
    }

    [Fact]
    public async Task GetFeeForMonth_ReturnsOkWithFee()
    {
        // Arrange
        var householderId = Guid.NewGuid();
        DbContext.Set<FeeHistory>().Add(new FeeHistory { Id = Guid.NewGuid(), HouseholderId = householderId, EffectiveFrom = new DateTime(2024, 5, 1, 0, 0, 0, DateTimeKind.Utc), Amount = 150000 });
        await DbContext.SaveChangesAsync();

        // Act
        var result = await _controller.GetFeeForMonth(householderId, 2024, 5) as OkObjectResult;

        // Assert
        Assert.NotNull(result);
        Assert.Equal(200, result.StatusCode);
        Assert.NotNull(result.Value);
    }
}
