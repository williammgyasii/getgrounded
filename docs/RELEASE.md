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
| Mobile | `CD — EAS production (android \| ios)` | EAS build (not automatic store submit) |

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

### One-time: GitHub → EAS auth

CI uses **`EXPO_TOKEN`** in the GitHub **`prod`** environment (not in the repo).

1. [Create an access token](https://expo.dev/settings/access-tokens) on Expo (account **williammgyasii**, project `getgrounded-app`).
2. From your machine:

```bash
gh secret set EXPO_TOKEN --env prod --repo williammgyasii/getgrounded
# paste the token when prompted
```

3. Re-run **Mobile → Run workflow** or push a tag that includes `mobile/**` changes.

CI queues **Android and iOS** production builds in parallel (separate matrix jobs; one platform failing does not cancel the other).

**iOS (App Store Connect API key, no Apple password):**

1. Key file: `~/.config/getgrounded/apple/AuthKey_PP97L7M8BF.p8` (Key ID `PP97L7M8BF`).
2. Copy `mobile/scripts/ios-asc.env.example` → `~/.config/getgrounded/apple/asc.env` and set **Issuer ID** + **Team ID** from App Store Connect / Apple Developer.
3. Run: `mobile/scripts/configure-ios-production-credentials.sh` — enable **Push Notifications** in [Apple Developer](https://developer.apple.com/account/resources/identifiers/bundleId/edit/KUM32FD446) when the script prompts (EAS auto-sync for push often fails with an Apple API error; the script uses `EXPO_NO_CAPABILITY_SYNC=1` after you enable push manually).
4. If Xcode still says the profile lacks **aps-environment**, remove the production provisioning profile in `eas credentials -p ios` and re-run step 3 or queue a new iOS build.
5. After credentials are on EAS, tag or **Mobile → Run workflow** queues both platforms (CI sets `EXPO_NO_CAPABILITY_SYNC=1` for the same reason).

**Android Gradle errors:** open the failed build on [expo.dev](https://expo.dev) → **Run gradlew** phase. Development (`development` profile) builds have succeeded; production uses a release Gradle graph — fix whatever that phase reports (often native module or SDK image; production uses `image: latest` in `eas.json`).

Local builds (same profile as CI): `cd mobile && eas build --profile production --platform android --non-interactive`.
