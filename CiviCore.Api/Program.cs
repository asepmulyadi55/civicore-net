using CiviCore.Infrastructure;
using CiviCore.Domain.Entities;
using CiviCore.Infrastructure.Data;
using CiviCore.Api.Services;
using CiviCore.Api.Middleware;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure Infrastructure Layer
builder.Services.AddInfrastructureServices(builder.Configuration);

builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IEncryptionService, EncryptionService>();
builder.Services.AddScoped<IExcelExportService, ExcelExportService>();

builder.Services.AddAuthentication()
    .AddGoogle(options =>
    {
        options.ClientId = builder.Configuration["Google:ClientId"] ?? "dummy";
        options.ClientSecret = builder.Configuration["Google:ClientSecret"] ?? "dummy";
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

app.UseTrustProxies();
app.UseMiddleware<SetLocaleMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

// Custom CiviCore Middlewares
app.UseMiddleware<VerifyApiKeyMiddleware>();
app.UseMiddleware<SessionConflictMiddleware>();
app.UseMiddleware<UpdateLastActiveMiddleware>();
app.UseMiddleware<EnsureUserIsApprovedMiddleware>();
app.UseMiddleware<RequireTwoFactorMiddleware>();
app.UseMiddleware<RequirePermissionMiddleware>();

app.MapControllers();

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
