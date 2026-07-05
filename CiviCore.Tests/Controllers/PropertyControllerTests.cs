using CiviCore.Api.Controllers;
using CiviCore.Api.Services;
using CiviCore.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Xunit;
using System.Threading.Tasks;
using System;
using Moq;

namespace CiviCore.Tests.Controllers;

public class PropertyControllerTests : TestBase
{
    private readonly PropertyController _controller;
    private readonly Mock<ILocalStorageService> _mockStorageService;

    public PropertyControllerTests()
    {
        _mockStorageService = new Mock<ILocalStorageService>();
        _controller = new PropertyController(DbContext, _mockStorageService.Object);
        
        var adminUser = new ApplicationUser { Id = Guid.NewGuid(), UserName = "admin", Email = "admin@test.com" };
        SetControllerContextUser(_controller, adminUser, new[] { "Admin" });
    }

    [Fact]
    public async Task GetById_ReturnsOkWithProperty()
    {
        // Arrange
        var id = Guid.NewGuid();
        DbContext.Set<PropertyListing>().Add(new PropertyListing { Id = id, Title = "Asset 1", Status = "Available" });
        await DbContext.SaveChangesAsync();

        // Act
        var result = await _controller.GetById(id) as OkObjectResult;

        // Assert
        Assert.NotNull(result);
        Assert.Equal(200, result.StatusCode);
        Assert.NotNull(result.Value);
    }
}
