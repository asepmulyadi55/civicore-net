using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CiviCore.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFeeHistoryNotes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "FeeHistories",
                type: "text",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 2, 4, 30, 32, 425, DateTimeKind.Utc).AddTicks(7710), new DateTime(2026, 7, 2, 4, 30, 32, 425, DateTimeKind.Utc).AddTicks(7714) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 2, 4, 30, 32, 425, DateTimeKind.Utc).AddTicks(7731), new DateTime(2026, 7, 2, 4, 30, 32, 425, DateTimeKind.Utc).AddTicks(7732) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 2, 4, 30, 32, 425, DateTimeKind.Utc).AddTicks(7742), new DateTime(2026, 7, 2, 4, 30, 32, 425, DateTimeKind.Utc).AddTicks(7742) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("44444444-4444-4444-4444-444444444444"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 2, 4, 30, 32, 425, DateTimeKind.Utc).AddTicks(7744), new DateTime(2026, 7, 2, 4, 30, 32, 425, DateTimeKind.Utc).AddTicks(7745) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("55555555-5555-5555-5555-555555555555"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 2, 4, 30, 32, 425, DateTimeKind.Utc).AddTicks(7747), new DateTime(2026, 7, 2, 4, 30, 32, 425, DateTimeKind.Utc).AddTicks(7747) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("66666666-6666-6666-6666-666666666666"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 2, 4, 30, 32, 425, DateTimeKind.Utc).AddTicks(7749), new DateTime(2026, 7, 2, 4, 30, 32, 425, DateTimeKind.Utc).AddTicks(7749) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Notes",
                table: "FeeHistories");

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 1, 6, 53, 26, 616, DateTimeKind.Utc).AddTicks(235), new DateTime(2026, 7, 1, 6, 53, 26, 616, DateTimeKind.Utc).AddTicks(241) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 1, 6, 53, 26, 616, DateTimeKind.Utc).AddTicks(268), new DateTime(2026, 7, 1, 6, 53, 26, 616, DateTimeKind.Utc).AddTicks(268) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 1, 6, 53, 26, 616, DateTimeKind.Utc).AddTicks(273), new DateTime(2026, 7, 1, 6, 53, 26, 616, DateTimeKind.Utc).AddTicks(274) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("44444444-4444-4444-4444-444444444444"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 1, 6, 53, 26, 616, DateTimeKind.Utc).AddTicks(278), new DateTime(2026, 7, 1, 6, 53, 26, 616, DateTimeKind.Utc).AddTicks(278) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("55555555-5555-5555-5555-555555555555"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 1, 6, 53, 26, 616, DateTimeKind.Utc).AddTicks(283), new DateTime(2026, 7, 1, 6, 53, 26, 616, DateTimeKind.Utc).AddTicks(283) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("66666666-6666-6666-6666-666666666666"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 1, 6, 53, 26, 616, DateTimeKind.Utc).AddTicks(286), new DateTime(2026, 7, 1, 6, 53, 26, 616, DateTimeKind.Utc).AddTicks(287) });
        }
    }
}
