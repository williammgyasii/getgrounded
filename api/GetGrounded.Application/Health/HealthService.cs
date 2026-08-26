namespace GetGrounded.Application.Health;

public sealed class HealthService(IDatabasePing ping)
{
    public async Task<HealthReport> GetAsync(string environment, CancellationToken cancellationToken = default)
    {
        var database = await ping.PingAsync(cancellationToken);
        var status = database.Status == "connected" ? "ok" : "degraded";

        return new HealthReport(
            Status: status,
            Service: "getgrounded-api",
            Environment: environment,
            CheckedAt: DateTimeOffset.UtcNow,
            Database: new DatabaseHealthReport(
                Status: database.Status,
                Engine: "postgresql",
                Name: database.Name,
                ServerVersion: database.ServerVersion,
                LatencyMs: database.LatencyMs));
    }
}

public sealed record HealthReport(
    string Status,
    string Service,
    string Environment,
    DateTimeOffset CheckedAt,
    DatabaseHealthReport Database);

public sealed record DatabaseHealthReport(
    string Status,
    string Engine,
    string? Name,
    string? ServerVersion,
    double? LatencyMs);
