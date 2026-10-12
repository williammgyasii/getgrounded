# GitHub Actions

Four pipelines — **one per area**. Each has **CI** (PR + merge to `main`) and **CD** (release tag or manual), except infra (CD = Terraform apply only).

| Workflow | CI (PR / `main`) | CD (production) |
|----------|----------------|-----------------|
| **`api.yml`** | .NET tests + worker test/dry-run | Push tag **`v*`** or **Run workflow** → Cloudflare Containers |
| **`website.yml`** | Lint + build; PR preview comment | Tag **`v*`** or **Run workflow** → Pages |
| **`mobile.yml`** | Typecheck | Tag **`v*`** or **Run workflow** → EAS production |
| **`infra.yml`** | fmt, validate, plan | **Run workflow** with **Apply** checked (no tag deploy) |

Path filters: only the workflow whose folder changed runs on PR/`main`.

**Release tags (`v*`):** each app workflow runs **CD — scope since last tag**; deploy only if that area changed since the previous `v*` tag (first tag deploys all). See [`docs/RELEASE.md`](../docs/RELEASE.md).

## Branch protection (`main`)

Required status checks (skipped jobs do not block):

- `CI — test` (API)
- `CI — lint and build` (Website)
- `CI — typecheck` (Mobile)
- `CI — validate and plan` (Infra)

Enable in **Settings → Branches → main** if not already applied via repo settings.

## Release

```bash
git checkout main && git pull
git tag v1.0.0
git push origin v1.0.0
```

Infra is unchanged on tag unless you run **Infra → Run workflow → apply**.

## Secrets (environment `prod`)

| Secret | Used by |
|--------|---------|
| `CLOUDFLARE_DEPLOY_TOKEN` | API + website Wrangler deploy |
| `CLOUDFLARE_ACCOUNT_ID` | Wrangler |
| `CLOUDFLARE_API_TOKEN` / email + global key | Infra Terraform |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | Infra state |
| `VITE_*` | Website build |
| `EXPO_TOKEN` | Mobile EAS |

Worker secrets (`DATABASE_URL`, …) live on **`get-grounded-api`** in Cloudflare, not GitHub.
