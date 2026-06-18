using CiviCore.Infrastructure;
using CiviCore.Domain.Entities;
using CiviCore.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure Infrastructure Layer
builder.Services.AddInfrastructureServices(builder.Configuration);

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// please comment it while development to avoid certificate error
// app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

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
