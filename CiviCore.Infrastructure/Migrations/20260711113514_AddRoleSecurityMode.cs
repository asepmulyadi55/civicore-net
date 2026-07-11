using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CiviCore.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRoleSecurityMode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SecurityMode",
                table: "AspNetRoles",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 11, 11, 35, 13, 140, DateTimeKind.Utc).AddTicks(6407), new DateTime(2026, 7, 11, 11, 35, 13, 140, DateTimeKind.Utc).AddTicks(6411) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 11, 11, 35, 13, 140, DateTimeKind.Utc).AddTicks(6423), new DateTime(2026, 7, 11, 11, 35, 13, 140, DateTimeKind.Utc).AddTicks(6424) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 11, 11, 35, 13, 140, DateTimeKind.Utc).AddTicks(6427), new DateTime(2026, 7, 11, 11, 35, 13, 140, DateTimeKind.Utc).AddTicks(6427) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("44444444-4444-4444-4444-444444444444"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 11, 11, 35, 13, 140, DateTimeKind.Utc).AddTicks(6444), new DateTime(2026, 7, 11, 11, 35, 13, 140, DateTimeKind.Utc).AddTicks(6444) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("55555555-5555-5555-5555-555555555555"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 11, 11, 35, 13, 140, DateTimeKind.Utc).AddTicks(6447), new DateTime(2026, 7, 11, 11, 35, 13, 140, DateTimeKind.Utc).AddTicks(6448) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("66666666-6666-6666-6666-666666666666"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 11, 11, 35, 13, 140, DateTimeKind.Utc).AddTicks(6451), new DateTime(2026, 7, 11, 11, 35, 13, 140, DateTimeKind.Utc).AddTicks(6452) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SecurityMode",
                table: "AspNetRoles");

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 11, 2, 39, 59, 923, DateTimeKind.Utc).AddTicks(4822), new DateTime(2026, 7, 11, 2, 39, 59, 923, DateTimeKind.Utc).AddTicks(4825) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 11, 2, 39, 59, 923, DateTimeKind.Utc).AddTicks(4841), new DateTime(2026, 7, 11, 2, 39, 59, 923, DateTimeKind.Utc).AddTicks(4842) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 11, 2, 39, 59, 923, DateTimeKind.Utc).AddTicks(4846), new DateTime(2026, 7, 11, 2, 39, 59, 923, DateTimeKind.Utc).AddTicks(4846) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("44444444-4444-4444-4444-444444444444"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 11, 2, 39, 59, 923, DateTimeKind.Utc).AddTicks(4850), new DateTime(2026, 7, 11, 2, 39, 59, 923, DateTimeKind.Utc).AddTicks(4850) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("55555555-5555-5555-5555-555555555555"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 11, 2, 39, 59, 923, DateTimeKind.Utc).AddTicks(4853), new DateTime(2026, 7, 11, 2, 39, 59, 923, DateTimeKind.Utc).AddTicks(4854) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("66666666-6666-6666-6666-666666666666"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 11, 2, 39, 59, 923, DateTimeKind.Utc).AddTicks(4872), new DateTime(2026, 7, 11, 2, 39, 59, 923, DateTimeKind.Utc).AddTicks(4872) });
        }
    }
}
