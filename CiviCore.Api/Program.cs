using CiviCore.Infrastructure;
using CiviCore.Domain.Entities;
using CiviCore.Infrastructure.Data;
using CiviCore.Api.Services;
using CiviCore.Api.Middleware;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.DataProtection;

var builder = WebApplication.CreateBuilder(args);

var wwwrootPath = Path.Combine(builder.Environment.ContentRootPath, "wwwroot");
if (!Directory.Exists(wwwrootPath))
{
    Directory.CreateDirectory(wwwrootPath);
}
builder.Environment.WebRootPath = wwwrootPath;

// Add services to the container.
builder.Services.AddControllers(options => {
    options.SuppressImplicitRequiredAttributeForNonNullableReferenceTypes = true;
}).AddJsonOptions(options => {
    options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
});
builder.Services.AddEndpointsApiExplorer();

var dataProtectionPath = Path.Combine(builder.Environment.ContentRootPath, "DataProtection-Keys");
builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo(dataProtectionPath))
    .SetApplicationName("CiviCore");

builder.Services.AddSwaggerGen(c =>
{
    c.CustomSchemaIds(type => type.FullName);
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Enter 'Bearer' [space] and then your valid token in the text input below.\r\n\r\nExample: \"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\""
    });
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});
var useRedis = builder.Configuration.GetValue<bool>("UseRedis", true);
var redisConnectionString = builder.Configuration.GetConnectionString("Redis");
if (useRedis && !string.IsNullOrEmpty(redisConnectionString))
{
    builder.Services.AddStackExchangeRedisCache(options =>
    {
        options.Configuration = redisConnectionString;
        options.InstanceName = "CiviCore_";
    });
}
else
{
    builder.Services.AddDistributedMemoryCache(); // Fallback for local development if Redis isn't running natively
}

builder.Services.AddSingleton<ImportJobTracker>();

// Rate Limiting Setup
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // Global Limit: 100 requests per minute per IP
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: partition => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 100,
                QueueLimit = 0,
                Window = TimeSpan.FromMinutes(1)
            }));

    // Auth Limit: 5 requests per minute per IP for sensitive endpoints
    options.AddPolicy("AuthLimit", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: partition => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 5,
                QueueLimit = 0,
                Window = TimeSpan.FromMinutes(1)
            }));
});

// Configure Infrastructure Layer
builder.Services.AddInfrastructureServices(builder.Configuration);

builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IEncryptionService, EncryptionService>();
builder.Services.AddScoped<IExcelExportService, ExcelExportService>();
builder.Services.AddScoped<ILocalStorageService, LocalStorageService>();
builder.Services.AddHttpClient<IRecaptchaService, RecaptchaService>();

builder.Services.AddAuthentication()
    .AddGoogle(options =>
    {
        options.ClientId = builder.Configuration["Google:ClientId"] ?? "dummy";
        options.ClientSecret = builder.Configuration["Google:ClientSecret"] ?? "dummy";
        options.CallbackPath = "/auth/google/callback";
    });

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger(c => 
    {
        c.RouteTemplate = "api/swagger/{documentName}/swagger.json";
    });
    app.UseSwaggerUI(c => 
    {
        c.SwaggerEndpoint("/api/swagger/v1/swagger.json", "CiviCore API v1");
        c.RoutePrefix = "api/swagger";
    });
}

// please comment it while development to avoid certificate error
app.UseHttpsRedirection();

app.UseDefaultFiles();
app.UseStaticFiles();

app.UseTrustProxies();
app.UseMiddleware<SetLocaleMiddleware>();

// Enable Rate Limiting (Placed after StaticFiles so it doesn't limit images/css/js)
// We skip this in Development so it doesn't block you while testing
if (!app.Environment.IsDevelopment())
{
    app.UseRateLimiter();
}

app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

// Custom CiviCore Middlewares
app.UseMiddleware<AuditMiddleware>();
app.UseMiddleware<VerifyApiKeyMiddleware>();
app.UseMiddleware<SessionConflictMiddleware>();
app.UseMiddleware<UpdateLastActiveMiddleware>();
app.UseMiddleware<EnsureUserIsApprovedMiddleware>();
app.UseMiddleware<RequireTwoFactorMiddleware>();
app.UseMiddleware<RequirePermissionMiddleware>();

app.MapControllers();
app.MapGet("/debug-env", (IWebHostEnvironment env) => new { 
    env.WebRootPath, 
    env.ContentRootPath, 
    env.EnvironmentName 
});

app.MapFallbackToFile("admin/{**slug}", "admin.html");
app.MapFallbackToFile("index.html");

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<CiviCore.Infrastructure.Data.AppDbContext>();
        
        // Automatically apply any pending migrations when the app starts
        await Microsoft.EntityFrameworkCore.RelationalDatabaseFacadeExtensions.MigrateAsync(context.Database);
        
        // Seed data after migrations are applied
        await CiviCore.Infrastructure.Data.DataSeeder.SeedDataAsync(services);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred during database migration or seeding.");
    }
}

app.Run();
