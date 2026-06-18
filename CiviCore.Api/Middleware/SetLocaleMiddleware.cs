using System.Globalization;

namespace CiviCore.Api.Middleware;

public class SetLocaleMiddleware
{
    private readonly RequestDelegate _next;

    public SetLocaleMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var language = context.Request.Headers["Accept-Language"].ToString();
        if (!string.IsNullOrEmpty(language))
        {
            var locale = language.Split(',')[0];
            try
            {
                CultureInfo.CurrentCulture = new CultureInfo(locale);
                CultureInfo.CurrentUICulture = new CultureInfo(locale);
            }
            catch (CultureNotFoundException)
            {
                // Fallback to default
            }
        }
        await _next(context);
    }
}
