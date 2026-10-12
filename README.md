# GetGrounded

Voice-first consistency companion.

**Stop tracking. Start talking. GetGrounded.**

## Repo layout

```text
website/                 Marketing site (Vite → Cloudflare Pages, get-grounded.app)
mobile/                  Expo app (React Native + TypeScript)
api/GetGrounded.Domain   Domain rules and entities
api/GetGrounded.Api      HTTP adapters
api/GetGrounded.Tests    Tests first, then implementation
infra/terraform          Cloudflare + GCP (dev). Prod folder is a stub.
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
| Docker | Local API (same image shape as Cloud Run) |
| Terraform 1.15 | Cloudflare R2 |
| GitHub CLI (`gh`) as `williammgyasii` | repo + PRs |
| EAS CLI 22 | Expo development builds later |
| gcloud | Cloud Run + Cloud SQL |
| Wrangler 4.12 | Cloudflare Workers / R2 |
| Firebase CLI 15 | Auth / App Check later |
| ElevenLabs CLI 0.5 | Scribe STT in dev |
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

Do **not** deploy to Cloud Run to try a mic tap. Point Expo at this Mac. Deploy only when a slice is ready.

```text
Phone  →  http://<mac-lan-ip>:5217  →  docker compose (api/)
                                    →  Neon Postgres (DATABASE_URL)
                                    →  ElevenLabs Scribe + OpenAI (api/.env)
Firebase Auth stays the live project (same login).
```

```bash
# Terminal 1 — API (Docker, same as Cloud Run)
cd api
docker compose up --build
```

```bash
# Terminal 2 — phone
cd mobile
# .env: EXPO_PUBLIC_API_URL=http://192.168.1.157:5217
npx expo start
```

Same Wi-Fi. Restart Metro after changing `EXPO_PUBLIC_API_URL`. If the phone cannot reach the LAN, USB:

```bash
adb reverse tcp:5217 tcp:5217
# then EXPO_PUBLIC_API_URL=http://127.0.0.1:5217
```

Hear/extract need `gcloud auth application-default login` once. Local Postgres is empty until you speak a morning. Cloud SQL stays on Cloud Run.

## CI / CD

Same repo, separate workflows (path filters):

| Workflow | Runs when | Does |
|---|---|---|
| `.github/workflows/ci.yml` | PR or push to `main` | Path-filtered test/build/plan — **no prod deploy** |
| `.github/workflows/release.yml` | Tag `v*` or **Run workflow** | Deploy API, website, EAS production |

Mobile is not gated until we build the app.

GitHub → GCP uses Workload Identity. No JSON key in the repo.

## GitHub

Personal repo under `williammgyasii`. Commits are authored as William Gyasi.
