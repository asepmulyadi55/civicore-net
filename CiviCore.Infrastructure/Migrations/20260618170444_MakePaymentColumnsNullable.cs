using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CiviCore.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class MakePaymentColumnsNullable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PaymentRecords_PaymentMethods_PaymentMethodId",
                table: "PaymentRecords");

            migrationBuilder.AlterColumn<Guid>(
                name: "SubmittedById",
                table: "PaymentRecords",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AlterColumn<Guid>(
                name: "PaymentMethodId",
                table: "PaymentRecords",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddForeignKey(
                name: "FK_PaymentRecords_PaymentMethods_PaymentMethodId",
                table: "PaymentRecords",
                column: "PaymentMethodId",
                principalTable: "PaymentMethods",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PaymentRecords_PaymentMethods_PaymentMethodId",
                table: "PaymentRecords");

            migrationBuilder.AlterColumn<Guid>(
                name: "SubmittedById",
                table: "PaymentRecords",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "PaymentMethodId",
                table: "PaymentRecords",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_PaymentRecords_PaymentMethods_PaymentMethodId",
                table: "PaymentRecords",
                column: "PaymentMethodId",
                principalTable: "PaymentMethods",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
