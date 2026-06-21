using CiviCore.Infrastructure;
using CiviCore.Domain.Entities;
using CiviCore.Infrastructure.Data;
using CiviCore.Api.Services;
using CiviCore.Api.Middleware;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers(options => {
    options.SuppressImplicitRequiredAttributeForNonNullableReferenceTypes = true;
}).AddJsonOptions(options => {
    options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddMemoryCache();

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
builder.Services.AddScoped<ISupabaseStorageService, SupabaseStorageService>();

var supabaseUrl = builder.Configuration["Supabase:Url"] ?? "https://dummy.supabase.co";
var supabaseKey = builder.Configuration["Supabase:ServiceRoleKey"] ?? "dummy";
builder.Services.AddScoped<Supabase.Client>(_ => new Supabase.Client(supabaseUrl, supabaseKey));

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
    app.UseSwagger();
    app.UseSwaggerUI();
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
app.MapFallbackToFile("index.html");

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        // This won't do anything until the DB is created/migrated,
        // but it will safely attempt to seed data when ready.
        var context = services.GetRequiredService<CiviCore.Infrastructure.Data.AppDbContext>();
        if (context.Database.CanConnect())
        {
            await CiviCore.Infrastructure.Data.DataSeeder.SeedDataAsync(services);
        }
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred seeding the DB.");
    }
}

app.Run();
