using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CiviCore.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RestoreOrganizationHierarchy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrganizationPositions_AspNetUsers_UserId",
                table: "OrganizationPositions");

            migrationBuilder.DropColumn(
                name: "EndDate",
                table: "OrganizationPeriods");

            migrationBuilder.DropColumn(
                name: "StartDate",
                table: "OrganizationPeriods");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "OrganizationPositions",
                newName: "ResidentId");

            migrationBuilder.RenameIndex(
                name: "IX_OrganizationPositions_UserId",
                table: "OrganizationPositions",
                newName: "IX_OrganizationPositions_ResidentId");

            migrationBuilder.AddColumn<Guid>(
                name: "HouseholderId",
                table: "OrganizationPositions",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ParentId",
                table: "OrganizationPositions",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "EndYear",
                table: "OrganizationPeriods",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "StartYear",
                table: "OrganizationPeriods",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_OrganizationPositions_HouseholderId",
                table: "OrganizationPositions",
                column: "HouseholderId");

            migrationBuilder.CreateIndex(
                name: "IX_OrganizationPositions_ParentId",
                table: "OrganizationPositions",
                column: "ParentId");

            migrationBuilder.AddForeignKey(
                name: "FK_OrganizationPositions_Householders_HouseholderId",
                table: "OrganizationPositions",
                column: "HouseholderId",
                principalTable: "Householders",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_OrganizationPositions_OrganizationPositions_ParentId",
                table: "OrganizationPositions",
                column: "ParentId",
                principalTable: "OrganizationPositions",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_OrganizationPositions_Residents_ResidentId",
                table: "OrganizationPositions",
                column: "ResidentId",
                principalTable: "Residents",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrganizationPositions_Householders_HouseholderId",
                table: "OrganizationPositions");

            migrationBuilder.DropForeignKey(
                name: "FK_OrganizationPositions_OrganizationPositions_ParentId",
                table: "OrganizationPositions");

            migrationBuilder.DropForeignKey(
                name: "FK_OrganizationPositions_Residents_ResidentId",
                table: "OrganizationPositions");

            migrationBuilder.DropIndex(
                name: "IX_OrganizationPositions_HouseholderId",
                table: "OrganizationPositions");

            migrationBuilder.DropIndex(
                name: "IX_OrganizationPositions_ParentId",
                table: "OrganizationPositions");

            migrationBuilder.DropColumn(
                name: "HouseholderId",
                table: "OrganizationPositions");

            migrationBuilder.DropColumn(
                name: "ParentId",
                table: "OrganizationPositions");

            migrationBuilder.DropColumn(
                name: "EndYear",
                table: "OrganizationPeriods");

            migrationBuilder.DropColumn(
                name: "StartYear",
                table: "OrganizationPeriods");

            migrationBuilder.RenameColumn(
                name: "ResidentId",
                table: "OrganizationPositions",
                newName: "UserId");

            migrationBuilder.RenameIndex(
                name: "IX_OrganizationPositions_ResidentId",
                table: "OrganizationPositions",
                newName: "IX_OrganizationPositions_UserId");

            migrationBuilder.AddColumn<DateTime>(
                name: "EndDate",
                table: "OrganizationPeriods",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "StartDate",
                table: "OrganizationPeriods",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddForeignKey(
                name: "FK_OrganizationPositions_AspNetUsers_UserId",
                table: "OrganizationPositions",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }
    }
}
