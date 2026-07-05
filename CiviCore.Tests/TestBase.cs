using CiviCore.Infrastructure.Data;
using CiviCore.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Moq;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using Microsoft.Extensions.Logging;

namespace CiviCore.Tests;

public abstract class TestBase : IDisposable
{
    protected readonly AppDbContext DbContext;
    protected readonly Mock<UserManager<ApplicationUser>> MockUserManager;
    protected readonly Mock<RoleManager<ApplicationRole>> MockRoleManager;
    protected readonly Mock<SignInManager<ApplicationUser>> MockSignInManager;
    protected readonly Mock<ILogger<TestBase>> MockLogger;

    protected TestBase()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        DbContext = new AppDbContext(options);

        // Setup Mock UserManager
        var userStore = new Mock<IUserStore<ApplicationUser>>();
        MockUserManager = new Mock<UserManager<ApplicationUser>>(userStore.Object, null, null, null, null, null, null, null, null);

        var roleStore = new Mock<IRoleStore<ApplicationRole>>();
        MockRoleManager = new Mock<RoleManager<ApplicationRole>>(roleStore.Object, null, null, null, null);

        var contextAccessor = new Mock<IHttpContextAccessor>();
        var claimsFactory = new Mock<IUserClaimsPrincipalFactory<ApplicationUser>>();
        MockSignInManager = new Mock<SignInManager<ApplicationUser>>(MockUserManager.Object, contextAccessor.Object, claimsFactory.Object, null, null, null, null);

        MockLogger = new Mock<ILogger<TestBase>>();
    }

    protected void SetControllerContextUser(Microsoft.AspNetCore.Mvc.ControllerBase controller, ApplicationUser user, string[]? roles = null)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.UserName ?? user.Email ?? ""),
            new Claim(ClaimTypes.Email, user.Email ?? "")
        };

        if (roles != null)
        {
            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }
        }

        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        var httpContext = new DefaultHttpContext { User = claimsPrincipal };
        controller.ControllerContext = new Microsoft.AspNetCore.Mvc.ControllerContext
        {
            HttpContext = httpContext
        };
    }

    public void Dispose()
    {
        DbContext.Database.EnsureDeleted();
        DbContext.Dispose();
    }
}
