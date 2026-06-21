namespace CiviCore.Api.Middleware;

public class VerifyApiKeyMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IConfiguration _config;

    public VerifyApiKeyMiddleware(RequestDelegate next, IConfiguration config)
    {
        _next = next;
        _config = config;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Example logic for external API access
        if (context.Request.Path.StartsWithSegments("/api/public"))
        {
            if (!context.Request.Headers.TryGetValue("X-Api-Key", out var extractedApiKey))
            {
                context.Response.StatusCode = 401;
                await context.Response.WriteAsJsonAsync(new { message = "API Key was not provided." });
                return;
            }

            var apiKey = _config["CivicoreApiKey"];
            if (apiKey != extractedApiKey)
            {
                context.Response.StatusCode = 401;
                await context.Response.WriteAsJsonAsync(new { message = "Unauthorized client." });
                return;
            }
        }
        
        await _next(context);
    }
}
