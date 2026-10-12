## Context

See `proposal.md` — Why. The rebuild uses four .NET projects sliced by volatility room. Identity is chapter 1. Implementation is green on `rebuild-api`; accessors are dev stubs.

## Goals / Non-Goals

**Goals:**

- VDD naming and folder layout for Identity
- Testable `/me` contract before real Firebase/Postgres adapters
- Clear dependency direction: Api → Application → Domain; Infrastructure implements Application ports

**Non-Goals:**

- Firebase token verification (next slice)
- Postgres persistence (next slice)
- Refresh tokens, roles, or session management
- Book, Hear, Reader, Health endpoints

## Decisions

### Volatility rooms, not feature nouns

Each folder under a project is a **volatility room** — what changes together, stays together.

| Layer | Identity room | Role |
|-------|---------------|------|
| **Client** | `GetGrounded.Api/Identity/` | HTTP door — `MeController`, `Bearer` header helper |
| **Manager** | `AuthManager` | Workflow: verify token → find/create user → ask engine |
| **Engine** | `AuthEngine` | Policy: reject tombstones (`DeletedAt != null`) |
| **Ports** | `IAuthTokenAccessor`, `IAuthUserAccessor` | Outbound contracts (Application owns these) |
| **Adapters** | `RejectAllAuthTokenAccessor`, `UnconfiguredAuthUserAccessor` | Dev stubs; real ones: `FirebaseAuthTokenAccessor`, `PostgresAuthUserAccessor` |
| **Domain** | `User` | Facts: `Id`, `LoginId`, `DeletedAt`; factories `Open` / `Tombstone` |

**Why:** When Firebase changes or Postgres schema moves, only the adapter changes. Tombstone rules live in `AuthEngine` forever unless product policy changes.

### `GET /me` is the only Identity endpoint for now

Mobile already has Firebase tokens. `/me` is the handshake: "give me your token, I'll give you our guid."

**Alternative considered:** Embed user id in custom JWT claims at login — rejected; we want Postgres to own the guid and tombstone state.

### Tombstone → 401, not 404

Deleted users look like unauthorized callers. Avoids leaking account existence.

### Test strategy

Integration tests (`MeTests`) spin the real `Program` with stub accessors. Four scenarios match the spec. No controller unit tests — the HTTP contract is the behavior.

## Risks / Trade-offs

- **[Risk] Dev stubs always 401 in Development** → Expected until Firebase/Postgres wired; tests use `WebApplicationFactory` overrides.
- **[Risk] `FindOrCreateAsync` race on first login** → Postgres adapter will need unique constraint on `login_id` + upsert; defer to Postgres slice.
- **[Trade-off] No `/me` caching** → Fine for v1; add if Firebase verify becomes hot path.

## Migration Plan

1. Ship Identity slice with stubs on `rebuild-api`.
2. Add `FirebaseAuthTokenAccessor` + `PostgresAuthUserAccessor`.
3. Point mobile `EXPO_PUBLIC_API_URL` at rebuild deployment.
4. Retire old API on `main` when parity reached.

## Open Questions

- Postgres schema: align with `docs/superpowers/specs/2026-08-26-overall-database-design.md` when Postgres slice starts.
