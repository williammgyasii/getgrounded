# GitHub Actions

Two workflows. **CI** on every PR and merge to `main`. **Release (CD)** only when you push a **version tag**.

## CI (`ci.yml`)

| Trigger | What runs |
|---------|-----------|
| **Pull request → `main`** | Path-filtered jobs (see below). Website PRs also get a Cloudflare **preview** comment. |
| **Push to `main`** | Same checks — **no production deploy**. |
| **Run workflow** (optional) | Terraform **apply** if you enable `terraform_apply` (infra only). |

One Actions run per event. A `changes` job decides which areas to test:

| Job | Paths |
|-----|--------|
| API — .NET + worker | `api/**`, `api-worker/**`, `global.json` |
| Website — lint + build | `website/**` |
| Mobile — typecheck | `mobile/**` |
| Infra — fmt, validate, plan | `infra/terraform/**` |

Editing `.github/workflows/**` runs **all** of the above.

## Release / CD (`release.yml`)

| Trigger | What runs |
|---------|-----------|
| **Push tag `v*`** (e.g. `v1.0.0`) | Deploy **API** (Cloudflare Containers), **website** (Pages), **EAS production** mobile build |
| **Run workflow** | Same deploy jobs (emergency redeploy) |

```bash
git checkout main && git pull
git tag v1.0.0
git push origin v1.0.0
```

Infra is **not** applied on release tags. Use **CI → Run workflow → terraform_apply** when you intend to change Terraform.

## Secrets (environment `prod`)

| Secret | Used for |
|--------|----------|
| `CLOUDFLARE_DEPLOY_TOKEN` | Wrangler — API + website deploy |
| `CLOUDFLARE_ACCOUNT_ID` | Wrangler |
| `CLOUDFLARE_API_TOKEN` / email + global key | Terraform plan/apply |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | Terraform state backend |
| `VITE_*` | Website build |
| `EXPO_TOKEN` | EAS on release |

Worker runtime secrets (`DATABASE_URL`, etc.) live on the **`get-grounded-api`** Worker in Cloudflare, not in GitHub.
