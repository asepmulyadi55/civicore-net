using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CiviCore.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateUserDeleteBehavior : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_FinanceReports_AspNetUsers_CreatedById",
                table: "FinanceReports");

            migrationBuilder.DropForeignKey(
                name: "FK_Meetings_AspNetUsers_CreatedById",
                table: "Meetings");

            migrationBuilder.DropForeignKey(
                name: "FK_PaymentRecords_AspNetUsers_SubmittedById",
                table: "PaymentRecords");

            migrationBuilder.AlterColumn<Guid>(
                name: "CreatedById",
                table: "Meetings",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AlterColumn<Guid>(
                name: "CreatedById",
                table: "FinanceReports",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

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

            migrationBuilder.AddForeignKey(
                name: "FK_FinanceReports_AspNetUsers_CreatedById",
                table: "FinanceReports",
                column: "CreatedById",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Meetings_AspNetUsers_CreatedById",
                table: "Meetings",
                column: "CreatedById",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_PaymentRecords_AspNetUsers_SubmittedById",
                table: "PaymentRecords",
                column: "SubmittedById",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_FinanceReports_AspNetUsers_CreatedById",
                table: "FinanceReports");

            migrationBuilder.DropForeignKey(
                name: "FK_Meetings_AspNetUsers_CreatedById",
                table: "Meetings");

            migrationBuilder.DropForeignKey(
                name: "FK_PaymentRecords_AspNetUsers_SubmittedById",
                table: "PaymentRecords");

            migrationBuilder.AlterColumn<Guid>(
                name: "CreatedById",
                table: "Meetings",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "CreatedById",
                table: "FinanceReports",
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
                values: new object[] { new DateTime(2026, 7, 3, 17, 33, 28, 19, DateTimeKind.Utc).AddTicks(2688), new DateTime(2026, 7, 3, 17, 33, 28, 19, DateTimeKind.Utc).AddTicks(2697) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 3, 17, 33, 28, 19, DateTimeKind.Utc).AddTicks(2710), new DateTime(2026, 7, 3, 17, 33, 28, 19, DateTimeKind.Utc).AddTicks(2710) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 3, 17, 33, 28, 19, DateTimeKind.Utc).AddTicks(2713), new DateTime(2026, 7, 3, 17, 33, 28, 19, DateTimeKind.Utc).AddTicks(2713) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("44444444-4444-4444-4444-444444444444"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 3, 17, 33, 28, 19, DateTimeKind.Utc).AddTicks(2726), new DateTime(2026, 7, 3, 17, 33, 28, 19, DateTimeKind.Utc).AddTicks(2726) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("55555555-5555-5555-5555-555555555555"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 3, 17, 33, 28, 19, DateTimeKind.Utc).AddTicks(2729), new DateTime(2026, 7, 3, 17, 33, 28, 19, DateTimeKind.Utc).AddTicks(2729) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("66666666-6666-6666-6666-666666666666"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 3, 17, 33, 28, 19, DateTimeKind.Utc).AddTicks(2732), new DateTime(2026, 7, 3, 17, 33, 28, 19, DateTimeKind.Utc).AddTicks(2732) });

            migrationBuilder.AddForeignKey(
                name: "FK_FinanceReports_AspNetUsers_CreatedById",
                table: "FinanceReports",
                column: "CreatedById",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Meetings_AspNetUsers_CreatedById",
                table: "Meetings",
                column: "CreatedById",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PaymentRecords_AspNetUsers_SubmittedById",
                table: "PaymentRecords",
                column: "SubmittedById",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
