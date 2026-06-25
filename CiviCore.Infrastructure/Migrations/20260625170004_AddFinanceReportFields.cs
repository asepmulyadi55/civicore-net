using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CiviCore.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFinanceReportFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:Enum:finance_report_status", "draft,pending,approved,rejected")
                .Annotation("Npgsql:Enum:finance_transaction_type", "income,expense")
                .Annotation("Npgsql:Enum:house_status", "owner_occupied,rented,vacant,public_facility,developer")
                .Annotation("Npgsql:Enum:payment_status", "unpaid,pending,approved,rejected")
                .OldAnnotation("Npgsql:Enum:finance_report_status", "pending,approved,rejected")
                .OldAnnotation("Npgsql:Enum:finance_transaction_type", "income,expense")
                .OldAnnotation("Npgsql:Enum:house_status", "owner_occupied,rented,vacant,public_facility,developer")
                .OldAnnotation("Npgsql:Enum:payment_status", "unpaid,pending,approved,rejected");

            migrationBuilder.AddColumn<decimal>(
                name: "ClosingBalance",
                table: "FinanceReports",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "OpeningBalance",
                table: "FinanceReports",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "TotalExpense",
                table: "FinanceReports",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "TotalIncome",
                table: "FinanceReports",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ClosingBalance",
                table: "FinanceReports");

            migrationBuilder.DropColumn(
                name: "OpeningBalance",
                table: "FinanceReports");

            migrationBuilder.DropColumn(
                name: "TotalExpense",
                table: "FinanceReports");

            migrationBuilder.DropColumn(
                name: "TotalIncome",
                table: "FinanceReports");

            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:Enum:finance_report_status", "pending,approved,rejected")
                .Annotation("Npgsql:Enum:finance_transaction_type", "income,expense")
                .Annotation("Npgsql:Enum:house_status", "owner_occupied,rented,vacant,public_facility,developer")
                .Annotation("Npgsql:Enum:payment_status", "unpaid,pending,approved,rejected")
                .OldAnnotation("Npgsql:Enum:finance_report_status", "draft,pending,approved,rejected")
                .OldAnnotation("Npgsql:Enum:finance_transaction_type", "income,expense")
                .OldAnnotation("Npgsql:Enum:house_status", "owner_occupied,rented,vacant,public_facility,developer")
                .OldAnnotation("Npgsql:Enum:payment_status", "unpaid,pending,approved,rejected");
        }
    }
}
