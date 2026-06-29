using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CiviCore.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateMeetingAttendance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MeetingAttendances_AspNetUsers_UserId",
                table: "MeetingAttendances");

            migrationBuilder.DropIndex(
                name: "IX_MeetingAttendances_UserId",
                table: "MeetingAttendances");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "MeetingAttendances");

            migrationBuilder.AddColumn<Guid>(
                name: "HouseholderId",
                table: "MeetingAttendances",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ResidentId",
                table: "MeetingAttendances",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_MeetingAttendances_HouseholderId",
                table: "MeetingAttendances",
                column: "HouseholderId");

            migrationBuilder.CreateIndex(
                name: "IX_MeetingAttendances_ResidentId",
                table: "MeetingAttendances",
                column: "ResidentId");

            migrationBuilder.AddForeignKey(
                name: "FK_MeetingAttendances_Householders_HouseholderId",
                table: "MeetingAttendances",
                column: "HouseholderId",
                principalTable: "Householders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_MeetingAttendances_Residents_ResidentId",
                table: "MeetingAttendances",
                column: "ResidentId",
                principalTable: "Residents",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MeetingAttendances_Householders_HouseholderId",
                table: "MeetingAttendances");

            migrationBuilder.DropForeignKey(
                name: "FK_MeetingAttendances_Residents_ResidentId",
                table: "MeetingAttendances");

            migrationBuilder.DropIndex(
                name: "IX_MeetingAttendances_HouseholderId",
                table: "MeetingAttendances");

            migrationBuilder.DropIndex(
                name: "IX_MeetingAttendances_ResidentId",
                table: "MeetingAttendances");

            migrationBuilder.DropColumn(
                name: "HouseholderId",
                table: "MeetingAttendances");

            migrationBuilder.DropColumn(
                name: "ResidentId",
                table: "MeetingAttendances");

            migrationBuilder.AddColumn<Guid>(
                name: "UserId",
                table: "MeetingAttendances",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_MeetingAttendances_UserId",
                table: "MeetingAttendances",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_MeetingAttendances_AspNetUsers_UserId",
                table: "MeetingAttendances",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
