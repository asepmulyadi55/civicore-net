using CiviCore.Api.Controllers;
using CiviCore.Api.Services;
using CiviCore.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Xunit;
using System.Threading.Tasks;
using System;
using Moq;

namespace CiviCore.Tests.Controllers;

public class MeetingControllerTests : TestBase
{
    private readonly MeetingController _controller;
    private readonly Mock<ILocalStorageService> _mockStorageService;
    private readonly IConfiguration _configuration;

    public MeetingControllerTests()
    {
        _mockStorageService = new Mock<ILocalStorageService>();
        
        var myConfiguration = new System.Collections.Generic.Dictionary<string, string?>
        {
            {"AppUrl", "http://localhost"}
        };
        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(myConfiguration)
            .Build();

        _controller = new MeetingController(DbContext, _mockStorageService.Object, _configuration);
        
        var adminUser = new ApplicationUser { Id = Guid.NewGuid(), UserName = "admin", Email = "admin@test.com" };
        SetControllerContextUser(_controller, adminUser, new[] { "Admin" });
    }

    [Fact]
    public async Task GetAll_ReturnsOkWithMeetings()
    {
        // Arrange
        DbContext.Set<Meeting>().Add(new Meeting { Id = Guid.NewGuid(), Title = "Monthly Meeting", Date = DateTime.UtcNow, Location = "Hall" });
        await DbContext.SaveChangesAsync();

        // Act
        var result = await _controller.GetAll(null, null, 1) as OkObjectResult;

        // Assert
        Assert.NotNull(result);
        Assert.Equal(200, result.StatusCode);
        Assert.NotNull(result.Value);
    }
}
