## 1. Identity adapters (prerequisite for phone e2e)

- [x] 1.1 Add `FirebaseAuthTokenAccessor` implementing `IAuthTokenAccessor` and verify a real Firebase ID token returns the login id in a dev smoke test
- [x] 1.2 Add `PostgresAuthUserAccessor` with schema ensure, upsert on first login, tombstone read — verify `MeTests`-style scenario against docker Postgres returns stable `userId`
- [x] 1.3 Register real accessors in `DependencyInjection` when `DATABASE_URL` and Firebase config are present; keep stubs when missing — verify `dotnet test` still passes with test overrides

## 2. Domain & shared facts

- [x] 2.1 Port `LocalDay` and `Streak` into `GetGrounded.Domain/Book/` and verify unit tests for streak edge cases (empty, gap, consecutive)
- [x] 2.2 Add `IClock` port + `SystemClock` adapter for testable "today" — verify fake clock drives `LocalDay` in tests

## 3. Book — failing tests first

- [x] 3.1 Add `PlanMorningTests`: 401 without token, 400 empty commitments, 200 saves day — verify tests fail before implementation
- [x] 3.2 Add `DeskTests`: empty desk, desk after save with streak — verify tests fail before implementation
- [x] 3.3 Add `HistoryTests`: list after save — verify tests fail before implementation
- [x] 3.4 Add `MemoryBookDayAccessor` in test fakes — verify compile

## 4. Book — application layer

- [x] 4.1 Add `BookRecords` DTOs matching mobile JSON shapes — verify compile
- [x] 4.2 Add `BookEngine` (streak, title sentence, showed-up policy) — verify streak unit tests pass
- [x] 4.3 Add `IBookDayAccessor` port and `PlanMorningManager`, `DeskManager`, `HistoryManager` — verify managers compile

## 5. Book — HTTP client

- [x] 5.1 Add `DaysController` with auth gate, `POST /days/morning`, `GET /days/today`, `GET /days` — verify `PlanMorningTests`, `DeskTests`, `HistoryTests` pass with memory accessor

## 6. Book — Postgres adapter

- [x] 6.1 Add `BookSchema` + `DatabaseUrl` helper under `Infrastructure/Book/` — verify schema creates tables against docker Postgres
- [x] 6.2 Add `PostgresBookDayAccessor` (save morning, load desk, list history) — verify manual save/load via HTTP against local API + Postgres

## 7. Hear — failing tests first

- [x] 7.1 Add `PlanExtractTests`: 401, 400 blank transcript, 400 bad kind, 501 evening kind, 200 multi-line transcript — verify tests fail before implementation

## 8. Hear — application + HTTP

- [x] 8.1 Add `PlanExtractEngine` + `HeuristicPlanExtractAccessor` behind `IPlanExtractAccessor` — verify extract tests pass
- [x] 8.2 Add `VoiceController` with `POST /voice/extract` (MORNING_PLAN only) — verify `PlanExtractTests` pass

## 9. End-to-end verification

- [x] 9.1 Start docker Postgres, API on `0.0.0.0:5217`, Metro + Android dev client — verify `scripts/restart-servers.sh` or manual equivalent
- [x] 9.2 On phone: Plan tab → Muse clarify → Save → Plan home shows tasks and coach note — verify visually

## 11. Muse coach (clarify + voice + persist)

- [x] 11.1 `POST /voice/clarify` + tests (heuristic + HTTP)
- [x] 11.2 Mobile flow: review → clarify (type/voice answers) → extract with coach note
- [x] 11.3 Persist `coachNote` on days (migration + `POST /days/morning`)
- [x] 11.4 Plan home shows Muse note; on-device speech for clarify prompts (`expo-speech`)
- [x] 11.5 Sync hear/book specs to `openspec/specs/`
- [x] 9.3 Run `dotnet test GetGrounded.slnx` — verify all tests green
- [x] 9.4 Run `openspec validate plan-morning --strict` — verify planning artifacts pass

## 10. Documentation

- [x] 10.1 Extend `docs/architecture/vdd-map.md` with Book and Hear cast + story — verify readable one-pager
- [x] 10.2 Update `api/README.md` with docker Postgres + env vars for this slice — verify a new dev can follow steps
