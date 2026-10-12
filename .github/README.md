# GitHub Actions

One repo, eight pipelines. Path filters keep them apart. GitHub **environments** `dev` and `prod` hold secrets.

| Workflow | Paths | Environment | What |
|---|---|---|---|
| `api-dev.yml` | `api/**` | `dev` | Test. On `main`, deploy Cloud Run **dev** image |
| `api-prod.yml` | `api/**` | `prod` | Test. Deploy Cloud Run **prod** only via **Run workflow**. Refuses if `getgrounded-prod-api` does not exist |
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
| `CLOUDFLARE_API_TOKEN` or `CLOUDFLARE_EMAIL` + `CLOUDFLARE_API_KEY` | `dev`, `prod` | Infra provider, **website** Pages deploy |
| `CLOUDFLARE_ACCOUNT_ID` | `dev`, `prod` | **website** Wrangler (`pages deploy`) |
| `VITE_LOOPS_FORM_ID` | `dev`, `prod` (optional) | Waitlist form at build time |
| `VITE_SUPPORT_EMAIL` | `prod` (optional) | Account deletion page |
| `VITE_HERO_VIDEO_URL` | `prod` (optional) | Landing hero video |
| `EXPO_TOKEN` | `dev`, `prod` | EAS |

**Cloudflare token for Pages:** create an API token with **Account → Cloudflare Pages → Edit** (and **Account → Account Settings → Read** for account id). Same token can power Terraform if scopes overlap.

Production site project name: **`get-grounded-web`**. Custom domain **`get-grounded.app`** is attached in the Cloudflare dashboard, not in GitHub.

This Mac still uses `~/.config/cloudflare/env`. Add `EXPO_TOKEN` after `eas login` + [Expo access token](https://expo.dev/accounts/[account]/settings/access-tokens). Run `eas init` in `mobile/` once so the project exists on Expo.
