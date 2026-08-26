using Npgsql;

namespace GetGrounded.Infrastructure.Data;

internal static class BookSchema
{
    public static async Task EnsureAsync(NpgsqlConnection connection, CancellationToken cancellationToken)
    {
        await using var type = new NpgsqlCommand(
            """
            SELECT data_type
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'id'
            """,
            connection);
        var idType = await type.ExecuteScalarAsync(cancellationToken) as string;

        if (idType == "text")
        {
            await using var rewrite = new NpgsqlCommand(
                """
                ALTER TABLE users RENAME TO users_legacy;
                CREATE TABLE users (
                  id UUID PRIMARY KEY,
                  firebase_uid TEXT NOT NULL UNIQUE,
                  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                  deleted_at TIMESTAMPTZ NULL
                );
                INSERT INTO users (id, firebase_uid, created_at)
                SELECT gen_random_uuid(), id, created_at FROM users_legacy;
                DROP TABLE users_legacy;
                """,
                connection);
            await rewrite.ExecuteNonQueryAsync(cancellationToken);
        }

        await using var create = new NpgsqlCommand(
            """
            CREATE TABLE IF NOT EXISTS users (
              id UUID PRIMARY KEY,
              firebase_uid TEXT NOT NULL UNIQUE,
              created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
              deleted_at TIMESTAMPTZ NULL
            );

            CREATE TABLE IF NOT EXISTS days (
              id UUID PRIMARY KEY,
              user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
              local_date DATE NOT NULL,
              timezone TEXT NOT NULL,
              showed_up BOOLEAN NOT NULL DEFAULT false,
              created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
              updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
              UNIQUE (user_id, local_date)
            );

            CREATE TABLE IF NOT EXISTS voice_sessions (
              id UUID PRIMARY KEY,
              user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
              day_id UUID NOT NULL REFERENCES days(id) ON DELETE RESTRICT,
              kind TEXT NOT NULL,
              transcript TEXT NOT NULL,
              processing_status TEXT NOT NULL,
              conversation_id TEXT NULL,
              storage_key TEXT NULL,
              created_at TIMESTAMPTZ NOT NULL DEFAULT now()
            );

            CREATE TABLE IF NOT EXISTS commitments (
              id UUID PRIMARY KEY,
              user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
              day_id UUID NOT NULL REFERENCES days(id) ON DELETE RESTRICT,
              title TEXT NOT NULL,
              status TEXT NOT NULL,
              planned_at TIMESTAMPTZ NULL,
              planned_duration_minutes INT NULL,
              actual_duration_minutes INT NULL,
              life_area TEXT NULL,
              reason TEXT NULL,
              source TEXT NOT NULL,
              confidence REAL NULL,
              sort_order INT NOT NULL DEFAULT 0,
              created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
              updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
            );

            CREATE TABLE IF NOT EXISTS wins (
              id UUID PRIMARY KEY,
              user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
              day_id UUID NOT NULL REFERENCES days(id) ON DELETE RESTRICT,
              title TEXT NOT NULL,
              source TEXT NOT NULL,
              created_at TIMESTAMPTZ NOT NULL DEFAULT now()
            );

            CREATE UNIQUE INDEX IF NOT EXISTS users_firebase_uid_living_uidx
              ON users (firebase_uid) WHERE deleted_at IS NULL;
            CREATE INDEX IF NOT EXISTS days_user_date_desc_idx
              ON days (user_id, local_date DESC);
            CREATE INDEX IF NOT EXISTS days_user_showed_up_idx
              ON days (user_id, local_date DESC) WHERE showed_up;
            CREATE INDEX IF NOT EXISTS commitments_day_sort_idx
              ON commitments (day_id, sort_order);
            CREATE INDEX IF NOT EXISTS commitments_user_day_idx
              ON commitments (user_id, day_id);
            CREATE INDEX IF NOT EXISTS wins_user_day_idx
              ON wins (user_id, day_id);
            CREATE INDEX IF NOT EXISTS voice_sessions_user_created_idx
              ON voice_sessions (user_id, created_at DESC);
            CREATE INDEX IF NOT EXISTS voice_sessions_day_idx
              ON voice_sessions (day_id);
            """,
            connection);
        await create.ExecuteNonQueryAsync(cancellationToken);
    }
}
