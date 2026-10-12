## 1. Domain & Application

- [x] 1.1 Add `User` with `Open` and `Tombstone` factories — verify compile
- [x] 1.2 Add `AuthEngine.Accept` tombstone rule — verify unit behavior via integration tests
- [x] 1.3 Add `IAuthTokenAccessor`, `IAuthUserAccessor`, `AuthManager.IdentifyAsync` — verify compile

## 2. Infrastructure stubs

- [x] 2.1 Add `RejectAllAuthTokenAccessor` and `UnconfiguredAuthUserAccessor` — verify DI registration in `Program.cs`

## 3. HTTP client

- [x] 3.1 Add `MeController` and `Bearer.Read` — verify route responds

## 4. Tests

- [x] 4.1 Add `MeTests` (4 scenarios) with stub accessors — verify `dotnet test GetGrounded.slnx` passes 4/4

## 5. Documentation

- [x] 5.1 OpenSpec change + living spec — verify `openspec validate --change rebuild-identity-auth`
- [x] 5.2 Architecture one-pager at `docs/architecture/vdd-map.md`

## 6. Next slice (not started)

- [ ] 6.1 `FirebaseAuthTokenAccessor` — verify with real Firebase token in dev
- [ ] 6.2 `PostgresAuthUserAccessor` — verify upsert + tombstone read from DB
