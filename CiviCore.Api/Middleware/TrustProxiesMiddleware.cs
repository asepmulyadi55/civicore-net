using Microsoft.AspNetCore.HttpOverrides;

namespace CiviCore.Api.Middleware;

public static class TrustProxiesMiddlewareExtensions
{
    // In .NET, TrustProxies is usually configured via ForwardedHeadersMiddleware in Program.cs.
    // We create an extension method here to fulfill the requirement from the Laravel port logically.
    public static IApplicationBuilder UseTrustProxies(this IApplicationBuilder builder)
    {
        var forwardOptions = new ForwardedHeadersOptions
        {
            ForwardedHeaders = ForwardedHeaders.All,
            // You can restrict allowed proxies here
        };
        forwardOptions.KnownNetworks.Clear();
        forwardOptions.KnownProxies.Clear();

        return builder.UseForwardedHeaders(forwardOptions);
    }
}
