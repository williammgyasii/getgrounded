# Phase 1 book — database design

Locked for slice 1 of the MVP loop: identity + the day book. No routines, goals, memories, partners, or phone calls.

Philosophy: Firebase rents the login. Postgres owns the person. Delete GetGrounded erases the book, then burns the login. Same email later is a new person. Never stitch by email.

---

## Identity

```text
Bearer token
  → Firebase verifies uid U
  → users WHERE firebase_uid = U AND deleted_at IS NULL
  → if none: INSERT id = uuid v7, firebase_uid = U
  → if row exists and deleted_at IS NOT NULL: 401, do not INSERT
  → every other table uses users.id
```

| Rule | Why |
|---|---|
| `users.id` is UUID v7 | Our spine. Time-ordered inserts on `db-f1-micro`. |
| `firebase_uid` unique on living rows | Login pointer, not the person. |
| New Firebase uid → new GUID | Uids are never reused. Email is not a key. |
| `deleted_at` set first | A leftover JWT (~1 hour) must already 401. |
| Children `ON DELETE RESTRICT` | A user row cannot vanish while a day still points at it. |
| Delete order | Mark `deleted_at` → sessions / commitments / wins / days → user → Firebase last. |
| Firebase already gone | That last step is success. |
| Sign out | Tokens only. Not delete. |

Phase 1 You-screen can stay Sign out. The columns make a later Delete account safe.

`/me` returns `{ userId }` as **our** GUID string, not the Firebase uid.

---

## Tables

Five tables. One job each. Keys point down only.

### `users`

| Column | Type | Notes |
|---|---|---|
| `id` | `UUID` PK | Issued by us, v7. |
| `firebase_uid` | `TEXT` NOT NULL | Current login. |
| `created_at` | `TIMESTAMPTZ` NOT NULL | Default `now()`. |
| `deleted_at` | `TIMESTAMPTZ` NULL | Set first on account erase. |

Living login lookup: unique `(firebase_uid) WHERE deleted_at IS NULL`.

After delete we may keep the row as a tombstone (so `Ensure` cannot mint a second GUID for that uid) or null `firebase_uid`. Prefer **keep `firebase_uid` on the tombstone** — Firebase never reuses uids — and refuse insert when any row with that uid exists.

### `days`

| Column | Type | Notes |
|---|---|---|
| `id` | `UUID` PK | v7. |
| `user_id` | `UUID` NOT NULL | `REFERENCES users(id) ON DELETE RESTRICT` |
| `local_date` | `DATE` NOT NULL | The person's calendar date. |
| `timezone` | `TEXT` NOT NULL | IANA snapshot from the phone at create. |
| `showed_up` | `BOOLEAN` NOT NULL | Default false. `.NET` sets true after an honest morning or night. |
| `created_at` | `TIMESTAMPTZ` NOT NULL | Default `now()`. |
| `updated_at` | `TIMESTAMPTZ` NOT NULL | Default `now()`. |

Unique `(user_id, local_date)`.

`days` does **not** store `morning_session_id`. That would cycle: day → session → day.

### `voice_sessions`

| Column | Type | Notes |
|---|---|---|
| `id` | `UUID` PK | v7. |
| `user_id` | `UUID` NOT NULL | `REFERENCES users(id) ON DELETE RESTRICT` |
| `day_id` | `UUID` NOT NULL | `REFERENCES days(id) ON DELETE RESTRICT` |
| `kind` | `TEXT` NOT NULL | `MORNING_PLAN` \| `EVENING_REFLECTION` \| `MIDDAY_UPDATE` |
| `transcript` | `TEXT` NOT NULL | Typed stand-in now; STT later. Never log this. |
| `processing_status` | `TEXT` NOT NULL | `RECEIVED` \| `EXTRACTED` \| `FAILED` |
| `conversation_id` | `TEXT` NULL | Unused. Not an ElevenLabs or Vertex id. |
| `storage_key` | `TEXT` NULL | R2 later. |
| `created_at` | `TIMESTAMPTZ` NOT NULL | Default `now()`. |

### `commitments`

| Column | Type | Notes |
|---|---|---|
| `id` | `UUID` PK | v7. |
| `user_id` | `UUID` NOT NULL | Copy of the day's user for ledger queries. Must match `days.user_id`. |
| `day_id` | `UUID` NOT NULL | `REFERENCES days(id) ON DELETE RESTRICT` |
| `title` | `TEXT` NOT NULL | |
| `status` | `TEXT` NOT NULL | `PLANNED` \| `COMPLETED` \| `PARTIAL` \| `MISSED` \| `RESCHEDULED` \| `CANCELLED` \| `BLOCKED` |
| `planned_at` | `TIMESTAMPTZ` NULL | |
| `planned_duration_minutes` | `INT` NULL | |
| `actual_duration_minutes` | `INT` NULL | Accomplishment of a plan (`read 20` → `35`). |
| `life_area` | `TEXT` NULL | Never required. |
| `reason` | `TEXT` NULL | |
| `source` | `TEXT` NOT NULL | `MORNING_EXTRACT` \| `MIDDAY_UPDATE` \| `MANUAL_CORRECTION` |
| `confidence` | `REAL` NULL | |
| `sort_order` | `INT` NOT NULL | Default 0. |
| `created_at` | `TIMESTAMPTZ` NOT NULL | Default `now()`. |
| `updated_at` | `TIMESTAMPTZ` NOT NULL | Default `now()`. |

No `UNPLANNED` status. That is a `wins` row.

`user_id` is denormalized. Application checks it equals the day's user. No FK to `users` required if we always write it from the day; still add `REFERENCES users(id) ON DELETE RESTRICT` so a stray id cannot land.

### `wins`

| Column | Type | Notes |
|---|---|---|
| `id` | `UUID` PK | v7. |
| `user_id` | `UUID` NOT NULL | `REFERENCES users(id) ON DELETE RESTRICT` |
| `day_id` | `UUID` NOT NULL | `REFERENCES days(id) ON DELETE RESTRICT` |
| `title` | `TEXT` NOT NULL | |
| `source` | `TEXT` NOT NULL | `EVENING_EXTRACT` \| `MIDDAY_UPDATE` \| `MANUAL_CORRECTION` |
| `created_at` | `TIMESTAMPTZ` NOT NULL | Default `now()`. |

Unplanned truth. Not a failed commitment.

---

## Indexes

| Name | On | For |
|---|---|---|
| `users_firebase_uid_living_uidx` | `users (firebase_uid) WHERE deleted_at IS NULL` | Login |
| `days_user_local_date_uidx` | `days (user_id, local_date)` UNIQUE | Today |
| `days_user_date_desc_idx` | `days (user_id, local_date DESC)` | History |
| `days_user_showed_up_idx` | `days (user_id, local_date DESC) WHERE showed_up` | Streak walk |
| `commitments_user_day_sort_idx` | `commitments (user_id, day_id, sort_order, created_at)` | Today's plan |
| `wins_user_day_created_idx` | `wins (user_id, day_id, created_at)` | Ledger |
| `voice_sessions_user_created_idx` | `voice_sessions (user_id, created_at DESC)` | Recent voice |
| `voice_sessions_day_idx` | `voice_sessions (day_id)` | Sessions for a day |

---

## Batching

One transaction per spoken turn:

1. `INSERT INTO days … ON CONFLICT (user_id, local_date) DO UPDATE SET updated_at = now() RETURNING id`
2. Insert one `voice_sessions` row
3. Morning: `INSERT INTO commitments … SELECT * FROM UNNEST(...)`
4. Evening: `UPDATE commitments AS c SET … FROM UNNEST(...) AS u WHERE c.id = u.id AND c.user_id = $user`
5. Wins: same `UNNEST` insert
6. Set `days.showed_up`

No per-row insert loop. Evening updates always include `user_id` in the `WHERE`.

---

## Streak

`showed_up` is the stored fact. The number on Today is computed in `.NET`:

```text
walk local_date DESC where showed_up
stop at the first gap
count consecutive days (today or yesterday may start the run)
```

The LLM never invents this number.

---

## Live `users` table

Dev already has `users (id TEXT PK)` where `id` is the Firebase uid. Rewrite that table when we migrate. Do not keep both shapes. Dev is small.

---

## Out of scope

Routines, goals, memories, follow-through %, recovery copy, weekly review, R2 deletes (nullable `storage_key` only), Delete account HTTP (columns only), Quick Log STT, Agents as the book.
