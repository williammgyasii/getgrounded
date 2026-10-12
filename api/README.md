# GetGrounded API — rebuild

Four walls. One volatility room at a time.

```text
GetGrounded.Api             Client (HTTP)
GetGrounded.Application     Managers + ports
GetGrounded.Domain          facts
GetGrounded.Infrastructure  Access adapters (EF Core → Neon)
GetGrounded.Tests           red first
```

## Specs (read first)

| Doc | What |
|-----|------|
| [`openspec/specs/identity/spec.md`](../openspec/specs/identity/spec.md) | `/me` behavior contract |
| [`openspec/changes/plan-morning/`](../openspec/changes/plan-morning/) | Book + Hear morning slice |
| [`docs/architecture/vdd-map.md`](../docs/architecture/vdd-map.md) | VDD layers, naming, cast |

## Shipped on `rebuild-api`

| Room | Endpoints | Status |
|------|-----------|--------|
| **Identity** | `GET /me` | ✅ tests + Firebase/Neon adapters when configured |
| **Book** | `GET /days/today`, `GET /days`, `POST /days/morning` | ✅ EF Core + Neon |
| **Hear** | `POST /voice/hear`, `POST /voice/extract` (`MORNING_PLAN`) | ✅ Scribe + R2 + GPT when keys set; heuristic extract fallback |

Not yet: evening/midday extract, clip playback, commitment PATCH/DELETE.

## Local dev (Docker API + Neon)

The API runs in **Docker** locally — same container shape as Cloud Run (`8080` inside, **`5217`** on your Mac). **Neon Postgres** holds data (no local database container).

### 1. Environment

Copy `api/.env.example` → `api/.env`. Neon project: **getgrounded-dev**.

```bash
# Create project (once)
neon projects create --name getgrounded-dev --pg-version 17 --org-id org-round-water-13421232

# Write connection string into api/.env
neon connection-string --project-id withered-recipe-12108132 --database-name neondb --role-name neondb_owner

DATABASE_URL=<paste uri>?sslmode=require
FIREBASE_PROJECT_ID=get-ground-448ca
ELEVENLABS_API_KEY=<scribe>
OPENAI_API_KEY=<extract>
# Optional R2 (memory store when unset):
# R2_ACCOUNT_ID= R2_BUCKET= R2_ACCESS_KEY_ID= R2_SECRET_ACCESS_KEY=
```

`LocalEnv.Load()` reads `api/.env` on startup. When `DATABASE_URL` and `FIREBASE_PROJECT_ID` are set, real accessors register and **EF migrations apply automatically** in Development.

### 2. Migrations (manual)

```bash
cd api
dotnet ef migrations add <Name> --project GetGrounded.Infrastructure --startup-project GetGrounded.Api
dotnet ef database update --project GetGrounded.Infrastructure --startup-project GetGrounded.Api
```

Migrations live in `GetGrounded.Infrastructure/Migrations/`.

### 3. Run

```bash
# From repo root (API + Metro + phone)
./scripts/restart-servers.sh device

# Or API only
cd api
docker compose up --build
```

Tests (host, not in container):

```bash
cd api
dotnet test GetGrounded.slnx --filter "Category!=Integration"
```

Integration tests (Neon round-trip) run only when `DATABASE_URL` in `api/.env` points at Neon:

```bash
dotnet test GetGrounded.slnx --filter "Category=Integration"
```

Local URL: `http://0.0.0.0:5217`. Phone: `EXPO_PUBLIC_API_URL=http://<mac-lan-ip>:5217` in `mobile/.env`.

### 4. Morning flow smoke

Plan tab → record or type → Extract → Save → Today + Work show the day.

## Data layer

| Piece | Role |
|-------|------|
| `GroundedDbContext` | EF Core model for users, days, commitments, voice_sessions, wins |
| `PostgresBookDayAccessor` | Book port — LINQ, no hand-written SQL |
| `PostgresAuthUserAccessor` | Identity port — user upsert via EF |
| `DatabaseUrl` | Parses Neon `DATABASE_URL` URI (SSL required by default) |

Without `DATABASE_URL`, dev stubs reject tokens (unit tests override via `WebApplicationFactory`).
