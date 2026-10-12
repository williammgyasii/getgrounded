# Neon Postgres (replaces Cloud SQL)

Dev local, dev Cloud Run, and CI tests all use **Neon** via `DATABASE_URL`.

## Secret Manager (Cloud Run)

Update the live secret before or right after Terraform removes the Cloud SQL socket:

```bash
# GCP Console → Secret Manager → getgrounded-dev-database-url → New version
# Value: postgresql://USER:PASSWORD@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
```

Cloud Run reads this as `DATABASE_URL`. No `/cloudsql` mount.

## Shut down Cloud SQL (one-time)

The `sql` module was removed from `environments/dev/main.tf`. To delete the old instance:

1. Confirm Neon has the data you need (migrations applied, smoke test passed).
2. GCP Console → Cloud SQL → `getgrounded-dev` → **Edit** → turn off **deletion protection**.
3. From repo:
   ```bash
   cd infra/terraform/environments/dev
   terraform plan   # should show Cloud Run socket removed; no sql resources if already gone from state
   terraform apply
   ```
4. If the SQL instance still exists in state, temporarily re-add `module "sql"` only to destroy it, or delete manually in Console.

## Local API (Docker)

Same Neon URI in `api/.env`. See `api/README.md`.
