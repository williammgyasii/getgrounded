using GetGrounded.Application.Auth;
using GetGrounded.Domain;
using GetGrounded.Infrastructure.Data;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace GetGrounded.Infrastructure.Auth;

public sealed class PostgresUserStore(IConfiguration configuration) : IUserStore
{
    public async Task<User> FindOrCreateAsync(string firebaseUid, CancellationToken cancellationToken = default)
    {
        var living = User.Open(Guid.CreateVersion7(), firebaseUid);
        await using var connection = await OpenAsync(cancellationToken);
        await BookSchema.EnsureAsync(connection, cancellationToken);

        await using var lookup = new NpgsqlCommand(
            """
            SELECT id, firebase_uid, deleted_at
            FROM users
            WHERE firebase_uid = $1
            """,
            connection)
        {
            Parameters = { new NpgsqlParameter { Value = living.FirebaseUid } }
        };

        await using (var reader = await lookup.ExecuteReaderAsync(cancellationToken))
        {
            if (await reader.ReadAsync(cancellationToken))
            {
                var id = reader.GetGuid(0);
                var uid = reader.GetString(1);
                return reader.IsDBNull(2)
                    ? User.Open(id, uid)
                    : User.Tombstone(id, uid, reader.GetFieldValue<DateTimeOffset>(2));
            }
        }

        try
        {
            await using var insert = new NpgsqlCommand(
                """
                INSERT INTO users (id, firebase_uid) VALUES ($1, $2)
                """,
                connection)
            {
                Parameters =
                {
                    new NpgsqlParameter { Value = living.Id },
                    new NpgsqlParameter { Value = living.FirebaseUid }
                }
            };
            await insert.ExecuteNonQueryAsync(cancellationToken);
            return living;
        }
        catch (PostgresException ex) when (ex.SqlState == PostgresErrorCodes.UniqueViolation)
        {
            await using var again = new NpgsqlCommand(
                """
                SELECT id, firebase_uid, deleted_at
                FROM users
                WHERE firebase_uid = $1
                """,
                connection)
            {
                Parameters = { new NpgsqlParameter { Value = living.FirebaseUid } }
            };
            await using var reader = await again.ExecuteReaderAsync(cancellationToken);
            if (!await reader.ReadAsync(cancellationToken))
            {
                throw;
            }

            var id = reader.GetGuid(0);
            var uid = reader.GetString(1);
            return reader.IsDBNull(2)
                ? User.Open(id, uid)
                : User.Tombstone(id, uid, reader.GetFieldValue<DateTimeOffset>(2));
        }
    }

    private async Task<NpgsqlConnection> OpenAsync(CancellationToken cancellationToken)
    {
        var connectionString = configuration["DATABASE_URL"];
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException("DATABASE_URL is not configured.");
        }

        var connection = new NpgsqlConnection(DatabaseUrl.ToNpgsql(connectionString));
        await connection.OpenAsync(cancellationToken);
        return connection;
    }
}
