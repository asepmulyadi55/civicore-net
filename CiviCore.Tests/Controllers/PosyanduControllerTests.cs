using CiviCore.Api.Controllers;
using CiviCore.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Xunit;
using System.Threading.Tasks;
using System;
using System.Collections.Generic;

namespace CiviCore.Tests.Controllers;

public class PosyanduControllerTests : TestBase
{
    private readonly PosyanduController _controller;

    public PosyanduControllerTests()
    {
        _controller = new PosyanduController(DbContext);
        
        var adminUser = new ApplicationUser { Id = Guid.NewGuid(), UserName = "admin", Email = "admin@test.com" };
        SetControllerContextUser(_controller, adminUser, new[] { "Admin" });
    }

    [Fact]
    public async Task GetPosyandu_ReturnsOkWithResidents()
    {
        // Arrange
        var block = new Block { Id = Guid.NewGuid(), Name = "Block A" };
        var householder = new Householder { Id = Guid.NewGuid(), BlockId = block.Id, Fullname = "Householder 1", Block = block };
        
        DbContext.Set<Setting>().Add(new Setting { Id = Guid.NewGuid(), Key = "posyandu_toddler_max_age_months", Value = "60" });
        DbContext.Set<Setting>().Add(new Setting { Id = Guid.NewGuid(), Key = "posyandu_elderly_min_age_years", Value = "60" });

        DbContext.Set<Resident>().Add(new Resident 
        { 
            Id = Guid.NewGuid(), 
            HouseholderId = householder.Id,
            Householder = householder,
            Fullname = "Toddler Resident",
            BirthDate = DateTime.UtcNow.AddMonths(-24)
        });
        
        await DbContext.SaveChangesAsync();

        // Act
        var result = await _controller.GetPosyandu() as OkObjectResult;

        // Assert
        Assert.NotNull(result);
        Assert.Equal(200, result.StatusCode);
        Assert.NotNull(result.Value);
    }
}
