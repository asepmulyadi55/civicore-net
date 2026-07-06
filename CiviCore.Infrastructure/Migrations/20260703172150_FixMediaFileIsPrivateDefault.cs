using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CiviCore.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixMediaFileIsPrivateDefault : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // All existing rows got IsPrivate=false from the prior migration's DEFAULT FALSE.
            // Fix: every file uploaded before this migration went through private storage.
            migrationBuilder.Sql(@"UPDATE ""MediaFiles"" SET ""IsPrivate"" = true;");

            // Exception: homepage/ and property/ files are stored in public-media (isPrivate=false)
            migrationBuilder.Sql(@"UPDATE ""MediaFiles"" SET ""IsPrivate"" = false WHERE ""FilePath"" LIKE 'homepage/%' OR ""FilePath"" LIKE 'property/%' OR ""FilePath"" LIKE 'properties/%';");

            // NavigationLinks timestamp updates (auto-generated, kept as-is)
            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 3, 17, 21, 49, 656, DateTimeKind.Utc).AddTicks(8577), new DateTime(2026, 7, 3, 17, 21, 49, 656, DateTimeKind.Utc).AddTicks(8580) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 3, 17, 21, 49, 656, DateTimeKind.Utc).AddTicks(8593), new DateTime(2026, 7, 3, 17, 21, 49, 656, DateTimeKind.Utc).AddTicks(8594) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 3, 17, 21, 49, 656, DateTimeKind.Utc).AddTicks(8607), new DateTime(2026, 7, 3, 17, 21, 49, 656, DateTimeKind.Utc).AddTicks(8607) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("44444444-4444-4444-4444-444444444444"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 3, 17, 21, 49, 656, DateTimeKind.Utc).AddTicks(8609), new DateTime(2026, 7, 3, 17, 21, 49, 656, DateTimeKind.Utc).AddTicks(8610) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("55555555-5555-5555-5555-555555555555"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 3, 17, 21, 49, 656, DateTimeKind.Utc).AddTicks(8612), new DateTime(2026, 7, 3, 17, 21, 49, 656, DateTimeKind.Utc).AddTicks(8613) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("66666666-6666-6666-6666-666666666666"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 3, 17, 21, 49, 656, DateTimeKind.Utc).AddTicks(8615), new DateTime(2026, 7, 3, 17, 21, 49, 656, DateTimeKind.Utc).AddTicks(8615) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
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
    }
}
