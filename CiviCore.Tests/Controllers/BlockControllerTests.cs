using CiviCore.Api.Controllers;
using CiviCore.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Xunit;
using System.Threading.Tasks;
using System;
using System.Collections.Generic;

namespace CiviCore.Tests.Controllers;

public class BlockControllerTests : TestBase
{
    private readonly BlockController _controller;

    public BlockControllerTests()
    {
        _controller = new BlockController(DbContext);
        
        // Mock a user context with Admin role for authorization if needed
        var adminUser = new ApplicationUser { Id = Guid.NewGuid(), UserName = "admin", Email = "admin@test.com" };
        SetControllerContextUser(_controller, adminUser, new[] { "Admin" });
    }

    [Fact]
    public async Task GetAll_ReturnsOkWithBlocks()
    {
        // Arrange
        DbContext.Set<Block>().Add(new Block { Id = Guid.NewGuid(), Name = "Block A" });
        DbContext.Set<Block>().Add(new Block { Id = Guid.NewGuid(), Name = "Block B" });
        await DbContext.SaveChangesAsync();

        // Act
        var result = await _controller.GetAll() as OkObjectResult;

        // Assert
        Assert.NotNull(result);
        Assert.Equal(200, result.StatusCode);
        Assert.IsAssignableFrom<System.Collections.IEnumerable>(result.Value);
    }
}
