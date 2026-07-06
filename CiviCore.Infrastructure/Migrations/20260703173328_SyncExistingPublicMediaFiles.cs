using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CiviCore.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SyncExistingPublicMediaFiles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Sync existing physical files in public-media to MediaFiles table
            var webRoot = System.IO.Path.Combine(System.IO.Directory.GetCurrentDirectory(), "CiviCore.Api", "wwwroot", "public-media");
            
            // During ef update, CurrentDirectory is usually the infrastructure project or solution root.
            // Let's use a flexible path resolution.
            var searchPaths = new[] {
                System.IO.Path.Combine(System.IO.Directory.GetCurrentDirectory(), "CiviCore.Api", "wwwroot", "public-media"),
                System.IO.Path.Combine(System.IO.Directory.GetCurrentDirectory(), "..", "CiviCore.Api", "wwwroot", "public-media"),
                System.IO.Path.Combine(System.IO.Directory.GetCurrentDirectory(), "wwwroot", "public-media")
            };

            string actualRoot = null;
            foreach(var path in searchPaths) {
                if (System.IO.Directory.Exists(path)) {
                    actualRoot = path;
                    break;
                }
            }

            if (actualRoot != null)
            {
                var files = System.IO.Directory.GetFiles(actualRoot, "*.*", System.IO.SearchOption.AllDirectories);
                foreach (var file in files)
                {
                    // Convert C:\...\wwwroot\public-media\homepage\hero\file.png -> homepage/hero/file.png
                    var relativePath = file.Substring(actualRoot.Length).TrimStart(System.IO.Path.DirectorySeparatorChar, System.IO.Path.AltDirectorySeparatorChar);
                    var unixPath = relativePath.Replace('\\', '/');
                    var fileName = System.IO.Path.GetFileName(file);
                    var fileInfo = new System.IO.FileInfo(file);
                    
                    var mimeType = "application/octet-stream";
                    if (fileName.EndsWith(".png", StringComparison.OrdinalIgnoreCase)) mimeType = "image/png";
                    else if (fileName.EndsWith(".jpg", StringComparison.OrdinalIgnoreCase) || fileName.EndsWith(".jpeg", StringComparison.OrdinalIgnoreCase)) mimeType = "image/jpeg";
                    else if (fileName.EndsWith(".webp", StringComparison.OrdinalIgnoreCase)) mimeType = "image/webp";

                    var modelType = unixPath.StartsWith("homepage/") ? "homepage" : "property";

                    migrationBuilder.Sql($@"
                        INSERT INTO ""MediaFiles"" (""Id"", ""UserId"", ""ModelType"", ""ModelId"", ""FilePath"", ""FileName"", ""FileSize"", ""MimeType"", ""IsPrivate"", ""CreatedAt"", ""UpdatedAt"")
                        SELECT 
                            gen_random_uuid(), 
                            (SELECT ""Id"" FROM ""AspNetUsers"" LIMIT 1), 
                            '{modelType}', 
                            '00000000-0000-0000-0000-000000000000'::uuid, 
                            '{unixPath}', 
                            '{fileName}', 
                            {fileInfo.Length}, 
                            '{mimeType}', 
                            false, 
                            NOW(), 
                            NOW()
                        WHERE NOT EXISTS (
                            SELECT 1 FROM ""MediaFiles"" WHERE ""FilePath"" = '{unixPath}'
                        );
                    ");
                }
            }
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 3, 17, 21, 49, 656, DateTimeKind.Utc).AddTicks(8577), new DateTime(2026, 7, 3, 17, 21, 49, 656, DateTimeKind.Utc).AddTicks(8580) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 3, 17, 21, 49, 656, DateTimeKind.Utc).AddTicks(8593), new DateTime(2026, 7, 3, 17, 21, 49, 656, DateTimeKind.Utc).AddTicks(8594) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 3, 17, 21, 49, 656, DateTimeKind.Utc).AddTicks(8607), new DateTime(2026, 7, 3, 17, 21, 49, 656, DateTimeKind.Utc).AddTicks(8607) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("44444444-4444-4444-4444-444444444444"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 3, 17, 21, 49, 656, DateTimeKind.Utc).AddTicks(8609), new DateTime(2026, 7, 3, 17, 21, 49, 656, DateTimeKind.Utc).AddTicks(8610) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("55555555-5555-5555-5555-555555555555"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 3, 17, 21, 49, 656, DateTimeKind.Utc).AddTicks(8612), new DateTime(2026, 7, 3, 17, 21, 49, 656, DateTimeKind.Utc).AddTicks(8613) });

            migrationBuilder.UpdateData(
                table: "NavigationLinks",
                keyColumn: "Id",
                keyValue: new Guid("66666666-6666-6666-6666-666666666666"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 7, 3, 17, 21, 49, 656, DateTimeKind.Utc).AddTicks(8615), new DateTime(2026, 7, 3, 17, 21, 49, 656, DateTimeKind.Utc).AddTicks(8615) });
        }
    }
}
