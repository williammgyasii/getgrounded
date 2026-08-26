using System.Diagnostics;
using Npgsql;

namespace GetGrounded.Api;

public interface IDatabasePing
{
    Task<DatabasePingResult> PingAsync(CancellationToken cancellationToken = default);
}

public sealed record DatabasePingResult(
    string Status,
    string? Name,
    string? ServerVersion,
    double? LatencyMs);

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
            await using var connection = new NpgsqlConnection(ToNpgsql(connectionString));
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

    private static string ToNpgsql(string connectionString)
    {
        if (!connectionString.StartsWith("postgres", StringComparison.OrdinalIgnoreCase))
        {
            return connectionString;
        }

        var uri = new Uri(connectionString);
        var userInfo = uri.UserInfo.Split(':', 2);
        var builder = new NpgsqlConnectionStringBuilder
        {
            Username = Uri.UnescapeDataString(userInfo[0]),
            Password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : string.Empty,
            Database = uri.AbsolutePath.Trim('/'),
            Timeout = 2
        };

        builder.Host = QueryValue(uri.Query, "host") ?? uri.Host;

        if (uri.Port > 0)
        {
            builder.Port = uri.Port;
        }

        return builder.ConnectionString;
    }

    private static string? QueryValue(string query, string key)
    {
        if (string.IsNullOrEmpty(query))
        {
            return null;
        }

        foreach (var pair in query.TrimStart('?').Split('&', StringSplitOptions.RemoveEmptyEntries))
        {
            var parts = pair.Split('=', 2);
            if (parts.Length == 2 && parts[0] == key)
            {
                return Uri.UnescapeDataString(parts[1]);
            }
        }

        return null;
    }
}
