using CiviCore.Api.Controllers;
using CiviCore.Domain.Entities;
using CiviCore.Domain.Enums;
using Microsoft.AspNetCore.Mvc;
using Xunit;
using System.Threading.Tasks;
using System;
using System.Collections.Generic;

namespace CiviCore.Tests.Controllers;

public class FinanceControllerTests : TestBase
{
    private readonly FinanceController _controller;

    public FinanceControllerTests()
    {
        _controller = new FinanceController(DbContext);
        
        var adminUser = new ApplicationUser { Id = Guid.NewGuid(), UserName = "admin", Email = "admin@test.com" };
        SetControllerContextUser(_controller, adminUser, new[] { "Admin" });
    }

    [Fact]
    public async Task GetTransactions_ReturnsOkWithTransactions()
    {
        // Arrange
        DbContext.Set<FinanceTransaction>().Add(new FinanceTransaction { Id = Guid.NewGuid(), Description = "Trans 1", Amount = 1000, Type = FinanceTransactionType.Income, Date = DateTime.UtcNow });
        DbContext.Set<FinanceTransaction>().Add(new FinanceTransaction { Id = Guid.NewGuid(), Description = "Trans 2", Amount = 500, Type = FinanceTransactionType.Expense, Date = DateTime.UtcNow });
        await DbContext.SaveChangesAsync();

        // Act
        var result = await _controller.GetTransactions(null, null, null, null, null, 1) as OkObjectResult;

        // Assert
        Assert.NotNull(result);
        Assert.Equal(200, result.StatusCode);
        Assert.NotNull(result.Value);
    }
}
