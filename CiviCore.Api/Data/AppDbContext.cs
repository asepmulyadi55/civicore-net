using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using CiviCore.Api.Models;

namespace CiviCore.Api.Data;

public class AppDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, Guid>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Permission> Permissions { get; set; } = null!;
    public DbSet<Block> Blocks { get; set; } = null!;
    public DbSet<BlockUser> BlockUsers { get; set; } = null!;
    public DbSet<Unit> Units { get; set; } = null!;
    public DbSet<Householder> Householders { get; set; } = null!;
    public DbSet<Resident> Residents { get; set; } = null!;
    public DbSet<PaymentMethod> PaymentMethods { get; set; } = null!;
    public DbSet<PaymentRecord> PaymentRecords { get; set; } = null!;
    public DbSet<FeeHistory> FeeHistories { get; set; } = null!;
    public DbSet<Setting> Settings { get; set; } = null!;
    public DbSet<MediaFile> MediaFiles { get; set; } = null!;
    public DbSet<FinanceTransaction> FinanceTransactions { get; set; } = null!;
    public DbSet<FinanceReport> FinanceReports { get; set; } = null!;
    public DbSet<OrganizationPeriod> OrganizationPeriods { get; set; } = null!;
    public DbSet<OrganizationPosition> OrganizationPositions { get; set; } = null!;
    public DbSet<Meeting> Meetings { get; set; } = null!;
    public DbSet<MeetingAttendance> MeetingAttendances { get; set; } = null!;
    public DbSet<MeetingImage> MeetingImages { get; set; } = null!;
    public DbSet<PropertyListing> PropertyListings { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Define Postgres Enums
        builder.HasPostgresEnum<CiviCore.Core.Enums.HouseStatus>();
        builder.HasPostgresEnum<CiviCore.Core.Enums.PaymentStatus>();
        builder.HasPostgresEnum<CiviCore.Core.Enums.FinanceReportStatus>();
        builder.HasPostgresEnum<CiviCore.Core.Enums.FinanceTransactionType>();

        // BlockUser Pivot
        builder.Entity<BlockUser>()
            .HasKey(bu => new { bu.BlockId, bu.UserId });
            
        builder.Entity<BlockUser>()
            .HasOne(bu => bu.Block)
            .WithMany(b => b.BlockUsers)
            .HasForeignKey(bu => bu.BlockId);
            
        builder.Entity<BlockUser>()
            .HasOne(bu => bu.User)
            .WithMany(u => u.BlockUsers)
            .HasForeignKey(bu => bu.UserId);

        // Setting Key unique
        builder.Entity<Setting>()
            .HasIndex(s => s.Key)
            .IsUnique();

        // PaymentRecord approvals
        builder.Entity<PaymentRecord>()
            .HasOne(p => p.SubmittedBy)
            .WithMany()
            .HasForeignKey(p => p.SubmittedById)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<PaymentRecord>()
            .HasOne(p => p.ApprovedBy)
            .WithMany()
            .HasForeignKey(p => p.ApprovedById)
            .OnDelete(DeleteBehavior.SetNull);
            
        // FinanceReport
        builder.Entity<FinanceReport>()
            .HasOne(f => f.CreatedBy)
            .WithMany()
            .HasForeignKey(f => f.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);
            
        // Meeting
        builder.Entity<Meeting>()
            .HasOne(m => m.CreatedBy)
            .WithMany()
            .HasForeignKey(m => m.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
