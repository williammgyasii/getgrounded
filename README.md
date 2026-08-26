# GetGrounded

Voice-first consistency companion.

**Stop tracking. Start talking. GetGrounded.**

## Repo layout

```text
mobile/                  Expo app (React Native + TypeScript)
api/GetGrounded.Domain   Domain rules and entities
api/GetGrounded.Api      HTTP adapters
api/GetGrounded.Tests    Tests first, then implementation
infra/terraform          R2 + Render objects (`dev`, `prod`)
infra/cloudflare         Worker / Workflow source (Wrangler)
infra/firebase           Auth, Analytics, FCM, App Check
infra/elevenlabs         Voice agents (CLI)
docs/                    Specs and plans
.github/workflows        CI
```

PostgreSQL is the source of truth. The mobile app never talks to the database directly.

## Tooling

Already on this machine:

| Tool | Why |
|---|---|
| Node 26 / npm 11 | Expo |
| .NET 10 | API |
| Docker | API container |
| Terraform 1.15 | R2 + Render objects (`dev`, `prod`) |
| GitHub CLI (`gh`) as `williammgyasii` | repo + PRs |
| EAS CLI 22 | Expo development builds later |
| Render CLI 2.24 | API + Postgres hosting |
| Wrangler 4.12 | Cloudflare Workers / R2 |
| Firebase CLI 15 | Auth / App Check later |
| ElevenLabs CLI 0.5 | Agents as code later |
| `dotnet ef` | migrations later |
| Postgres client | local DB later |
| Xcode | iOS simulator |

Install when we need native binaries, not now:

- Java — Android builds
- CocoaPods — iOS native modules
- Watchman — faster Metro reloads

Firebase CLI warns that it prefers Node 20/22/24. We can switch the mobile toolchain to Node 22 LTS later if that becomes a problem.

Check versions:

```bash
bash scripts/check-tooling.sh
```

## Run locally

```bash
cd mobile
npm install
npx expo start
```

```bash
cd api
dotnet run --project GetGrounded.Api
```

## CI

GitHub Actions (`.github/workflows/ci.yml`) currently:

- builds the API
- typechecks the Expo app
- formats and validates Terraform (`dev` and `prod`)

Domain tests are not in CI yet. They are still red on purpose until the first types exist.

## GitHub

Personal repo under `williammgyasii`. Commits are authored as William Gyasi.
