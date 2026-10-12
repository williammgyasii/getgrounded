## Why

The previous API mixed concerns and used naming that did not match our volatility-driven design (VDD). We deleted it and are rebuilding one volatility room at a time. Identity is the first room: every other feature needs a stable internal user id before Book, Hear, or Reader can ship.

## What Changes

- **BREAKING:** Old API surface removed. Only `GET /me` exists on the rebuild branch.
- New Identity slice: token verification → user lookup/create → tombstone rejection → `{ userId }` response.
- Dev stubs for accessors until Firebase and Postgres adapters land.
- Four passing integration tests lock the `/me` contract.

## Capabilities

### New Capabilities

- `identity`: Authenticate a caller from a Bearer token and return the app's internal user id.

### Modified Capabilities

<!-- none — greenfield rebuild -->

## Impact

- **API:** `GET /me` — 200 with `{ userId: guid }` or 401.
- **Code:** `api/GetGrounded.{Api,Application,Domain,Infrastructure,Tests}` under `Identity/` folders.
- **Not yet:** Firebase token verification, Postgres user persistence, Book/Hear/Reader/Health.
- **Mobile:** Continues to use Firebase tokens; will call `/me` once wired to the rebuild API.
