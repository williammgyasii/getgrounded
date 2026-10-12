## Why

The mobile Plan tab already runs the morning wizard (type or speak → extract → check → save), but the rebuild API only answers `GET /me`. Until Book and Hear endpoints exist—and Identity can verify real Firebase tokens against Postgres—the phone cannot complete the core loop locally. This change ships the smallest slice that proves "Plan today → Today desk shows commitments → Work ledger has the day."

## What Changes

- **Book room:** Postgres schema for users/days/commitments/voice_sessions; `GET /days/today`, `GET /days`, `POST /days/morning`.
- **Hear room:** `POST /voice/extract` for `kind: MORNING_PLAN` only (typed transcript in; structured draft out).
- **Identity adapters:** Wire `FirebaseAuthTokenAccessor` and `PostgresAuthUserAccessor` so authenticated mobile calls succeed against local API + docker Postgres.
- **VDD layout:** New `Book/` and `Hear/` folders in Api, Application, Domain, Infrastructure, Tests—same pattern as Identity.
- **Non-goals for this change:** evening/midday/review endpoints, clip playback, follow-through math.

## Capabilities

### New Capabilities

- `book`: Persist and read daily plans—the morning save, today's desk (streak + today/yesterday), and history list the Work tab needs.
- `hear`: Turn a morning transcript into a checkable draft before save.

### Modified Capabilities

<!-- Identity behavior is already specified; this change implements real adapters but does not change /me requirements. -->

## Impact

- **API routes:** `GET /days/today`, `GET /days`, `POST /days/morning`, `POST /voice/extract` (MORNING_PLAN).
- **Mobile:** No UI changes—existing RTK endpoints in `mobile/src/store/api.ts` should work once API matches contracts in `mobile/src/lib/api.ts`.
- **Database:** Postgres via `api/docker-compose.yml`; schema from `docs/superpowers/specs/2026-08-26-phase1-book-design.md`.
- **Dependencies:** Npgsql, Firebase Admin SDK (token verify), optional clock port for testable "today."
- **Dev flow:** `DATABASE_URL`, Firebase project creds in `api/.env`; phone `EXPO_PUBLIC_API_URL` → Mac LAN IP.
- **Architecture doc:** Extend `docs/architecture/vdd-map.md` with Book and Hear cast after ship.
