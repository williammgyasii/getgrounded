# Terraform

One `environments/dev` root. State: `getgrounded-tfstate/dev/terraform.tfstate`.

The state bucket is in Terraform with `prevent_destroy`. Prod uses the same bucket, different key — do not declare the bucket in `prod`.

| Module / resource | Live objects |
|---|---|
| `cloudflare_r2_bucket.tfstate` | `getgrounded-tfstate` |
| `r2` | `getgrounded-dev-audio` |
| `dns` | CNAME `dev.get-grounded.app` → Cloud Run (`ghs.googlehosted.com`, DNS-only) |
| (manual) | Apex + `www` → Cloudflare Pages `get-grounded-web.pages.dev` (marketing site in `website/`) |
| `secret` | Neon `DATABASE_URL`, ElevenLabs, OpenAI, R2 keys → Cloud Run |
| `cloud_run` | API container, public invoker, domain mapping (no Cloud SQL socket) |
| `wif` | GitHub OIDC + `github-deploy` |
| `budget_kill` | $50 GetGrounded budget + kill path, and the $100 account alert |
| `firebase` | Firebase + Identity Platform email/password |

**Database:** Neon Postgres everywhere. Cloud SQL module removed — see [`NEON.md`](./NEON.md) to rotate the secret and retire the old instance.

```bash
source ~/.config/cloudflare/env
cd infra/terraform/environments/dev
terraform plan
```
