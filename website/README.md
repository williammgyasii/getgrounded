# GetGrounded marketing site

Vite + React. Static output on **Cloudflare Pages** at `https://get-grounded.app`.

Product copy follows [`docs/superpowers/specs/2026-08-26-go-wide-design.md`](../docs/superpowers/specs/2026-08-26-go-wide-design.md).

## Local

```bash
cd website
cp .env.example .env   # optional: Loops form ID, hero video
npm install
npm run dev
```

- `/` — waitlist landing  
- `/privacy` — privacy policy  
- `/account-deletion` (alias `/delete-account`) — account deletion for Play Console / policies  

## Environment (Cloudflare Pages → Settings → Environment variables)

| Variable | Purpose |
|----------|---------|
| `VITE_LOOPS_FORM_ID` | Loops public newsletter form ID |
| `VITE_HERO_VIDEO_URL` | Optional muted hero MP4 URL |
| `VITE_SUPPORT_EMAIL` | Account deletion contact (default `hello@get-grounded.app`) |

Build command: `npm run build`  
Output directory: `dist`

## Deploy with Wrangler

One-time (logged in via `wrangler login`):

```bash
cd website
npm run deploy
```

Creates or updates the Pages project `get-grounded-web`.

## Custom domain (Cloudflare zone)

In [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **get-grounded-web** → **Custom domains**:

1. Add `get-grounded.app` (apex)  
2. Add `www.get-grounded.app` → redirect to apex (optional)

DNS for the apex should CNAME/flatten to Pages once attached (Dashboard configures this if the zone is on Cloudflare).

API lives at **`api.get-grounded.app`** (Cloudflare Containers), not this Pages project.

## CI/CD (GitHub Actions)

| Workflow | When | What |
|----------|------|------|
| `website.yml` | PR | Lint + build + optional preview comment |
| `website.yml` | Push to `main` or **Run workflow** | Deploy production on Pages |

Secrets live in GitHub environment **`prod`**. See [`.github/README.md`](../.github/README.md).

Required: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`  
Optional at build time: `VITE_LOOPS_FORM_ID`, `VITE_SUPPORT_EMAIL`, `VITE_HERO_VIDEO_URL`
