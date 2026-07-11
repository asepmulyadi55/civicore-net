using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CiviCore.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFormSubmissions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FormSubmissions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<string>(type: "text", nullable: false),
                    Data = table.Column<string>(type: "text", nullable: false),
                    IsRead = table.Column<bool>(type: "boolean", nullable: false),
                    SubmittedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FormSubmissions", x => x.Id);
                });

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FormSubmissions");

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 7, 7, 20, 19, 299, DateTimeKind.Utc).AddTicks(5742), new DateTime(2026, 7, 7, 7, 20, 19, 299, DateTimeKind.Utc).AddTicks(5745) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 7, 7, 20, 19, 299, DateTimeKind.Utc).AddTicks(5758), new DateTime(2026, 7, 7, 7, 20, 19, 299, DateTimeKind.Utc).AddTicks(5758) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 7, 7, 20, 19, 299, DateTimeKind.Utc).AddTicks(5760), new DateTime(2026, 7, 7, 7, 20, 19, 299, DateTimeKind.Utc).AddTicks(5760) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("44444444-4444-4444-4444-444444444444"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 7, 7, 20, 19, 299, DateTimeKind.Utc).AddTicks(5762), new DateTime(2026, 7, 7, 7, 20, 19, 299, DateTimeKind.Utc).AddTicks(5762) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("55555555-5555-5555-5555-555555555555"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 7, 7, 20, 19, 299, DateTimeKind.Utc).AddTicks(5765), new DateTime(2026, 7, 7, 7, 20, 19, 299, DateTimeKind.Utc).AddTicks(5765) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("66666666-6666-6666-6666-666666666666"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 7, 7, 20, 19, 299, DateTimeKind.Utc).AddTicks(5767), new DateTime(2026, 7, 7, 7, 20, 19, 299, DateTimeKind.Utc).AddTicks(5767) });
        }
    }
}
