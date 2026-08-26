# GetGrounded — overall database design

This is the **whole book**, not the morning screen. Catalog: [`FEATURE-CATALOG.md`](../../FEATURE-CATALOG.md). Companion: [phase1-book-design](./2026-08-26-phase1-book-design.md).

Postgres is the system of record. Firebase is login only. R2 is bytes. Vertex is ears and drafts. `.NET` validates and writes. Stripe (later) is the receipt. Nothing important lives only in a JSON column or on the phone.

**Relational and transactional.** Foreign keys stay. Money, shares, and “did we book this clip?” are one SQL transaction. “No constraints” means: do not weld *product* into the wrong table (group on a personal day, `is_pro` on `users`, a stored streak). It does not mean drop FKs.

We do **not** create every table tonight. We lock the shape so Phase 1.1 cannot block families, seats, or a paywall.

---

## Layers (who owns what)

```text
identity        users, user_settings
paywall         customers, subscriptions, entitlements, usage_meters
personal book   days, clips, tasks, wins
repeating       goals, routines, goal_why_recordings
memory          memories (pgvector later)
people          orgs, org_members, pairs, share_grants
shared work     shared_goals, shared_goal_members
calls           call_preferences, call_sessions
review          weekly_reviews (facts are queries; this row is the generated week)
```

Keys point **down**. A child never owns its parent. Delete order: tombstone user → revoke shares → children → user → Firebase last.

Every durable row has `id UUID` (v7). Every personal fact has `user_id` (our id, never email, never Firebase uid).

---

## 1. Identity

### `users`

The person. Spine of the whole graph.

| Column | Notes |
|---|---|
| `id` | UUID v7. Partners, Stripe, orgs, days all point here. |
| `firebase_uid` | Login pointer. Unique while living. |
| `created_at` | |
| `deleted_at` | Tombstone first. Leftover JWT must 401. |

No email as a key. No `streak`. No `plan`. No `family_id`.

### `user_settings`

1:1 with `users`. Coach style, quiet hours, audio retention, timezone default, locale.

Settings are not the user. A missing row means product defaults.

---

## 2. Paywall

Checked only on the server. Mobile claims are decoration.

### `billing_customers`

1:1 with `users`. Stripe (or RevenueCat) customer id. Created when they first hit a paywall, not at sign-up.

### `subscriptions`

| Column | Notes |
|---|---|
| `user_id` | |
| `provider` | `STRIPE` \| `REVENUECAT` \| … |
| `provider_subscription_id` | |
| `status` | `TRIALING` \| `ACTIVE` \| `PAST_DUE` \| `CANCELED` |
| `current_period_end` | |
| `tier` | `FREE` is the absence of a live row, or an explicit free grant |

### `entitlements`

What a paid period unlocks: `COACH`, `ASK_MY_LIFE`, `CALLS`, `FAMILY_SEATS`, `WEEKLY_REVIEW`. One row per code. `.NET` asks “may this user start a call?” here, not on `users`.

### `usage_meters`

Call minutes, coach turns, seats used. Period + counter. Caps live here so Pro+ is not unlimited.

Webhooks update these tables in a transaction. Idempotent on provider event id (`billing_events` if we need a dedupe log).

**Do not** add `users.is_pro`. Tiers change. Grants stack (promo seat + paid coach).

---

## 3. Personal book (Phase 1 lives here)

One human. One local calendar date. One folder.

### `days`

The **date-folder**. Unique `(user_id, local_date)`. That unique key is correct for a person. It does **not** apply to a family.

| Extra when we name mornings | `title` TEXT NULL — “Heavy gym Tuesday” |

`showed_up` is the fact. Streak is **not** a column. `.NET` walks `showed_up` dates.

Groups never get a `days` row. Two people gymming share a **goal**, not a day.

### `clips` (today named `voice_sessions`)

One hearing. Kind: `MORNING_PLAN` \| `EVENING_REFLECTION` \| `MIDDAY_UPDATE` \| `WEEKLY_REVIEW` \| `COACH` \| `PHONE_CALL`. Transcript + `storage_key`. Never log the text. `conversation_id` unused.

### `tasks` (today named `commitments`)

Work on that folder. Status is not a boolean. `user_id` copied from the day for ledgers. No `UNPLANNED` status.

### `wins`

Unplanned truth. Own table. Not a task status.

**Transaction:** one spoken turn = insert/update day + clip + tasks/wins + `showed_up` in **one** commit.

---

## 4. Repeating life (Next)

### `goals`

Owned by `user_id`. Title, why-text optional. Not a day. Not a task.

### `goal_why_recordings`

R2 key. **Their** voice. Never TTS a fake why.

### `routines`

Owned by `user_id`. Weekday pattern, typical time, life area. A routine **spawns** `tasks` onto a `days` row. The task may point `routine_id` NULL until we detect one.

Routine ≠ task ≠ win. Three tables. Always.

---

## 5. Memory (Next / Later)

### `memories`

Explicit facts (“commute 45”) and later embeddings (`vector`, pgvector). `user_id`, source, importance, `deleted_at`. User can erase. No second vector database at first.

Ask My Life reads structured history + these rows. The model does not invent the score.

---

## 6. People (Later) — this is how 2+ users work

Never add `partner_id` or `org_id` to `days` or `tasks`.

### `orgs`

A named circle: couple, family, small group. `created_by`. Seat count comes from entitlements.

### `org_members`

`(org_id, user_id)` unique. Role: `OWNER` \| `ADULT` \| `CHILD` (if we ever need it) \| `MEMBER`. Invite state: `INVITED` \| `ACTIVE` \| `LEFT`.

A family of four is four `users`, one `org`, four `org_members`. Each still has their own `days`.

### `pairs`

Two-person accountability without a full org. `(user_a, user_b)` ordered. Unique pair.

### `share_grants`

Who may see what. Subject is a `user_id` (the book owner). Grantee is a `user_id` **or** an `org_id`.

Level: `STREAK_ONLY` \| `PROGRESS` \| `DAILY_SUMMARY` \| `FULL`.

**Never** auto-share transcripts or raw audio. FULL still does not mean R2 of the morning clip unless we add an explicit grant later.

### `shared_goals`

The joint aim (“gym this week”).

### `shared_goal_members`

`(shared_goal_id, user_id)`. Each member’s follow-through is **their** `tasks` on **their** `days`. Queries join; we do not merge books.

### `voice_drops`

Partner (or org) records encouragement. R2 key + `from_user_id` + `to_user_id` (or org). Play on a reminder. Not a transcript.

---

## 7. Streaks and Review (no streak table)

| Score | Source |
|---|---|
| Showing-up streak | Walk `days.showed_up` for one `user_id` |
| Follow-through % | Count `tasks` statuses in a window |
| Promise ledger | Same, 30 days |
| Family “we showed up” | Walk each member’s `days`, then aggregate in `.NET` |

Do **not** store `streak INT` on `users` or `orgs`. Partners with `STREAK_ONLY` get the computed number.

### `weekly_reviews`

Optional persisted week: `user_id`, week start, SQL fact snapshot, AI interpretation text. Facts can be regenerated. The row is the “we already wrote this week.”

Milestones later: `milestones` (user_id, kind, reached_at). Quiet. Not XP.

---

## 8. Calls (paid, later)

### `call_preferences`

Consent, quiet hours, max frequency, timezone. No consent row → no call.

### `call_sessions`

Twilio/Vertex id, started/ended, outcome, `clip_id` after we book the reflection. Meter increment in the **same** transaction as the session close.

---

## 9. Notifications

### `notification_preferences`

Per user, per kind (morning, evening, still-happening). Device tokens stay in Firebase/FCM, not as the source of truth for “may we ping.”

---

## What is live today vs locked for later

| Now (exists or Phase 1.1) | Locked, create when the feature ships |
|---|---|
| `users` | `user_settings` |
| `days` (+ `title` when we name mornings) | `billing_customers`, `subscriptions`, `entitlements`, `usage_meters` |
| `voice_sessions` → conceptually `clips` | `goals`, `routines`, `goal_why_recordings` |
| `commitments` → conceptually `tasks` | `memories` |
| `wins` | `orgs`, `org_members`, `pairs`, `share_grants` |
| | `shared_goals`, `shared_goal_members`, `voice_drops` |
| | `weekly_reviews`, `call_*`, `notification_preferences` |

Rename `voice_sessions` → `clips` and `commitments` → `tasks` in a **dedicated migration**, not mixed into UI work. Until then, code may say task and clip; SQL can keep old names for one release.

---

## Indexes

Index the **lookup**, not every column. Postgres already indexes PKs and UNIQUE keys. We add the rest so desk, streak, ledger, membership, and billing stay index-only as the book grows. `db-f1-micro` pays for extra writes — no unused indexes.

### Live now (Phase 1.1)

| Name | On | Query |
|---|---|---|
| `users_firebase_uid_living_uidx` | `users (firebase_uid) WHERE deleted_at IS NULL` | Login → living person |
| unique `(user_id, local_date)` | `days` | One folder per calendar date |
| `days_user_date_desc_idx` | `days (user_id, local_date DESC)` | History window |
| `days_user_showed_up_idx` | `days (user_id, local_date DESC) WHERE showed_up` | Streak walk |
| `commitments_user_day_sort_idx` | `commitments (user_id, day_id, sort_order, created_at)` | Load today's plan |
| `wins_user_day_created_idx` | `wins (user_id, day_id, created_at)` | Load wins for a day |
| `voice_sessions_user_created_idx` | `voice_sessions (user_id, created_at DESC)` | Recent clips |
| `voice_sessions_day_idx` | `voice_sessions (day_id)` | Clips on one folder |

Do **not** index `title`, `transcript`, or status until a query filters them. Follow-through later: `(user_id, status)` on tasks, not now.

### Locked for later (create with the table)

| Table | Indexes |
|---|---|
| `user_settings` | unique `(user_id)` |
| `billing_customers` | unique `(user_id)`; unique `(provider, provider_customer_id)` |
| `subscriptions` | `(user_id, status)`; unique `(provider, provider_subscription_id)` |
| `entitlements` | unique `(user_id, code)` |
| `usage_meters` | unique `(user_id, period, kind)` |
| `billing_events` | unique `(provider_event_id)` |
| `goals` | `(user_id, created_at DESC)` |
| `routines` | `(user_id)` |
| `goal_why_recordings` | `(goal_id)` |
| `memories` | `(user_id)`; pgvector later |
| `org_members` | unique `(org_id, user_id)`; `(user_id)` |
| `pairs` | unique `(user_a, user_b)` |
| `share_grants` | `(subject_user_id)`; `(grantee_user_id)`; `(grantee_org_id)` |
| `shared_goals` | `(created_by)` |
| `shared_goal_members` | unique `(shared_goal_id, user_id)` |
| `voice_drops` | `(to_user_id, created_at DESC)` |
| `weekly_reviews` | unique `(user_id, week_start)` |
| `milestones` | unique `(user_id, kind)` |
| `call_preferences` | unique `(user_id)` |
| `call_sessions` | `(user_id, started_at DESC)` |
| `notification_preferences` | unique `(user_id, kind)` |

Every FK that is not already the left side of a unique/composite index gets its own btree when that table is created. Postgres does **not** index FKs for you.

---

## Constraints we keep

- UUID PKs  
- `REFERENCES … ON DELETE RESTRICT`  
- Unique living `firebase_uid`  
- Unique personal `(user_id, local_date)`  
- Unique `(org_id, user_id)` on members  
- Unique provider event ids for billing  

## Constraints we refuse

- `days.group_id`  
- `users.plan` / `users.streak`  
- Email as identity  
- Day-as-JSON  
- Sharing by copying transcripts  
- Firestore as a second book  

---

## Out of this document

Expo screens, Vertex Agent Engine, Stripe product ids, the morning wizard UI. Those consume this book. They do not replace it.
