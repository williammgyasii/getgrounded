# Releasing to production

Single production environment. **`main`** is integration; **tags** ship what changed.

## Day to day

1. Open a **PR → `main`**. Path-filtered CI runs (API, website, mobile, infra).
2. Merge when required checks are green (skipped area checks do not block).
3. **Do not** expect prod to update on merge alone.

## Ship a release

From updated `main`:

```bash
git pull origin main
git tag v1.0.0
git push origin v1.0.0
```

- **CD** runs only for areas with changes **since the previous `v*` tag** (first tag deploys all app surfaces).
- **Infra** is not applied on tag. Use **Actions → Infra → Run workflow** with **Apply** checked after reading the plan.

Emergency redeploy without a tag: **Actions → API / Website / Mobile → Run workflow** (full deploy for that area).

## What each tag triggers

| Area | CD job | Production target |
|------|--------|-------------------|
| API | `CD — Cloudflare Containers` | `https://api.get-grounded.app` |
| Website | `CD — Pages production` | `https://get-grounded.app` |
| Mobile | `CD — EAS production` | EAS build (not automatic store submit) |

## Worker secrets (API)

Runtime secrets (`DATABASE_URL`, `FIREBASE_PROJECT_ID`, hear/R2 keys) live on the **`get-grounded-api`** Cloudflare Worker, not in GitHub.

After changing `api/.env`:

```bash
source ~/.config/cloudflare/env
cd api-worker
# wrangler secret put … or deploy --secrets-file from a local json (never commit)
```

CI/CD **deploy does not upload** those secrets; it keeps whatever is already on the Worker.

## Version tags

Use semver **`vMAJOR.MINOR.PATCH`** (e.g. `v0.2.1`). One tag name for the repo; each pipeline decides whether it deploys based on diff since the last tag.

## Mobile vs store

Tag → **EAS production build** only. Submitting to Google Play / App Store is a separate step in Expo / store consoles.
