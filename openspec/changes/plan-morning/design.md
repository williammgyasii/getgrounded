## Context

See `proposal.md` — Why. Identity slice is green with stub accessors (always 401 in dev). Mobile Plan wizard calls four endpoints; only `/me` exists on `rebuild-api`. Historical behavior lives on `main` (`BookService`, `ClipService`, `PostgresBookStore`, `DayInterpreter`); we re-slice by volatility room per `docs/architecture/vdd-map.md`. DB shape is locked in `docs/superpowers/specs/2026-08-26-phase1-book-design.md`.

## Goals / Non-Goals

**Goals:**

- Phone completes typed morning flow against local API + docker Postgres: extract → edit → save → Today desk + Work history update.
- VDD folders: `Book/` and `Hear/` with Controller → Manager → Engine → I*Accessor → *Accessor.
- Integration tests lock HTTP contracts before real adapters; Postgres accessor tests optional but dev uses real DB.
- Wire Identity adapters so Firebase tokens from the phone authenticate.

**Non-Goals:**

- Evening, midday, review, commitment PATCH/DELETE, day rename/delete.
- Clip playback (`GET /voice/clips/{id}`).
- Cloud Run deploy, Terraform, mobile UI changes.

## Decisions

### Slice order: Identity adapters → Book read/write → Hear extract → e2e verify

**Why:** Every Book/Hear route needs a real user id. Stubs block the phone even if Book code exists.

**Alternative:** Fake auth middleware for dev only — rejected; breaks parity with production and the Identity spec.

### Two volatility rooms, shared auth helper

| Layer | Book | Hear |
|-------|------|------|
| **Client** | `DaysController` | `VoiceController` |
| **Manager** | `PlanMorningManager`, `DeskManager`, `HistoryManager` | `PlanExtractManager` |
| **Engine** | `BookEngine` (streak, title sentence, showed-up rules) | `PlanExtractEngine` (morning parsing policy) |
| **Ports** | `IBookDayAccessor`, `IClock` | `IPlanExtractAccessor` (future LLM) |
| **Adapters** | `PostgresBookDayAccessor`, `SystemClock` | `ElevenLabsSpeechToTextAccessor`, `R2AudioClipAccessor`, `OpenAiPlanExtractAccessor`; heuristic fallback without keys |
| **Domain** | `LocalDay`, `Streak` | — (draft DTOs in Application) |

Controllers call `AuthManager.IdentifyAsync` via a shared `Bearer` helper—same pattern as `MeController`. Controllers do not run SQL or call Firebase.

### Postgres schema: follow phase-1 book design

Tables: `users`, `days`, `voice_sessions`, `commitments`, `wins`. Column `firebase_uid` maps to Domain `User.LoginId`. `BookSchema.EnsureAsync` on first connection (ported from main, renamed accessors).

**Why:** Mobile and historical docs already assume this shape; avoids a second migration story.

### Morning save semantics (match main)

1. Resolve `localDate` from timezone + UTC now (`LocalDay.From`).
2. Upsert `days` row for `(user_id, local_date)`.
3. Delete existing `MORNING_EXTRACT` commitments for that day; insert new ones with `PLANNED`.
4. Insert `voice_sessions` row: kind `MORNING_PLAN`, transcript, status `EXTRACTED`.
5. Set `showed_up = true`, optional title (sentence-cased).
6. Return `DayRecord` JSON (camelCase) matching mobile types.

Replacing morning plan same day clears prior extract commitments—not evening outcomes (evening not in scope).

### Streak calculation

`BookEngine` uses `Streak.Count(showedUpDates, todayLocalDate)` over distinct local dates where `showed_up` is true, same algorithm as main `Streak.cs`.

### Extract: OpenAI when keyed, heuristic fallback

**Decision:** `OpenAiPlanExtractAccessor` + `PlanExtractInterpreter` call GPT with structured JSON when `OPENAI_API_KEY` is set. Without the key, `HeuristicPlanExtractAccessor` splits lines for local tests and typed-only dev.

**Hear:** `HearManager` saves to R2 (or memory), then ElevenLabs Scribe returns the full transcript.

### JSON contract

ASP.NET default camelCase serialization. `DateOnly` → `"yyyy-MM-dd"`. `plannedStartMinute` on commitments (0–1439). Desk response matches `DeskRecord` in `mobile/src/lib/api.ts`.

### Test strategy (TDD)

1. **Red:** `PlanMorningTests`, `DeskTests`, `PlanExtractTests` using `WebApplicationFactory` + in-memory `MemoryBookDayAccessor` + fake auth accessors (pattern from `MeTests` / `IdentityFakes`).
2. **Green:** Application + Api layers.
3. **Integration:** `PostgresBookDayAccessor` against docker Postgres in one optional test or manual dev verify.
4. **E2e:** Phone Plan tab → local API; verify Today tab after save.

No controller unit tests—the HTTP contract is the behavior.

### Dev environment

```text
# api/.env — Neon connection string + Firebase project id
DATABASE_URL=postgresql://USER:PASSWORD@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
FIREBASE_PROJECT_ID=get-ground-448ca
dotnet run --project api/GetGrounded.Api
```

Schema is managed by **EF Core migrations** (`GroundedDbContext`), not hand-written SQL. Accessors use LINQ via `IDbContextFactory<GroundedDbContext>`.

Mobile: `EXPO_PUBLIC_API_URL=http://<mac-lan-ip>:5217`

## Risks / Trade-offs

- **[Risk] Heuristic extract quality is poor vs LLM** → Use OpenAI key in dev/prod; user edits on Check step either way.
- **[Risk] First-login race on user upsert** → Unique partial index on `(firebase_uid) WHERE deleted_at IS NULL` + catch conflict and re-read (same as Identity design note).
- **[Risk] Replacing morning plan deletes commitments user edited manually** → Same as main; manual corrections use `MANUAL_CORRECTION` source (out of scope until PATCH ships).
- **[Trade-off] Mic needs ElevenLabs key** → Without `ELEVENLABS_API_KEY`, `/voice/hear` returns 503; typed path still works.
- **[Trade-off] GET /days returns all days** → Fine for MVP; paginate when history grows.

## Migration Plan

1. Merge Identity adapters + Book/Hear on `rebuild-api`; validate with `dotnet test` and phone smoke test.
2. Dev continues against local Postgres; deployed rebuild waits for parity checklist.
3. Sync specs to `openspec/specs/book/` and `openspec/specs/hear/` via `/opsx-sync` after green.
4. Update `docs/architecture/vdd-map.md` with Book/Hear cast.

## Open Questions

None blocking—evening/midday extract and clip playback are deferred slices with known ports.
