using GetGrounded.Api;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<IDatabasePing, NpgsqlDatabasePing>();
builder.Services.AddSingleton<ITokenVerifier, FirebaseTokenVerifier>();
builder.Services.AddSingleton<IUserStore, PostgresUserStore>();

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

app.MapGet("/me", async (HttpContext context, ITokenVerifier verifier, IUserStore users, CancellationToken cancellationToken) =>
{
    var header = context.Request.Headers.Authorization.ToString();
    if (!header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
    {
        return Results.Unauthorized();
    }

    var token = header["Bearer ".Length..].Trim();
    if (string.IsNullOrEmpty(token))
    {
        return Results.Unauthorized();
    }

    var userId = await verifier.VerifyUserIdAsync(token, cancellationToken);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    await users.EnsureAsync(userId, cancellationToken);
    return Results.Ok(new { userId });
});

app.Run();
