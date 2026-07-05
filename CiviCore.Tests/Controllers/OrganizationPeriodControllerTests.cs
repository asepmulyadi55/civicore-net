using CiviCore.Api.Controllers;
using CiviCore.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Xunit;
using System.Threading.Tasks;
using System;
using System.Collections.Generic;

namespace CiviCore.Tests.Controllers;

public class OrganizationPeriodControllerTests : TestBase
{
    private readonly OrganizationPeriodController _controller;

    public OrganizationPeriodControllerTests()
    {
        _controller = new OrganizationPeriodController(DbContext);
        
        var adminUser = new ApplicationUser { Id = Guid.NewGuid(), UserName = "admin", Email = "admin@test.com" };
        SetControllerContextUser(_controller, adminUser, new[] { "Admin" });
    }

    [Fact]
    public async Task GetAll_ReturnsOkWithPeriods()
    {
        // Arrange
        DbContext.Set<OrganizationPeriod>().Add(new OrganizationPeriod { Id = Guid.NewGuid(), Name = "Periode 2024", StartYear = 2024, EndYear = 2024, IsActive = true });
        DbContext.Set<OrganizationPeriod>().Add(new OrganizationPeriod { Id = Guid.NewGuid(), Name = "Periode 2025", StartYear = 2025, EndYear = 2025, IsActive = false });
        await DbContext.SaveChangesAsync();

        // Act
        var result = await _controller.GetAll() as OkObjectResult;

        // Assert
        Assert.NotNull(result);
        Assert.Equal(200, result.StatusCode);
        Assert.NotNull(result.Value);
    }
}
