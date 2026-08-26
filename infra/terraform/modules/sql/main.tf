# Cost pins: shared-core micro, zonal (not HA), 10 GB. Do not add a tier
# variable — a REGIONAL / larger machine would blow the $50 envelope.

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
