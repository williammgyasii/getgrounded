# Render web service + Postgres. No resources until the API is deployable.
locals {
  service_name  = "${var.name_prefix}-${var.environment}-api"
  database_name = "${var.name_prefix}-${var.environment}-db"
}
