using Microsoft.EntityFrameworkCore;
using CiviCore.Domain.Entities;

namespace CiviCore.Infrastructure.Data;

public class SecurityDbContext : DbContext
{
    public SecurityDbContext(DbContextOptions<SecurityDbContext> options) : base(options)
    {
    }

    public DbSet<GuestLog> GuestLogs { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<GuestLog>(e =>
        {
            e.HasKey(g => g.Id);
            e.HasIndex(g => g.CheckInAt);
            e.HasIndex(g => g.Status);
            e.HasIndex(g => g.LicensePlate);
            e.Property(g => g.GuestName).IsRequired().HasMaxLength(150);
            e.Property(g => g.VehicleType).HasMaxLength(50);
            e.Property(g => g.LicensePlate).HasMaxLength(30);
        });
    }
}
