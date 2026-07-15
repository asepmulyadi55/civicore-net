using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;

namespace CiviCore.Api.Middleware;

public class AuditMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<AuditMiddleware> _logger;

    public AuditMiddleware(RequestDelegate next, ILogger<AuditMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (context.Request.Method == "GET")
        {
            await _next(context);
            return;
        }

        await _next(context);

        // Logged after the request rather than before: beforehand we only know what was
        // attempted, so a call rejected with 403 read identically to one that succeeded —
        // actively misleading in something labelled "audit".
        _logger.LogInformation("Audit: User {User} {Method} {Path} -> {StatusCode}",
            context.User.Identity?.Name ?? "Anonymous",
            context.Request.Method,
            context.Request.Path,
            context.Response.StatusCode);
    }
}
