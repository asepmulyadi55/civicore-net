using System;
using System.Security.Claims;
using System.Threading.Tasks;
using CiviCore.Infrastructure.Data;

namespace CiviCore.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static async Task<Guid?> GetBlockIdAsync(this ClaimsPrincipal principal, AppDbContext context)
    {
        if (principal.IsInRole("Admin") || principal.IsInRole("admin") || principal.IsInRole("Super Admin") || principal.IsInRole("super-admin"))
        {
            return null;
        }

        var userIdStr = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (Guid.TryParse(userIdStr, out var userId))
        {
            var user = await context.Users.FindAsync(userId);
            return user?.BlockId;
        }
        return null;
    }
}
