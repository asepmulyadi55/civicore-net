using CiviCore.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace CiviCore.Infrastructure.Data;

public static class DataSeeder
{
    public static async Task SeedDataAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<ApplicationRole>>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // We do NOT call MigrateAsync() automatically here so the user has control over running migrations manually.
        
        // Seed Roles
        var roles = new[] { "admin", "treasurer", "coordinator", "resident" };
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new ApplicationRole { Name = role, Style = "default" });
            }
        }

        // Seed Admin User
        var adminEmail = "admin@civicore.com";
        var adminUser = await userManager.FindByEmailAsync(adminEmail);
        if (adminUser == null)
        {
            var admin = new ApplicationUser
            {
                UserName = "Admin",
                Email = adminEmail,
                Name = "Admin",
                IsActive = true,
                EmailConfirmed = true
            };
            
            var result = await userManager.CreateAsync(admin, "Bandung@123");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(admin, "admin");
            }
        }

        // Seed Payment Methods
        if (!await dbContext.PaymentMethods.AnyAsync())
        {
            dbContext.PaymentMethods.AddRange(
                new PaymentMethod { Name = "Cash", Description = "Pembayaran Tunai", IsActive = true },
                new PaymentMethod { Name = "Bank Transfer", Description = "Transfer Bank", IsActive = true }
            );
            await dbContext.SaveChangesAsync();
        }

        // Seed Settings
        if (!await dbContext.Settings.AnyAsync(s => s.Key == "pagination_limit"))
        {
            dbContext.Settings.Add(new Setting { Key = "pagination_limit", Value = "20" });
            await dbContext.SaveChangesAsync();
        }
    }
}
