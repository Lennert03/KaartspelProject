using Microsoft.EntityFrameworkCore;
using ScoreBridge.Api.Data;
using ScoreBridge.Api.Services;
using System.Text.Json.Serialization;

try
{
    var builder = WebApplication.CreateBuilder(args);

    // 1. Add DB Context with SQLite or PostgreSQL support
    var dbProvider = builder.Configuration["DatabaseProvider"] ?? "Sqlite";
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

    if (string.IsNullOrWhiteSpace(connectionString))
    {
        // Fallback if connection string is missing - default to a local SQLite database
        connectionString = "Data Source=ScoreBridge.db";
        dbProvider = "Sqlite";
    }

    builder.Services.AddDbContext<AppDbContext>(options =>
    {
        if (dbProvider.Equals("PostgreSQL", StringComparison.OrdinalIgnoreCase))
        {
            options.UseNpgsql(connectionString);
        }
        else
        {
            options.UseSqlite(connectionString);
        }
    });

    // 2. Register Application Services
    builder.Services.AddScoped<IScoreCalculationService, ScoreCalculationService>();

    // 3. Configure Controllers & JSON serialization
    builder.Services.AddControllers()
        .AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
            options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        });

    // 4. Configure Swagger
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();

    // 5. Configure CORS
    var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? new[] { "http://localhost:4200" };

    builder.Services.AddCors(options =>
    {
        options.AddPolicy("CorsPolicy", policy =>
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials(); // Useful if cookies are added later, otherwise AllowAnyOrigin isn't allowed with credentials
        });
    });

    var app = builder.Build();

    // 6. Database auto-migration & initialization
    using (var scope = app.Services.CreateScope())
    {
        var services = scope.ServiceProvider;
        try
        {
            var context = services.GetRequiredService<AppDbContext>();
            // Ensure Database is created and migrations are applied
            await context.Database.MigrateAsync();
        }
        catch (Exception ex)
        {
            var logger = services.GetRequiredService<ILogger<Program>>();
            logger.LogError(ex, "Er is een fout opgetreden bij het migreren van de database.");
        }
    }

    // Configure the HTTP request pipeline.
    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI(c =>
        {
            c.SwaggerEndpoint("/swagger/v1/swagger.json", "ScoreBridge API v1");
        });
    }

    app.UseCors("CorsPolicy");

    app.UseHttpsRedirection();

    app.UseAuthorization();

    app.MapControllers();

    app.Run();
}
catch (System.Reflection.ReflectionTypeLoadException ex)
{
    Console.WriteLine("=== REFLECTION TYPE LOAD EXCEPTION IN PROGRAM.CS ===");
    if (ex.LoaderExceptions != null)
    {
        foreach (var loaderEx in ex.LoaderExceptions)
        {
            Console.WriteLine($"Loader Exception: {loaderEx?.Message}");
        }
    }
    throw;
}
catch (Exception ex)
{
    Console.WriteLine($"=== GENERAL EXCEPTION IN PROGRAM.CS ===\n{ex}");
    throw;
}
