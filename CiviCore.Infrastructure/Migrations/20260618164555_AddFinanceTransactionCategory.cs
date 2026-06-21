using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CiviCore.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFinanceTransactionCategory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "FinanceTransactions",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Category",
                table: "FinanceTransactions");
        }
    }
}
