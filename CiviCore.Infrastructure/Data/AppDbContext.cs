using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using CiviCore.Domain.Entities;

namespace CiviCore.Infrastructure.Data;

public class AppDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, Guid>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Permission> Permissions { get; set; } = null!;
    public DbSet<Block> Blocks { get; set; } = null!;
    public DbSet<BlockCoordinator> BlockCoordinators { get; set; } = null!;
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
    public DbSet<NavigationLink> NavigationLinks { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Define Postgres Enums
        builder.HasPostgresEnum<CiviCore.Domain.Enums.HouseStatus>();
        builder.HasPostgresEnum<CiviCore.Domain.Enums.PaymentStatus>();
        builder.HasPostgresEnum<CiviCore.Domain.Enums.FinanceReportStatus>();
        builder.HasPostgresEnum<CiviCore.Domain.Enums.FinanceTransactionType>();

        // BlockCoordinator mappings
        builder.Entity<BlockCoordinator>()
            .HasOne(bc => bc.Block)
            .WithMany(b => b.Coordinators)
            .HasForeignKey(bc => bc.BlockId);
            
        builder.Entity<BlockCoordinator>()
            .HasOne(bc => bc.Resident)
            .WithMany()
            .HasForeignKey(bc => bc.ResidentId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<BlockCoordinator>()
            .HasOne(bc => bc.Householder)
            .WithMany()
            .HasForeignKey(bc => bc.HouseholderId)
            .OnDelete(DeleteBehavior.SetNull);

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

        // OrganizationPosition Hierarchy
        builder.Entity<OrganizationPosition>()
            .HasOne(op => op.Parent)
            .WithMany(op => op.Children)
            .HasForeignKey(op => op.ParentId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<OrganizationPosition>()
            .HasOne(op => op.Resident)
            .WithMany()
            .HasForeignKey(op => op.ResidentId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<OrganizationPosition>()
            .HasOne(op => op.Householder)
            .WithMany()
            .HasForeignKey(op => op.HouseholderId)
            .OnDelete(DeleteBehavior.SetNull);

        // MeetingAttendance Mappings
        builder.Entity<MeetingAttendance>()
            .HasOne(ma => ma.Resident)
            .WithMany()
            .HasForeignKey(ma => ma.ResidentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<MeetingAttendance>()
            .HasOne(ma => ma.Householder)
            .WithMany()
            .HasForeignKey(ma => ma.HouseholderId)
            .OnDelete(DeleteBehavior.Cascade);

        // Seed Navigation Links
        builder.Entity<NavigationLink>().HasData(
            new NavigationLink { Id = Guid.Parse("11111111-1111-1111-1111-111111111111"), Title = "Home", Url = "/", Order = 1, ShowInNavigation = true, ShowInFooter = true },
            new NavigationLink { Id = Guid.Parse("22222222-2222-2222-2222-222222222222"), Title = "Properties", Url = "/#properties", Order = 2, ShowInNavigation = true, ShowInFooter = true },
            new NavigationLink { Id = Guid.Parse("33333333-3333-3333-3333-333333333333"), Title = "Events", Url = "/#events", Order = 3, ShowInNavigation = true, ShowInFooter = true },
            new NavigationLink { Id = Guid.Parse("44444444-4444-4444-4444-444444444444"), Title = "Gallery", Url = "/#gallery", Order = 4, ShowInNavigation = true, ShowInFooter = true },
            new NavigationLink { Id = Guid.Parse("55555555-5555-5555-5555-555555555555"), Title = "Bulletins", Url = "/#bulletins", Order = 5, ShowInNavigation = true, ShowInFooter = true },
            new NavigationLink { Id = Guid.Parse("66666666-6666-6666-6666-666666666666"), Title = "Contact", Url = "#contact", Order = 6, ShowInNavigation = true, ShowInFooter = true }
        );
    }
}
