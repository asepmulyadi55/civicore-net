using CiviCore.Api.Controllers;
using CiviCore.Api.Services;
using CiviCore.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using Xunit;
using System.Threading.Tasks;
using System;
using Moq;

namespace CiviCore.Tests.Controllers;

public class PaymentControllerTests : TestBase
{
    private readonly PaymentController _controller;
    private readonly Mock<ILocalStorageService> _mockStorageService;

    public PaymentControllerTests()
    {
        _mockStorageService = new Mock<ILocalStorageService>();
        _controller = new PaymentController(DbContext, MockUserManager.Object, _mockStorageService.Object);
        
        var adminUser = new ApplicationUser { Id = Guid.NewGuid(), UserName = "admin", Email = "admin@test.com" };
        SetControllerContextUser(_controller, adminUser, new[] { "Admin" });
    }

    [Fact]
    public async Task GetAll_ReturnsOkWithPayments()
    {
        // Arrange
        var blockId = Guid.NewGuid();
        DbContext.Set<PaymentRecord>().Add(new PaymentRecord { Id = Guid.NewGuid(), BlockId = blockId, PaymentMonth = DateTime.UtcNow, Amount = 1000, Status = CiviCore.Domain.Enums.PaymentStatus.Approved });
        await DbContext.SaveChangesAsync();

        // Act
        var result = await _controller.GetAll(1, null, null, null, null, null, null, null) as OkObjectResult;

        // Assert
        Assert.NotNull(result);
        Assert.Equal(200, result.StatusCode);
        Assert.NotNull(result.Value);
    }
}
