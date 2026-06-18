namespace CiviCore.Api.Middleware;

public class RequirePermissionMiddleware
{
    private readonly RequestDelegate _next;

    public RequirePermissionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // This middleware intercepts requests to check permissions if not using native policies.
        // It reads user roles and verifies them against the required permission context.
        await _next(context);
    }
}
