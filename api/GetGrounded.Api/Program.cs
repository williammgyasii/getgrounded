using GetGrounded.Api;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<IDatabasePing, NpgsqlDatabasePing>();

var app = builder.Build();

app.MapGet("/health", async (IDatabasePing ping, IHostEnvironment environment, CancellationToken cancellationToken) =>
{
    var database = await ping.PingAsync(cancellationToken);
    var status = database.Status == "connected" ? "ok" : "degraded";

    return Results.Ok(new
    {
        status,
        service = "getgrounded-api",
        environment = environment.EnvironmentName,
        checkedAt = DateTimeOffset.UtcNow,
        database = new
        {
            status = database.Status,
            engine = "postgresql",
            name = database.Name,
            serverVersion = database.ServerVersion,
            latencyMs = database.LatencyMs
        }
    });
});

app.Run();
