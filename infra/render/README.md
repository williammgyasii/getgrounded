# Render

The API service and Postgres are owned by Terraform:

```text
infra/terraform/modules/render_api
infra/terraform/environments/dev
infra/terraform/environments/prod
```

Use the `render` CLI to inspect or debug, not to create the long-lived service by hand.

Do not run `render deploys create` until Terraform has created the service.

Docs: https://render.com/docs/cli
