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
        if (context.Request.Method != "GET")
        {
            _logger.LogInformation("Audit Log: User {User} executed {Method} on {Path}",
                context.User.Identity?.Name ?? "Anonymous",
                context.Request.Method,
                context.Request.Path);
        }
        await _next(context);
    }
}
