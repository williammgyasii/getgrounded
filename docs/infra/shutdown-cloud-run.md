# Shut down Cloud Run API (legacy)

Production API now targets **Cloudflare Containers** at `https://api.get-grounded.app`.

After the new API is verified:

1. **Stop CI deploys** — already removed from `api-dev.yml`; `api-prod.yml` deploys Cloudflare only.

2. **Remove public URL to Cloud Run** (optional DNS):

   ```bash
   gcloud run domain-mappings delete dev.get-grounded.app \
     --region=us-central1 --project=get-ground-448ca
   ```

3. **Delete or idle the service** (stops GCP spend):

   ```bash
   gcloud run services delete getgrounded-dev-api \
     --region=us-central1 --project=get-ground-448ca --quiet
   ```

4. **Cloudflare DNS** — remove or repoint `dev.get-grounded.app` if a record still exists. Keep `api.get-grounded.app` → Worker.

5. **Terraform** — `infra/terraform/modules/cloud_run` and `google_cloud_run_domain_mapping.dev` are legacy. Do not apply new Cloud Run changes; trim in a later infra PR when GCP resources are gone.

Verify:

```bash
curl -sS https://api.get-grounded.app/health
curl -sS -o /dev/null -w "%{http_code}\n" https://dev.get-grounded.app/health
```

The second should fail or 404 after teardown.
