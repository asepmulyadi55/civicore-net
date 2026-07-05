using CiviCore.Api.Controllers;
using CiviCore.Api.Services;
using CiviCore.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;
using System.Threading.Tasks;
using System;

namespace CiviCore.Tests.Controllers;

public class HouseholderControllerTests : TestBase
{
    private readonly Mock<IEncryptionService> _mockEncryptionService;
    private readonly HouseholderController _controller;

    public HouseholderControllerTests()
    {
        _mockEncryptionService = new Mock<IEncryptionService>();
        
        // Mock simple encryption that just returns the same string for testing
        _mockEncryptionService.Setup(x => x.Encrypt(It.IsAny<string>())).Returns((string s) => s);
        _mockEncryptionService.Setup(x => x.Decrypt(It.IsAny<string>())).Returns((string s) => s);

        _controller = new HouseholderController(DbContext, _mockEncryptionService.Object);
        
        var adminUser = new ApplicationUser { Id = Guid.NewGuid(), UserName = "admin", Email = "admin@test.com" };
        SetControllerContextUser(_controller, adminUser, new[] { "Admin" });
    }

    [Fact]
    public async Task GetAll_ReturnsOkWithHouseholders()
    {
        // Arrange
        DbContext.Set<Householder>().Add(new Householder { Id = Guid.NewGuid(), Fullname = "John Doe", Phone = "0812345678" });
        DbContext.Set<Householder>().Add(new Householder { Id = Guid.NewGuid(), Fullname = "Jane Smith", Phone = "0898765432" });
        await DbContext.SaveChangesAsync();

        // Act
        var result = await _controller.GetAll(null, null, null, 1, 10) as OkObjectResult;

        // Assert
        Assert.NotNull(result);
        Assert.Equal(200, result.StatusCode);
        Assert.NotNull(result.Value);
    }
}
