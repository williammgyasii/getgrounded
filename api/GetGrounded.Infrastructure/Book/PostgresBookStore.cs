using GetGrounded.Application.Book;
using GetGrounded.Infrastructure.Data;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace GetGrounded.Infrastructure.Book;

public sealed class PostgresBookStore(IConfiguration configuration) : IBookStore
{
    public async Task<DayRecord> SaveMorningAsync(
        Guid userId,
        DateOnly localDate,
        string timezone,
        string transcript,
        IReadOnlyList<PlannedItem> items,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await BookSchema.EnsureAsync(connection, cancellationToken);
        await using var tx = await connection.BeginTransactionAsync(cancellationToken);

        var dayId = await UpsertDayAsync(connection, tx, userId, localDate, timezone, cancellationToken);
        await InsertSessionAsync(
            connection,
            tx,
            userId,
            dayId,
            "MORNING_PLAN",
            transcript,
            cancellationToken);

        if (items.Count > 0)
        {
            var ids = items.Select(_ => Guid.CreateVersion7()).ToArray();
            var userIds = Enumerable.Repeat(userId, items.Count).ToArray();
            var dayIds = Enumerable.Repeat(dayId, items.Count).ToArray();
            var titles = items.Select(item => item.Title).ToArray();
            var durations = items.Select(item => (int?)item.PlannedDurationMinutes).ToArray();
            var sorts = Enumerable.Range(0, items.Count).ToArray();

            await using var insert = new NpgsqlCommand(
                """
                INSERT INTO commitments (
                  id, user_id, day_id, title, status, planned_duration_minutes, source, sort_order)
                SELECT u.id, u.user_id, u.day_id, u.title, 'PLANNED', u.mins, 'MORNING_EXTRACT', u.sort
                FROM UNNEST($1::uuid[], $2::uuid[], $3::uuid[], $4::text[], $5::int[], $6::int[])
                  AS u(id, user_id, day_id, title, mins, sort)
                """,
                connection, tx)
            {
                Parameters =
                {
                    new NpgsqlParameter { Value = ids },
                    new NpgsqlParameter { Value = userIds },
                    new NpgsqlParameter { Value = dayIds },
                    new NpgsqlParameter { Value = titles },
                    new NpgsqlParameter { Value = durations },
                    new NpgsqlParameter { Value = sorts }
                }
            };
            await insert.ExecuteNonQueryAsync(cancellationToken);
        }

        await tx.CommitAsync(cancellationToken);
        return (await LoadDayAsync(connection, userId, localDate, cancellationToken))!;
    }

    public async Task<DayRecord?> SaveEveningAsync(
        Guid userId,
        DateOnly localDate,
        string timezone,
        string transcript,
        IReadOnlyList<OutcomeItem> outcomes,
        IReadOnlyList<WinItem> wins,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await BookSchema.EnsureAsync(connection, cancellationToken);
        await using var tx = await connection.BeginTransactionAsync(cancellationToken);

        var dayId = await UpsertDayAsync(connection, tx, userId, localDate, timezone, cancellationToken);
        await InsertSessionAsync(
            connection,
            tx,
            userId,
            dayId,
            "EVENING_REFLECTION",
            transcript,
            cancellationToken);

        if (outcomes.Count > 0)
        {
            var ids = outcomes.Select(item => item.Id).ToArray();
            var statuses = outcomes.Select(item => item.Status).ToArray();
            var actuals = outcomes.Select(item => (int?)item.ActualDurationMinutes).ToArray();
            var reasons = outcomes.Select(item => (string?)item.Reason).ToArray();

            await using var update = new NpgsqlCommand(
                """
                UPDATE commitments AS c
                SET
                  status = u.status,
                  actual_duration_minutes = u.actual,
                  reason = u.reason,
                  updated_at = now()
                FROM UNNEST($1::uuid[], $2::text[], $3::int[], $4::text[])
                  AS u(id, status, actual, reason)
                WHERE c.id = u.id AND c.user_id = $5 AND c.day_id = $6
                """,
                connection, tx)
            {
                Parameters =
                {
                    new NpgsqlParameter { Value = ids },
                    new NpgsqlParameter { Value = statuses },
                    new NpgsqlParameter { Value = actuals },
                    new NpgsqlParameter { Value = reasons },
                    new NpgsqlParameter { Value = userId },
                    new NpgsqlParameter { Value = dayId }
                }
            };
            var updated = await update.ExecuteNonQueryAsync(cancellationToken);
            if (updated != outcomes.Count)
            {
                throw new ArgumentException("One or more outcomes do not belong to this day.");
            }
        }

        if (wins.Count > 0)
        {
            var ids = wins.Select(_ => Guid.CreateVersion7()).ToArray();
            var userIds = Enumerable.Repeat(userId, wins.Count).ToArray();
            var dayIds = Enumerable.Repeat(dayId, wins.Count).ToArray();
            var titles = wins.Select(item => item.Title).ToArray();

            await using var insert = new NpgsqlCommand(
                """
                INSERT INTO wins (id, user_id, day_id, title, source)
                SELECT u.id, u.user_id, u.day_id, u.title, 'EVENING_EXTRACT'
                FROM UNNEST($1::uuid[], $2::uuid[], $3::uuid[], $4::text[])
                  AS u(id, user_id, day_id, title)
                """,
                connection, tx)
            {
                Parameters =
                {
                    new NpgsqlParameter { Value = ids },
                    new NpgsqlParameter { Value = userIds },
                    new NpgsqlParameter { Value = dayIds },
                    new NpgsqlParameter { Value = titles }
                }
            };
            await insert.ExecuteNonQueryAsync(cancellationToken);
        }

        await tx.CommitAsync(cancellationToken);
        return await LoadDayAsync(connection, userId, localDate, cancellationToken);
    }

    public Task<DayRecord?> GetDayAsync(
        Guid userId,
        DateOnly localDate,
        CancellationToken cancellationToken = default)
    {
        return WithConnection(connection => LoadDayAsync(connection, userId, localDate, cancellationToken), cancellationToken);
    }

    public async Task<IReadOnlyList<DayRecord>> GetDaysAsync(
        Guid userId,
        DateOnly from,
        DateOnly to,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await BookSchema.EnsureAsync(connection, cancellationToken);
        await using var command = new NpgsqlCommand(
            """
            SELECT local_date
            FROM days
            WHERE user_id = $1 AND local_date >= $2 AND local_date <= $3
            ORDER BY local_date DESC
            """,
            connection)
        {
            Parameters =
            {
                new NpgsqlParameter { Value = userId },
                new NpgsqlParameter { Value = from },
                new NpgsqlParameter { Value = to }
            }
        };

        var dates = new List<DateOnly>();
        await using (var reader = await command.ExecuteReaderAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                dates.Add(reader.GetFieldValue<DateOnly>(0));
            }
        }

        var days = new List<DayRecord>(dates.Count);
        foreach (var date in dates)
        {
            var day = await LoadDayAsync(connection, userId, date, cancellationToken);
            if (day is not null)
            {
                days.Add(day);
            }
        }

        return days;
    }

    public async Task<IReadOnlyList<DateOnly>> GetShowedUpDatesAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await BookSchema.EnsureAsync(connection, cancellationToken);
        await using var command = new NpgsqlCommand(
            """
            SELECT local_date
            FROM days
            WHERE user_id = $1 AND showed_up
            ORDER BY local_date DESC
            """,
            connection)
        {
            Parameters = { new NpgsqlParameter { Value = userId } }
        };

        var dates = new List<DateOnly>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            dates.Add(reader.GetFieldValue<DateOnly>(0));
        }

        return dates;
    }

    private async Task<Guid> UpsertDayAsync(
        NpgsqlConnection connection,
        NpgsqlTransaction tx,
        Guid userId,
        DateOnly localDate,
        string timezone,
        CancellationToken cancellationToken)
    {
        await using var command = new NpgsqlCommand(
            """
            INSERT INTO days (id, user_id, local_date, timezone, showed_up)
            VALUES ($1, $2, $3, $4, true)
            ON CONFLICT (user_id, local_date) DO UPDATE
            SET timezone = EXCLUDED.timezone, showed_up = true, updated_at = now()
            RETURNING id
            """,
            connection, tx)
        {
            Parameters =
            {
                new NpgsqlParameter { Value = Guid.CreateVersion7() },
                new NpgsqlParameter { Value = userId },
                new NpgsqlParameter { Value = localDate },
                new NpgsqlParameter { Value = timezone }
            }
        };

        return (Guid)(await command.ExecuteScalarAsync(cancellationToken))!;
    }

    private static async Task InsertSessionAsync(
        NpgsqlConnection connection,
        NpgsqlTransaction tx,
        Guid userId,
        Guid dayId,
        string kind,
        string transcript,
        CancellationToken cancellationToken)
    {
        await using var command = new NpgsqlCommand(
            """
            INSERT INTO voice_sessions (id, user_id, day_id, kind, transcript, processing_status)
            VALUES ($1, $2, $3, $4, $5, 'RECEIVED')
            """,
            connection, tx)
        {
            Parameters =
            {
                new NpgsqlParameter { Value = Guid.CreateVersion7() },
                new NpgsqlParameter { Value = userId },
                new NpgsqlParameter { Value = dayId },
                new NpgsqlParameter { Value = kind },
                new NpgsqlParameter { Value = transcript }
            }
        };
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static async Task<DayRecord?> LoadDayAsync(
        NpgsqlConnection connection,
        Guid userId,
        DateOnly localDate,
        CancellationToken cancellationToken)
    {
        await using var day = new NpgsqlCommand(
            """
            SELECT id, timezone, showed_up
            FROM days
            WHERE user_id = $1 AND local_date = $2
            """,
            connection)
        {
            Parameters =
            {
                new NpgsqlParameter { Value = userId },
                new NpgsqlParameter { Value = localDate }
            }
        };

        Guid dayId;
        string timezone;
        bool showedUp;
        await using (var reader = await day.ExecuteReaderAsync(cancellationToken))
        {
            if (!await reader.ReadAsync(cancellationToken))
            {
                return null;
            }

            dayId = reader.GetGuid(0);
            timezone = reader.GetString(1);
            showedUp = reader.GetBoolean(2);
        }

        var commitments = new List<CommitmentRecord>();
        await using (var list = new NpgsqlCommand(
            """
            SELECT id, title, status, planned_duration_minutes, actual_duration_minutes
            FROM commitments
            WHERE user_id = $1 AND day_id = $2
            ORDER BY sort_order, created_at
            """,
            connection)
        {
            Parameters =
            {
                new NpgsqlParameter { Value = userId },
                new NpgsqlParameter { Value = dayId }
            }
        })
        await using (var reader = await list.ExecuteReaderAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                commitments.Add(new CommitmentRecord(
                    reader.GetGuid(0),
                    reader.GetString(1),
                    reader.GetString(2),
                    reader.IsDBNull(3) ? null : reader.GetInt32(3),
                    reader.IsDBNull(4) ? null : reader.GetInt32(4)));
            }
        }

        var wins = new List<WinRecord>();
        await using (var list = new NpgsqlCommand(
            """
            SELECT id, title
            FROM wins
            WHERE user_id = $1 AND day_id = $2
            ORDER BY created_at
            """,
            connection)
        {
            Parameters =
            {
                new NpgsqlParameter { Value = userId },
                new NpgsqlParameter { Value = dayId }
            }
        })
        await using (var reader = await list.ExecuteReaderAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                wins.Add(new WinRecord(reader.GetGuid(0), reader.GetString(1)));
            }
        }

        return new DayRecord(dayId, localDate, timezone, showedUp, commitments, wins);
    }

    private async Task<T> WithConnection<T>(
        Func<NpgsqlConnection, Task<T>> work,
        CancellationToken cancellationToken)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await BookSchema.EnsureAsync(connection, cancellationToken);
        return await work(connection);
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
