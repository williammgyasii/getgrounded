# GitHub Actions

Four pipelines, one GitHub **environment** (`prod`) for secrets and deploy gates.

| Workflow | Paths | What |
|---|---|---|
| `api.yml` | `api/**`, `api-worker/**` | Test .NET + worker. On `main`, deploy **get-grounded-api** (Cloudflare Containers) |
| `website.yml` | `website/**` | PR: lint + build + optional Pages preview. `main`: deploy **get-grounded-web** |
| `mobile.yml` | `mobile/**` | Typecheck on PR/`main`. EAS **production** only via **Run workflow** |
| `infra.yml` | `infra/terraform/**` | `fmt` + validate + plan **prod** root. Apply is manual dispatch only |

EAS and Terraform apply do not run on every push.

## Secrets (environment `prod`)

| Secret | Used by |
|---|---|
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | Infra Terraform state |
| `CLOUDFLARE_DEPLOY_TOKEN` | **Wrangler deploy** — API Containers + website Pages (Workers Scripts + Pages Edit) |
| `CLOUDFLARE_API_TOKEN` or `CLOUDFLARE_EMAIL` + `CLOUDFLARE_API_KEY` | Terraform / DNS (can overlap with deploy token) |
| `CLOUDFLARE_ACCOUNT_ID` | Wrangler |
| `VITE_LOOPS_FORM_ID` | Website build (optional) |
| `VITE_SUPPORT_EMAIL` | Website build (optional) |
| `VITE_HERO_VIDEO_URL` | Website prod build (optional) |
| `EXPO_TOKEN` | EAS |

**Cloudflare token:** **Workers Scripts → Edit**, **Pages → Edit**, **Account Settings → Read**.

Worker runtime secrets (`DATABASE_URL`, etc.) are on the **`get-grounded-api`** Worker in Cloudflare, not in GitHub. CI `wrangler deploy` keeps existing Worker secrets.

Domains: **`get-grounded.app`** (Pages), **`api.get-grounded.app`** (API Worker).

Legacy `infra/terraform/environments/dev` is not run in CI; use prod or local Terraform only.
