using System.Diagnostics;
using GetGrounded.Application.Health;
using GetGrounded.Infrastructure.Data;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace GetGrounded.Infrastructure.Health;

public sealed class NpgsqlDatabasePing(IConfiguration configuration) : IDatabasePing
{
    public async Task<DatabasePingResult> PingAsync(CancellationToken cancellationToken = default)
    {
        var connectionString = configuration["DATABASE_URL"];
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            return new DatabasePingResult("not_configured", null, null, null);
        }

        try
        {
            await using var connection = new NpgsqlConnection(DatabaseUrl.ToNpgsql(connectionString));
            await using var command = new NpgsqlCommand(
                "SELECT current_database(), current_setting('server_version')",
                connection)
            {
                CommandTimeout = 2
            };

            var clock = Stopwatch.StartNew();
            await connection.OpenAsync(cancellationToken);
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            if (!await reader.ReadAsync(cancellationToken))
            {
                return new DatabasePingResult("unavailable", null, null, null);
            }

            clock.Stop();
            return new DatabasePingResult(
                "connected",
                reader.GetString(0),
                reader.GetString(1),
                clock.Elapsed.TotalMilliseconds);
        }
        catch (Exception)
        {
            return new DatabasePingResult("unavailable", null, null, null);
        }
    }
}
