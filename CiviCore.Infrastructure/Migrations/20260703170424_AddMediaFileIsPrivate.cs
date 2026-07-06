using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CiviCore.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMediaFileIsPrivate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsPrivate",
                table: "MediaFiles",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 3, 17, 4, 23, 959, DateTimeKind.Utc).AddTicks(1017), new DateTime(2026, 7, 3, 17, 4, 23, 959, DateTimeKind.Utc).AddTicks(1021) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 3, 17, 4, 23, 959, DateTimeKind.Utc).AddTicks(1047), new DateTime(2026, 7, 3, 17, 4, 23, 959, DateTimeKind.Utc).AddTicks(1048) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 3, 17, 4, 23, 959, DateTimeKind.Utc).AddTicks(1051), new DateTime(2026, 7, 3, 17, 4, 23, 959, DateTimeKind.Utc).AddTicks(1051) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("44444444-4444-4444-4444-444444444444"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 3, 17, 4, 23, 959, DateTimeKind.Utc).AddTicks(1054), new DateTime(2026, 7, 3, 17, 4, 23, 959, DateTimeKind.Utc).AddTicks(1055) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("55555555-5555-5555-5555-555555555555"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 3, 17, 4, 23, 959, DateTimeKind.Utc).AddTicks(1059), new DateTime(2026, 7, 3, 17, 4, 23, 959, DateTimeKind.Utc).AddTicks(1059) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("66666666-6666-6666-6666-666666666666"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 3, 17, 4, 23, 959, DateTimeKind.Utc).AddTicks(1062), new DateTime(2026, 7, 3, 17, 4, 23, 959, DateTimeKind.Utc).AddTicks(1063) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsPrivate",
                table: "MediaFiles");

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 2, 10, 41, 15, 4, DateTimeKind.Utc).AddTicks(8547), new DateTime(2026, 7, 2, 10, 41, 15, 4, DateTimeKind.Utc).AddTicks(8551) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 2, 10, 41, 15, 4, DateTimeKind.Utc).AddTicks(8563), new DateTime(2026, 7, 2, 10, 41, 15, 4, DateTimeKind.Utc).AddTicks(8564) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 2, 10, 41, 15, 4, DateTimeKind.Utc).AddTicks(8566), new DateTime(2026, 7, 2, 10, 41, 15, 4, DateTimeKind.Utc).AddTicks(8567) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("44444444-4444-4444-4444-444444444444"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 2, 10, 41, 15, 4, DateTimeKind.Utc).AddTicks(8569), new DateTime(2026, 7, 2, 10, 41, 15, 4, DateTimeKind.Utc).AddTicks(8569) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("55555555-5555-5555-5555-555555555555"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 2, 10, 41, 15, 4, DateTimeKind.Utc).AddTicks(8571), new DateTime(2026, 7, 2, 10, 41, 15, 4, DateTimeKind.Utc).AddTicks(8571) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("66666666-6666-6666-6666-666666666666"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 2, 10, 41, 15, 4, DateTimeKind.Utc).AddTicks(8573), new DateTime(2026, 7, 2, 10, 41, 15, 4, DateTimeKind.Utc).AddTicks(8573) });
        }
    }
}
