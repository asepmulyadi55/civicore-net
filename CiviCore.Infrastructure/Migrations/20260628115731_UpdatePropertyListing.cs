using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CiviCore.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdatePropertyListing : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PropertyListings_Units_UnitId",
                table: "PropertyListings");

            migrationBuilder.RenameColumn(
                name: "ListingType",
                table: "PropertyListings",
                newName: "Type");

            migrationBuilder.AlterColumn<Guid>(
                name: "UnitId",
                table: "PropertyListings",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "PropertyListings",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<int>(
                name: "Bathrooms",
                table: "PropertyListings",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Bedrooms",
                table: "PropertyListings",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "BlockId",
                table: "PropertyListings",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "BuildingArea",
                table: "PropertyListings",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContactName",
                table: "PropertyListings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContactPhone",
                table: "PropertyListings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedById",
                table: "PropertyListings",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "LandArea",
                table: "PropertyListings",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LocationLabel",
                table: "PropertyListings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "PropertyListings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_PropertyListings_BlockId",
                table: "PropertyListings",
                column: "BlockId");

            migrationBuilder.CreateIndex(
                name: "IX_PropertyListings_CreatedById",
                table: "PropertyListings",
                column: "CreatedById");

            migrationBuilder.AddForeignKey(
                name: "FK_PropertyListings_AspNetUsers_CreatedById",
                table: "PropertyListings",
                column: "CreatedById",
                principalTable: "AspNetUsers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_PropertyListings_Blocks_BlockId",
                table: "PropertyListings",
                column: "BlockId",
                principalTable: "Blocks",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_PropertyListings_Units_UnitId",
                table: "PropertyListings",
                column: "UnitId",
                principalTable: "Units",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PropertyListings_AspNetUsers_CreatedById",
                table: "PropertyListings");

            migrationBuilder.DropForeignKey(
                name: "FK_PropertyListings_Blocks_BlockId",
                table: "PropertyListings");

            migrationBuilder.DropForeignKey(
                name: "FK_PropertyListings_Units_UnitId",
                table: "PropertyListings");

            migrationBuilder.DropIndex(
                name: "IX_PropertyListings_BlockId",
                table: "PropertyListings");

            migrationBuilder.DropIndex(
                name: "IX_PropertyListings_CreatedById",
                table: "PropertyListings");

            migrationBuilder.DropColumn(
                name: "Bathrooms",
                table: "PropertyListings");

            migrationBuilder.DropColumn(
                name: "Bedrooms",
                table: "PropertyListings");

            migrationBuilder.DropColumn(
                name: "BlockId",
                table: "PropertyListings");

            migrationBuilder.DropColumn(
                name: "BuildingArea",
                table: "PropertyListings");

            migrationBuilder.DropColumn(
                name: "ContactName",
                table: "PropertyListings");

            migrationBuilder.DropColumn(
                name: "ContactPhone",
                table: "PropertyListings");

            migrationBuilder.DropColumn(
                name: "CreatedById",
                table: "PropertyListings");

            migrationBuilder.DropColumn(
                name: "LandArea",
                table: "PropertyListings");

            migrationBuilder.DropColumn(
                name: "LocationLabel",
                table: "PropertyListings");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "PropertyListings");

            migrationBuilder.RenameColumn(
                name: "Type",
                table: "PropertyListings",
                newName: "ListingType");

            migrationBuilder.AlterColumn<Guid>(
                name: "UnitId",
                table: "PropertyListings",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "PropertyListings",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_PropertyListings_Units_UnitId",
                table: "PropertyListings",
                column: "UnitId",
                principalTable: "Units",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
