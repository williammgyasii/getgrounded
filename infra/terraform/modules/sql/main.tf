# RETIRED — dev and Cloud Run now use Neon Postgres (DATABASE_URL secret).
# This module is kept so existing state can be destroyed in a controlled apply.
# Before destroy: disable deletion_protection on the instance in GCP Console.

resource "google_sql_database_instance" "main" {
  name             = "${var.name_prefix}-${var.environment}"
  database_version = "POSTGRES_17"
  region           = var.region
  project          = "get-ground-448ca"

  settings {
    tier                        = "db-f1-micro"
    edition                     = "ENTERPRISE"
    availability_type           = "ZONAL"
    pricing_plan                = "PER_USE"
    activation_policy           = "ALWAYS"
    disk_size                   = 10
    disk_type                   = "PD_SSD"
    deletion_protection_enabled = true
    enable_dataplex_integration = true

    backup_configuration {
      enabled                        = true
      start_time                     = "10:00"
      transaction_log_retention_days = 7

      backup_retention_settings {
        retained_backups = 7
        retention_unit   = "COUNT"
      }
    }

    ip_configuration {
      ipv4_enabled = true
    }
  }

  deletion_protection = true
}

resource "google_sql_database" "app" {
  name     = "getgrounded"
  instance = google_sql_database_instance.main.name
  project  = "get-ground-448ca"
}
