using GetGrounded.Application.Auth;
using GetGrounded.Domain;
using GetGrounded.Infrastructure.Data;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace GetGrounded.Infrastructure.Auth;

public sealed class PostgresUserStore(IConfiguration configuration) : IUserStore
{
    public async Task EnsureAsync(User user, CancellationToken cancellationToken = default)
    {
        var connectionString = configuration["DATABASE_URL"];
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException("DATABASE_URL is not configured.");
        }

        await using var connection = new NpgsqlConnection(DatabaseUrl.ToNpgsql(connectionString));
        await connection.OpenAsync(cancellationToken);

        await using (var create = new NpgsqlCommand(
            """
            CREATE TABLE IF NOT EXISTS users (
              id TEXT PRIMARY KEY,
              created_at TIMESTAMPTZ NOT NULL DEFAULT now()
            );
            """,
            connection))
        {
            await create.ExecuteNonQueryAsync(cancellationToken);
        }

        await using var upsert = new NpgsqlCommand(
            """
            INSERT INTO users (id) VALUES ($1)
            ON CONFLICT (id) DO NOTHING;
            """,
            connection)
        {
            Parameters = { new NpgsqlParameter { Value = user.Id } }
        };
        await upsert.ExecuteNonQueryAsync(cancellationToken);
    }
}
