# Infra

Service config lives here. Business rules do not.

| Folder | Tool | Owns |
|---|---|---|
| `terraform/` | Terraform | R2 + Render API/Postgres objects (`dev`, `prod`) |
| `cloudflare/` | Wrangler | Worker / Workflow / Queue **source** |
| `render/` | `render` CLI | Ad-hoc inspect; service itself is Terraform |
| `firebase/` | Firebase CLI | Auth, Analytics, Crashlytics, FCM, App Check, Remote Config |
| `elevenlabs/` | ElevenLabs CLI | Quick Log + Talk to Coach agents |

`.NET` still owns truth. These folders only describe how we talk to vendors.

Do not put API keys in these files. Use host secret stores and local `.env` files that stay gitignored.
