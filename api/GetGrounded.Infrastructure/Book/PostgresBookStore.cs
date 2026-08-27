using System.Text.Json;
using GetGrounded.Application.Book;
using GetGrounded.Application.Time;
using GetGrounded.Application.Voice;
using GetGrounded.Infrastructure.Data;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace GetGrounded.Infrastructure.Book;

public sealed class PostgresBookStore(IConfiguration configuration) : IBookStore
{
    private static readonly JsonSerializerOptions Json = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    public async Task<DayRecord> SaveMorningAsync(
        Guid userId,
        DateOnly localDate,
        string timezone,
        string transcript,
        IReadOnlyList<PlannedItem> items,
        string? title = null,
        string? storageKey = null,
        IReadOnlyList<SpokenWord>? words = null,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await BookSchema.EnsureAsync(connection, cancellationToken);
        await using var tx = await connection.BeginTransactionAsync(cancellationToken);

        var dayId = await UpsertDayAsync(connection, tx, userId, localDate, timezone, title, cancellationToken);
        await InsertSessionAsync(
            connection,
            tx,
            userId,
            dayId,
            "MORNING_PLAN",
            transcript,
            cancellationToken,
            storageKey,
            words);

        if (items.Count > 0)
        {
            var ids = items.Select(_ => Guid.CreateVersion7()).ToArray();
            var userIds = Enumerable.Repeat(userId, items.Count).ToArray();
            var dayIds = Enumerable.Repeat(dayId, items.Count).ToArray();
            var titles = items.Select(item => item.Title).ToArray();
            var durations = items.Select(item => (int?)item.PlannedDurationMinutes).ToArray();
            var starts = items.Select(item => item.PlannedStartMinute is int minute
                ? LocalClock.At(timezone, localDate, minute)
                : (DateTimeOffset?)null).ToArray();
            var areas = items.Select(item => (string?)item.LifeArea).ToArray();
            var sorts = Enumerable.Range(0, items.Count).ToArray();

            await using var insert = new NpgsqlCommand(
                """
                INSERT INTO commitments (
                  id, user_id, day_id, title, status, planned_at, planned_duration_minutes, life_area, source, sort_order)
                SELECT u.id, u.user_id, u.day_id, u.title, 'PLANNED', u.starts, u.mins, u.area, 'MORNING_EXTRACT', u.sort
                FROM UNNEST($1::uuid[], $2::uuid[], $3::uuid[], $4::text[], $5::timestamptz[], $6::int[], $7::text[], $8::int[])
                  AS u(id, user_id, day_id, title, starts, mins, area, sort)
                """,
                connection, tx)
            {
                Parameters =
                {
                    new NpgsqlParameter { Value = ids },
                    new NpgsqlParameter { Value = userIds },
                    new NpgsqlParameter { Value = dayIds },
                    new NpgsqlParameter { Value = titles },
                    new NpgsqlParameter { Value = starts, DataTypeName = "timestamptz[]" },
                    new NpgsqlParameter { Value = durations },
                    new NpgsqlParameter { Value = areas },
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
        string? storageKey = null,
        IReadOnlyList<SpokenWord>? words = null,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await BookSchema.EnsureAsync(connection, cancellationToken);
        await using var tx = await connection.BeginTransactionAsync(cancellationToken);

        var dayId = await UpsertDayAsync(connection, tx, userId, localDate, timezone, null, cancellationToken);
        await InsertSessionAsync(
            connection,
            tx,
            userId,
            dayId,
            "EVENING_REFLECTION",
            transcript,
            cancellationToken,
            storageKey,
            words);

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
            var areas = wins.Select(item => (string?)item.LifeArea).ToArray();

            await using var insert = new NpgsqlCommand(
                """
                INSERT INTO wins (id, user_id, day_id, title, source, life_area)
                SELECT u.id, u.user_id, u.day_id, u.title, 'EVENING_EXTRACT', u.life_area
                FROM UNNEST($1::uuid[], $2::uuid[], $3::uuid[], $4::text[], $5::text[])
                  AS u(id, user_id, day_id, title, life_area)
                """,
                connection, tx)
            {
                Parameters =
                {
                    new NpgsqlParameter { Value = ids },
                    new NpgsqlParameter { Value = userIds },
                    new NpgsqlParameter { Value = dayIds },
                    new NpgsqlParameter { Value = titles },
                    new NpgsqlParameter { Value = areas }
                }
            };
            await insert.ExecuteNonQueryAsync(cancellationToken);
        }

        await tx.CommitAsync(cancellationToken);
        return await LoadDayAsync(connection, userId, localDate, cancellationToken);
    }

    public async Task<DayRecord?> SaveMiddayAsync(
        Guid userId,
        Guid dayId,
        string timezone,
        string transcript,
        IReadOnlyList<PlannedItem> add,
        IReadOnlyList<OutcomeItem> outcomes,
        IReadOnlyList<WinItem> extras,
        string? storageKey = null,
        IReadOnlyList<SpokenWord>? words = null,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await BookSchema.EnsureAsync(connection, cancellationToken);
        var existing = await LoadDayByIdAsync(connection, userId, dayId, cancellationToken);
        if (existing is null)
        {
            return null;
        }

        if (existing.Clips.Any(clip => clip.Kind == "EVENING_REFLECTION"))
        {
            throw new InvalidOperationException("closed");
        }

        await using var tx = await connection.BeginTransactionAsync(cancellationToken);
        await InsertSessionAsync(
            connection,
            tx,
            userId,
            dayId,
            "MIDDAY_UPDATE",
            transcript,
            cancellationToken,
            storageKey,
            words);

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

        if (add.Count > 0)
        {
            var sortBase = existing.Commitments.Count;
            var ids = add.Select(_ => Guid.CreateVersion7()).ToArray();
            var userIds = Enumerable.Repeat(userId, add.Count).ToArray();
            var dayIds = Enumerable.Repeat(dayId, add.Count).ToArray();
            var titles = add.Select(item => item.Title).ToArray();
            var durations = add.Select(item => (int?)item.PlannedDurationMinutes).ToArray();
            var starts = add.Select(item => item.PlannedStartMinute is int minute
                ? LocalClock.At(timezone, existing.LocalDate, minute)
                : (DateTimeOffset?)null).ToArray();
            var areas = add.Select(item => (string?)item.LifeArea).ToArray();
            var sorts = Enumerable.Range(sortBase, add.Count).ToArray();

            await using var insert = new NpgsqlCommand(
                """
                INSERT INTO commitments (
                  id, user_id, day_id, title, status, planned_at, planned_duration_minutes, life_area, source, sort_order)
                SELECT u.id, u.user_id, u.day_id, u.title, 'PLANNED', u.starts, u.mins, u.area, 'MIDDAY_UPDATE', u.sort
                FROM UNNEST($1::uuid[], $2::uuid[], $3::uuid[], $4::text[], $5::timestamptz[], $6::int[], $7::text[], $8::int[])
                  AS u(id, user_id, day_id, title, starts, mins, area, sort)
                """,
                connection, tx)
            {
                Parameters =
                {
                    new NpgsqlParameter { Value = ids },
                    new NpgsqlParameter { Value = userIds },
                    new NpgsqlParameter { Value = dayIds },
                    new NpgsqlParameter { Value = titles },
                    new NpgsqlParameter { Value = starts, DataTypeName = "timestamptz[]" },
                    new NpgsqlParameter { Value = durations },
                    new NpgsqlParameter { Value = areas },
                    new NpgsqlParameter { Value = sorts }
                }
            };
            await insert.ExecuteNonQueryAsync(cancellationToken);
        }

        if (extras.Count > 0)
        {
            var ids = extras.Select(_ => Guid.CreateVersion7()).ToArray();
            var userIds = Enumerable.Repeat(userId, extras.Count).ToArray();
            var dayIds = Enumerable.Repeat(dayId, extras.Count).ToArray();
            var titles = extras.Select(item => item.Title).ToArray();
            var areas = extras.Select(item => (string?)item.LifeArea).ToArray();

            await using var insert = new NpgsqlCommand(
                """
                INSERT INTO wins (id, user_id, day_id, title, source, life_area)
                SELECT u.id, u.user_id, u.day_id, u.title, 'MIDDAY_UPDATE', u.life_area
                FROM UNNEST($1::uuid[], $2::uuid[], $3::uuid[], $4::text[], $5::text[])
                  AS u(id, user_id, day_id, title, life_area)
                """,
                connection, tx)
            {
                Parameters =
                {
                    new NpgsqlParameter { Value = ids },
                    new NpgsqlParameter { Value = userIds },
                    new NpgsqlParameter { Value = dayIds },
                    new NpgsqlParameter { Value = titles },
                    new NpgsqlParameter { Value = areas }
                }
            };
            await insert.ExecuteNonQueryAsync(cancellationToken);
        }

        await tx.CommitAsync(cancellationToken);
        return await LoadDayByIdAsync(connection, userId, dayId, cancellationToken);
    }

    public Task<DayRecord?> GetDayAsync(
        Guid userId,
        DateOnly localDate,
        CancellationToken cancellationToken = default)
    {
        return WithConnection(connection => LoadDayAsync(connection, userId, localDate, cancellationToken), cancellationToken);
    }

    public Task<DayRecord?> GetDayByIdAsync(
        Guid userId,
        Guid dayId,
        CancellationToken cancellationToken = default)
    {
        return WithConnection(connection => LoadDayByIdAsync(connection, userId, dayId, cancellationToken), cancellationToken);
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

    public async Task<DayRecord?> RenameDayAsync(
        Guid userId,
        Guid dayId,
        string title,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await BookSchema.EnsureAsync(connection, cancellationToken);
        await using var command = new NpgsqlCommand(
            """
            UPDATE days
            SET title = $1, updated_at = now()
            WHERE id = $2 AND user_id = $3
            RETURNING local_date
            """,
            connection)
        {
            Parameters =
            {
                new NpgsqlParameter { Value = title },
                new NpgsqlParameter { Value = dayId },
                new NpgsqlParameter { Value = userId }
            }
        };
        var date = ReadDate(await command.ExecuteScalarAsync(cancellationToken));
        return date is DateOnly localDate
            ? await LoadDayAsync(connection, userId, localDate, cancellationToken)
            : null;
    }

    public async Task<IReadOnlyList<string>> ListClipKeysAsync(
        Guid userId,
        Guid dayId,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await BookSchema.EnsureAsync(connection, cancellationToken);
        await using var command = new NpgsqlCommand(
            """
            SELECT storage_key
            FROM voice_sessions
            WHERE user_id = $1 AND day_id = $2 AND storage_key IS NOT NULL
            """,
            connection)
        {
            Parameters =
            {
                new NpgsqlParameter { Value = userId },
                new NpgsqlParameter { Value = dayId }
            }
        };

        var keys = new List<string>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            keys.Add(reader.GetString(0));
        }

        return keys;
    }

    public async Task<bool> RemoveDayAsync(Guid userId, Guid dayId, CancellationToken cancellationToken = default)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await BookSchema.EnsureAsync(connection, cancellationToken);
        await using var tx = await connection.BeginTransactionAsync(cancellationToken);
        foreach (var sql in new[]
        {
            "DELETE FROM commitments WHERE user_id = $1 AND day_id = $2",
            "DELETE FROM wins WHERE user_id = $1 AND day_id = $2",
            "DELETE FROM voice_sessions WHERE user_id = $1 AND day_id = $2",
            "DELETE FROM days WHERE user_id = $1 AND id = $2"
        })
        {
            await using var clear = new NpgsqlCommand(sql, connection, tx)
            {
                Parameters =
                {
                    new NpgsqlParameter { Value = userId },
                    new NpgsqlParameter { Value = dayId }
                }
            };
            await clear.ExecuteNonQueryAsync(cancellationToken);
        }

        await tx.CommitAsync(cancellationToken);
        return true;
    }

    public async Task<DayRecord?> MarkCommitmentAsync(
        Guid userId,
        Guid commitmentId,
        string status,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await BookSchema.EnsureAsync(connection, cancellationToken);
        await using var command = new NpgsqlCommand(
            """
            UPDATE commitments
            SET status = $1, updated_at = now()
            WHERE id = $2 AND user_id = $3
            RETURNING day_id
            """,
            connection)
        {
            Parameters =
            {
                new NpgsqlParameter { Value = status },
                new NpgsqlParameter { Value = commitmentId },
                new NpgsqlParameter { Value = userId }
            }
        };
        var dayId = await command.ExecuteScalarAsync(cancellationToken);
        return dayId is Guid id
            ? await LoadDayByIdAsync(connection, userId, id, cancellationToken)
            : null;
    }

    public async Task<DayRecord?> RemoveCommitmentAsync(
        Guid userId,
        Guid commitmentId,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await BookSchema.EnsureAsync(connection, cancellationToken);
        await using var command = new NpgsqlCommand(
            """
            DELETE FROM commitments
            WHERE id = $1 AND user_id = $2
            RETURNING day_id
            """,
            connection)
        {
            Parameters =
            {
                new NpgsqlParameter { Value = commitmentId },
                new NpgsqlParameter { Value = userId }
            }
        };
        var dayId = await command.ExecuteScalarAsync(cancellationToken);
        return dayId is Guid id
            ? await LoadDayByIdAsync(connection, userId, id, cancellationToken)
            : null;
    }

    public async Task<ClipPointer?> GetClipAsync(
        Guid userId,
        Guid clipId,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await BookSchema.EnsureAsync(connection, cancellationToken);
        await using var command = new NpgsqlCommand(
            """
            SELECT id, storage_key
            FROM voice_sessions
            WHERE id = $1 AND user_id = $2
            """,
            connection)
        {
            Parameters =
            {
                new NpgsqlParameter { Value = clipId },
                new NpgsqlParameter { Value = userId }
            }
        };

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        return new ClipPointer(
            reader.GetGuid(0),
            reader.IsDBNull(1) ? null : reader.GetString(1));
    }

    private async Task<Guid> UpsertDayAsync(
        NpgsqlConnection connection,
        NpgsqlTransaction tx,
        Guid userId,
        DateOnly localDate,
        string timezone,
        string? title,
        CancellationToken cancellationToken)
    {
        await using var command = new NpgsqlCommand(
            """
            INSERT INTO days (id, user_id, local_date, timezone, showed_up, title)
            VALUES ($1, $2, $3, $4, true, $5)
            ON CONFLICT (user_id, local_date) DO UPDATE
            SET timezone = EXCLUDED.timezone,
                showed_up = true,
                title = COALESCE(EXCLUDED.title, days.title),
                updated_at = now()
            RETURNING id
            """,
            connection, tx)
        {
            Parameters =
            {
                new NpgsqlParameter { Value = Guid.CreateVersion7() },
                new NpgsqlParameter { Value = userId },
                new NpgsqlParameter { Value = localDate },
                new NpgsqlParameter { Value = timezone },
                new NpgsqlParameter { Value = (object?)title ?? DBNull.Value }
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
        CancellationToken cancellationToken,
        string? storageKey = null,
        IReadOnlyList<SpokenWord>? words = null)
    {
        var packed = words is { Count: > 0 }
            ? JsonSerializer.Serialize(words, Json)
            : null;
        await using var command = new NpgsqlCommand(
            """
            INSERT INTO voice_sessions (id, user_id, day_id, kind, transcript, processing_status, storage_key, words)
            VALUES ($1, $2, $3, $4, $5, 'RECEIVED', $6, $7::jsonb)
            """,
            connection, tx)
        {
            Parameters =
            {
                new NpgsqlParameter { Value = Guid.CreateVersion7() },
                new NpgsqlParameter { Value = userId },
                new NpgsqlParameter { Value = dayId },
                new NpgsqlParameter { Value = kind },
                new NpgsqlParameter { Value = transcript },
                new NpgsqlParameter { Value = (object?)storageKey ?? DBNull.Value },
                new NpgsqlParameter { Value = (object?)packed ?? DBNull.Value }
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
            SELECT id, timezone, showed_up, title
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
        string? title;
        await using (var reader = await day.ExecuteReaderAsync(cancellationToken))
        {
            if (!await reader.ReadAsync(cancellationToken))
            {
                return null;
            }

            dayId = reader.GetGuid(0);
            timezone = reader.GetString(1);
            showedUp = reader.GetBoolean(2);
            title = reader.IsDBNull(3) ? null : reader.GetString(3);
        }

        var commitments = new List<CommitmentRecord>();
        await using (var list = new NpgsqlCommand(
            """
            SELECT id, title, status, planned_duration_minutes, actual_duration_minutes, planned_at, life_area, created_at
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
                DateTimeOffset? plannedAt = reader.IsDBNull(5)
                    ? null
                    : reader.GetFieldValue<DateTimeOffset>(5);
                commitments.Add(new CommitmentRecord(
                    reader.GetGuid(0),
                    reader.GetString(1),
                    reader.GetString(2),
                    reader.IsDBNull(3) ? null : reader.GetInt32(3),
                    reader.IsDBNull(4) ? null : reader.GetInt32(4),
                    plannedAt is DateTimeOffset at ? LocalClock.MinuteOfDay(timezone, at) : null,
                    reader.IsDBNull(6) ? null : reader.GetString(6),
                    reader.IsDBNull(7) ? null : reader.GetFieldValue<DateTimeOffset>(7)));
            }
        }

        var wins = new List<WinRecord>();
        await using (var list = new NpgsqlCommand(
            """
            SELECT id, title, life_area
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
                wins.Add(new WinRecord(
                    reader.GetGuid(0),
                    reader.GetString(1),
                    reader.IsDBNull(2) ? null : reader.GetString(2)));
            }
        }

        var clips = new List<ClipRecord>();
        await using (var list = new NpgsqlCommand(
            """
            SELECT id, kind, transcript, created_at, storage_key IS NOT NULL, words
            FROM voice_sessions
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
                clips.Add(new ClipRecord(
                    reader.GetGuid(0),
                    reader.GetString(1),
                    reader.GetString(2),
                    reader.IsDBNull(3) ? null : reader.GetFieldValue<DateTimeOffset>(3),
                    reader.GetBoolean(4),
                    ReadWords(reader, 5)));
            }
        }

        return new DayRecord(dayId, localDate, timezone, showedUp, title, commitments, wins, clips);
    }

    private async Task<DayRecord?> LoadDayByIdAsync(
        NpgsqlConnection connection,
        Guid userId,
        Guid dayId,
        CancellationToken cancellationToken)
    {
        await using var command = new NpgsqlCommand(
            """
            SELECT local_date
            FROM days
            WHERE id = $1 AND user_id = $2
            """,
            connection)
        {
            Parameters =
            {
                new NpgsqlParameter { Value = dayId },
                new NpgsqlParameter { Value = userId }
            }
        };
        var date = ReadDate(await command.ExecuteScalarAsync(cancellationToken));
        return date is DateOnly localDate
            ? await LoadDayAsync(connection, userId, localDate, cancellationToken)
            : null;
    }

    private static DateOnly? ReadDate(object? value) =>
        value switch
        {
            DateOnly date => date,
            DateTime dateTime => DateOnly.FromDateTime(dateTime),
            _ => null
        };

    private static IReadOnlyList<SpokenWord>? ReadWords(NpgsqlDataReader reader, int ordinal)
    {
        if (reader.IsDBNull(ordinal))
        {
            return null;
        }

        var raw = reader.GetString(ordinal);
        var words = JsonSerializer.Deserialize<List<SpokenWord>>(raw, Json);
        return words is { Count: > 0 } ? words : null;
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
