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

public class MediaControllerTests : TestBase
{
    private readonly MediaController _controller;
    private readonly Mock<ILocalStorageService> _mockStorageService;
    private readonly IConfiguration _configuration;

    public MediaControllerTests()
    {
        _mockStorageService = new Mock<ILocalStorageService>();
        
        var myConfiguration = new System.Collections.Generic.Dictionary<string, string>
        {
            {"AppUrl", "http://localhost"}
        };
        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(myConfiguration)
            .Build();

        _controller = new MediaController(_mockStorageService.Object, _configuration, DbContext);
        
        var adminUser = new ApplicationUser { Id = Guid.NewGuid(), UserName = "admin", Email = "admin@test.com" };
        SetControllerContextUser(_controller, adminUser, new[] { "Admin" });
    }

    [Fact]
    public async Task GetAll_ReturnsOkWithMedia()
    {
        // Arrange
        DbContext.Set<MediaFile>().Add(new MediaFile { Id = Guid.NewGuid(), FileName = "test.png", FilePath = "/uploads/test.png", FileSize = 1024, MimeType = "image/png" });
        await DbContext.SaveChangesAsync();

        // Act
        var result = await _controller.GetAll(null) as OkObjectResult;

        // Assert
        Assert.NotNull(result);
        Assert.Equal(200, result.StatusCode);
        Assert.NotNull(result.Value);
    }
}
