# Terraform

Hybrid IaC. This folder owns **cloud objects** only.

| Environment | Folder | Names |
|---|---|---|
| dev | `environments/dev` | `getgrounded-dev-*` |
| prod | `environments/prod` | `getgrounded-prod-*` |

Each environment has its own state file. `cd` into the environment you mean. That makes it hard to apply prod by accident.

```bash
cd infra/terraform/environments/dev
terraform init
terraform plan
# terraform apply   # only when we explicitly decide to create resources
```

## What will live here later

- `modules/r2` — private audio bucket
- `modules/render_api` — API web service + Postgres

## What does not live here

- Worker / Workflow source → `infra/cloudflare` + Wrangler
- Firebase Auth / Analytics / FCM → `infra/firebase` + Firebase CLI
- ElevenLabs agents → `infra/elevenlabs` + ElevenLabs CLI
- Secrets → host secret stores, never `.tf` files

No resources are created yet. Modules are empty on purpose.
