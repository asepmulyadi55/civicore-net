using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CiviCore.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddResidentFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "BirthDate",
                table: "Residents",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Education",
                table: "Residents",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Gender",
                table: "Residents",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Occupation",
                table: "Residents",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BirthDate",
                table: "Residents");

            migrationBuilder.DropColumn(
                name: "Education",
                table: "Residents");

            migrationBuilder.DropColumn(
                name: "Gender",
                table: "Residents");

            migrationBuilder.DropColumn(
                name: "Occupation",
                table: "Residents");
        }
    }
}
