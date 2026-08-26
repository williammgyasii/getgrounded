# Terraform

One `environments/dev` root. State: `getgrounded-tfstate/dev/terraform.tfstate`.

The state bucket is in Terraform with `prevent_destroy`. Prod uses the same bucket, different key — do not declare the bucket in `prod`.

| Module / resource | Live objects |
|---|---|
| `cloudflare_r2_bucket.tfstate` | `getgrounded-tfstate` |
| `r2` | `getgrounded-dev-audio` |
| `dns` | CNAME `dev.get-grounded.app` |
| `sql` | `getgrounded-dev` + db `getgrounded` |
| `secret` | database URL + ElevenLabs API key (Scribe), both mounted on Cloud Run |
| `cloud_run` | API, public invoker, domain mapping |
| `wif` | GitHub OIDC + `github-deploy` |
| `budget_kill` | $50 GetGrounded budget + kill path, and the $100 account alert |
| `firebase` | Firebase + Identity Platform email/password |
| `vertex` | Vertex / Speech / TTS APIs + Cloud Run `aiplatform.user` and `speech.client` |

```bash
source ~/.config/cloudflare/env
cd infra/terraform/environments/dev
terraform plan
```
