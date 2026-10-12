# GitHub Actions

One repo, eight pipelines. Path filters keep them apart. GitHub **environments** `dev` and `prod` hold secrets.

| Workflow | Paths | Environment | What |
|---|---|---|---|
| `api-dev.yml` | `api/**`, `api-worker/**` | — | Test .NET + typecheck API worker |
| `api-prod.yml` | `api/**`, `api-worker/**` | `prod` | Test .NET; on `main`, deploy **get-grounded-api** (Cloudflare Containers) |
| `mobile-dev.yml` | `mobile/**` | `dev` | `tsc`. EAS `development` only via **Run workflow** |
| `mobile-prod.yml` | `mobile/**` | `prod` | `tsc`. EAS `production` only via **Run workflow** |
| `website-dev.yml` | `website/**` | `dev` (preview only) | Lint + build on PR and `main`. PR preview deploy to Cloudflare Pages |
| `website-prod.yml` | `website/**` | `prod` | Lint + build + deploy **get-grounded-web** on `main` or **Run workflow** |
| `infra-dev.yml` | `infra/terraform/**` | `dev` | Validate + plan `environments/dev`. Apply is manual |
| `infra-prod.yml` | `infra/terraform/**` | `prod` | Validate + plan `environments/prod`. Apply is manual |

EAS does not run on every push (that would spend money). Prod API does not auto-create a Cloud Run service.

## Secrets

| Secret | Where | Used by |
|---|---|---|
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | `dev`, `prod` | Infra state |
| `CLOUDFLARE_API_TOKEN` or `CLOUDFLARE_EMAIL` + `CLOUDFLARE_API_KEY` | `dev`, `prod` | Infra, **website** Pages, **API** Workers + Containers |
| `CLOUDFLARE_ACCOUNT_ID` | `dev`, `prod` | Wrangler (`pages deploy`, `wrangler deploy`) |
| `VITE_LOOPS_FORM_ID` | `dev`, `prod` (optional) | Waitlist form at build time |
| `VITE_SUPPORT_EMAIL` | `prod` (optional) | Account deletion page |
| `VITE_HERO_VIDEO_URL` | `prod` (optional) | Landing hero video |
| `EXPO_TOKEN` | `dev`, `prod` | EAS |

**Cloudflare token (prod):** one token for Pages + API is fine. Minimum scopes:

- **Account → Workers Scripts → Edit** (deploy `get-grounded-api`, read/write Worker secrets)
- **Account → Cloudflare Pages → Edit** (deploy `get-grounded-web`)
- **Account → Account Settings → Read** (Wrangler account id)

Worker **runtime secrets** (`DATABASE_URL`, `FIREBASE_PROJECT_ID`, hear/R2 keys) live on the **`get-grounded-api`** Worker in Cloudflare (`wrangler secret put` or `deploy --secrets-file` from `api/.env`). CI **`wrangler deploy` does not pass secrets**; it keeps secrets already on the Worker.

Production: site **`get-grounded-web`** → **`get-grounded.app`**; API **`get-grounded-api`** → **`api.get-grounded.app`** (custom domains in Wrangler config).

This Mac still uses `~/.config/cloudflare/env`. Add `EXPO_TOKEN` after `eas login` + [Expo access token](https://expo.dev/accounts/[account]/settings/access-tokens). Run `eas init` in `mobile/` once so the project exists on Expo.
