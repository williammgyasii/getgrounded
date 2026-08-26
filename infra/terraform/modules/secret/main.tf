resource "google_secret_manager_secret" "database_url" {
  secret_id = "getgrounded-dev-database-url"
  project   = "get-ground-448ca"

  replication {
    auto {}
  }
}

# Own the version. secret_data stays in remote state, never in .tf.
resource "google_secret_manager_secret_version" "database_url" {
  secret      = google_secret_manager_secret.database_url.id
  secret_data = "imported"

  lifecycle {
    ignore_changes = [secret_data]
  }
}
