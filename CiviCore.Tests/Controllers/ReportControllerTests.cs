using CiviCore.Api.Controllers;
using CiviCore.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Xunit;
using System.Threading.Tasks;
using System;

namespace CiviCore.Tests.Controllers;

public class ReportControllerTests : TestBase
{
    private readonly ReportController _controller;

    public ReportControllerTests()
    {
        _controller = new ReportController(DbContext);
        
        var adminUser = new ApplicationUser { Id = Guid.NewGuid(), UserName = "admin", Email = "admin@test.com" };
        SetControllerContextUser(_controller, adminUser, new[] { "Admin" });
    }

    [Fact]
    public async Task GetAll_ReturnsOkWithReports()
    {
        // Arrange
        DbContext.Set<FinanceReport>().Add(new FinanceReport { Id = Guid.NewGuid(), PeriodStart = new DateTime(2024, 5, 1, 0, 0, 0, DateTimeKind.Utc), PeriodEnd = new DateTime(2024, 5, 31, 0, 0, 0, DateTimeKind.Utc), OpeningBalance = 0, ClosingBalance = 1000, TotalIncome = 1000, TotalExpense = 0, Status = CiviCore.Domain.Enums.FinanceReportStatus.Pending });
        await DbContext.SaveChangesAsync();

        // Act
        var result = await _controller.GetAll(null, null, null, 1) as OkObjectResult;

        // Assert
        Assert.NotNull(result);
        Assert.Equal(200, result.StatusCode);
        Assert.NotNull(result.Value);
    }
}
