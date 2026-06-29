using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CiviCore.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class BlockCoordinators : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BlockUsers");

            migrationBuilder.CreateTable(
                name: "BlockCoordinators",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BlockId = table.Column<Guid>(type: "uuid", nullable: false),
                    ResidentId = table.Column<Guid>(type: "uuid", nullable: true),
                    HouseholderId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BlockCoordinators", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BlockCoordinators_Blocks_BlockId",
                        column: x => x.BlockId,
                        principalTable: "Blocks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BlockCoordinators_Householders_HouseholderId",
                        column: x => x.HouseholderId,
                        principalTable: "Householders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_BlockCoordinators_Residents_ResidentId",
                        column: x => x.ResidentId,
                        principalTable: "Residents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BlockCoordinators_BlockId",
                table: "BlockCoordinators",
                column: "BlockId");

            migrationBuilder.CreateIndex(
                name: "IX_BlockCoordinators_HouseholderId",
                table: "BlockCoordinators",
                column: "HouseholderId");

            migrationBuilder.CreateIndex(
                name: "IX_BlockCoordinators_ResidentId",
                table: "BlockCoordinators",
                column: "ResidentId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BlockCoordinators");

            migrationBuilder.CreateTable(
                name: "BlockUsers",
                columns: table => new
                {
                    BlockId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BlockUsers", x => new { x.BlockId, x.UserId });
                    table.ForeignKey(
                        name: "FK_BlockUsers_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BlockUsers_Blocks_BlockId",
                        column: x => x.BlockId,
                        principalTable: "Blocks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BlockUsers_UserId",
                table: "BlockUsers",
                column: "UserId");
        }
    }
}
