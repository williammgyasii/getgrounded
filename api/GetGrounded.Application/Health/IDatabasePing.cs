namespace GetGrounded.Application.Health;

public interface IDatabasePing
{
    Task<DatabasePingResult> PingAsync(CancellationToken cancellationToken = default);
}

public sealed record DatabasePingResult(
    string Status,
    string? Name,
    string? ServerVersion,
    double? LatencyMs);
