# Infra

All live vendors are Terraform under `terraform/`. Budget-kill Python lives next to that module.

```text
terraform/environments/dev     one apply, one state
terraform/environments/prod    stub (no live prod yet)
terraform/modules/             r2, dns, sql, secret, cloud_run, wif, budget_kill, firebase
```
