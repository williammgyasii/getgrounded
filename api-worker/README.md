# GetGrounded API gateway (Cloudflare Containers)

Proxies `https://api.get-grounded.app` to the **.NET** image built from [`../api/Dockerfile`](../api/Dockerfile).

Firebase auth stays on the phone; the container reads `DATABASE_URL`, `FIREBASE_PROJECT_ID`, and hear/extract secrets from Worker secrets.

## One-time secrets (production)

From repo root, with `~/.config/cloudflare/env` loaded:

```bash
cd api-worker
npm install

# Required
wrangler secret put DATABASE_URL
wrangler secret put FIREBASE_PROJECT_ID

# Hear / extract (same as api/.env)
wrangler secret put ELEVENLABS_API_KEY
wrangler secret put OPENAI_API_KEY
# Optional: ELEVENLABS_VOICE_ID, OPENAI_MODEL, R2_* 
```

## Local

Requires Docker. Copy values from `api/.env` into a `.dev.vars` file (gitignored) for `wrangler dev`.

```bash
npm run dev
```

## Deploy

```bash
npm run deploy
```

CI: `.github/workflows/ci.yml` tests on PR/`main`. Production deploy: `.github/workflows/release.yml` on tag `v*`. Update Worker secrets locally when `api/.env` changes; release deploy does not upload them.

## Shut down legacy Cloud Run

See [`docs/infra/shutdown-cloud-run.md`](../docs/infra/shutdown-cloud-run.md).
