using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CiviCore.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class PreservePaymentHistoryOnHouseholderDelete : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_FeeHistories_Householders_HouseholderId",
                table: "FeeHistories");

            migrationBuilder.DropForeignKey(
                name: "FK_PaymentRecords_Householders_HouseholderId",
                table: "PaymentRecords");

            migrationBuilder.AlterColumn<Guid>(
                name: "HouseholderId",
                table: "PaymentRecords",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AlterColumn<Guid>(
                name: "HouseholderId",
                table: "FeeHistories",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<string>(
                name: "HouseholderName",
                table: "FeeHistories",
                type: "text",
                nullable: true);

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

            migrationBuilder.AddForeignKey(
                name: "FK_FeeHistories_Householders_HouseholderId",
                table: "FeeHistories",
                column: "HouseholderId",
                principalTable: "Householders",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_PaymentRecords_Householders_HouseholderId",
                table: "PaymentRecords",
                column: "HouseholderId",
                principalTable: "Householders",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_FeeHistories_Householders_HouseholderId",
                table: "FeeHistories");

            migrationBuilder.DropForeignKey(
                name: "FK_PaymentRecords_Householders_HouseholderId",
                table: "PaymentRecords");

            migrationBuilder.DropColumn(
                name: "HouseholderName",
                table: "FeeHistories");

            migrationBuilder.AlterColumn<Guid>(
                name: "HouseholderId",
                table: "PaymentRecords",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "HouseholderId",
                table: "FeeHistories",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

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

            migrationBuilder.AddForeignKey(
                name: "FK_FeeHistories_Householders_HouseholderId",
                table: "FeeHistories",
                column: "HouseholderId",
                principalTable: "Householders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_PaymentRecords_Householders_HouseholderId",
                table: "PaymentRecords",
                column: "HouseholderId",
                principalTable: "Householders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
