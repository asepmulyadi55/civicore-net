using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace CiviCore.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddNavigationLinks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "NavigationLinks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Url = table.Column<string>(type: "text", nullable: false),
                    ShowInNavigation = table.Column<bool>(type: "boolean", nullable: false),
                    ShowInFooter = table.Column<bool>(type: "boolean", nullable: false),
                    Order = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NavigationLinks", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "NavigationLinks",
                columns: new[] { "Id", "CreatedAt", "Order", "ShowInFooter", "ShowInNavigation", "Title", "UpdatedAt", "Url" },
                values: new object[,]
                {
                    { new Guid("11111111-1111-1111-1111-111111111111"), new DateTime(2026, 7, 1, 6, 53, 26, 616, DateTimeKind.Utc).AddTicks(235), 1, true, true, "Home", new DateTime(2026, 7, 1, 6, 53, 26, 616, DateTimeKind.Utc).AddTicks(241), "/" },
                    { new Guid("22222222-2222-2222-2222-222222222222"), new DateTime(2026, 7, 1, 6, 53, 26, 616, DateTimeKind.Utc).AddTicks(268), 2, true, true, "Properties", new DateTime(2026, 7, 1, 6, 53, 26, 616, DateTimeKind.Utc).AddTicks(268), "/#properties" },
                    { new Guid("33333333-3333-3333-3333-333333333333"), new DateTime(2026, 7, 1, 6, 53, 26, 616, DateTimeKind.Utc).AddTicks(273), 3, true, true, "Events", new DateTime(2026, 7, 1, 6, 53, 26, 616, DateTimeKind.Utc).AddTicks(274), "/#events" },
                    { new Guid("44444444-4444-4444-4444-444444444444"), new DateTime(2026, 7, 1, 6, 53, 26, 616, DateTimeKind.Utc).AddTicks(278), 4, true, true, "Gallery", new DateTime(2026, 7, 1, 6, 53, 26, 616, DateTimeKind.Utc).AddTicks(278), "/#gallery" },
                    { new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2026, 7, 1, 6, 53, 26, 616, DateTimeKind.Utc).AddTicks(283), 5, true, true, "Bulletins", new DateTime(2026, 7, 1, 6, 53, 26, 616, DateTimeKind.Utc).AddTicks(283), "/#bulletins" },
                    { new Guid("66666666-6666-6666-6666-666666666666"), new DateTime(2026, 7, 1, 6, 53, 26, 616, DateTimeKind.Utc).AddTicks(286), 6, true, true, "Contact", new DateTime(2026, 7, 1, 6, 53, 26, 616, DateTimeKind.Utc).AddTicks(287), "#contact" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "NavigationLinks");
        }
    }
}
