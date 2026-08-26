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

resource "google_secret_manager_secret" "elevenlabs_api_key" {
  secret_id = "getgrounded-dev-elevenlabs-api-key"
  project   = "get-ground-448ca"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "elevenlabs_api_key" {
  secret      = google_secret_manager_secret.elevenlabs_api_key.id
  secret_data = "imported"

  lifecycle {
    ignore_changes = [secret_data]
  }
}

resource "google_secret_manager_secret_iam_member" "elevenlabs_api_key_run" {
  project   = "get-ground-448ca"
  secret_id = google_secret_manager_secret.elevenlabs_api_key.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:317766274600-compute@developer.gserviceaccount.com"
}

resource "google_secret_manager_secret" "r2_access_key_id" {
  secret_id = "getgrounded-dev-r2-access-key-id"
  project   = "get-ground-448ca"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "r2_access_key_id" {
  secret      = google_secret_manager_secret.r2_access_key_id.id
  secret_data = "imported"

  lifecycle {
    ignore_changes = [secret_data]
  }
}

resource "google_secret_manager_secret_iam_member" "r2_access_key_id_run" {
  project   = "get-ground-448ca"
  secret_id = google_secret_manager_secret.r2_access_key_id.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:317766274600-compute@developer.gserviceaccount.com"
}

resource "google_secret_manager_secret" "r2_secret_access_key" {
  secret_id = "getgrounded-dev-r2-secret-access-key"
  project   = "get-ground-448ca"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "r2_secret_access_key" {
  secret      = google_secret_manager_secret.r2_secret_access_key.id
  secret_data = "imported"

  lifecycle {
    ignore_changes = [secret_data]
  }
}

resource "google_secret_manager_secret_iam_member" "r2_secret_access_key_run" {
  project   = "get-ground-448ca"
  secret_id = google_secret_manager_secret.r2_secret_access_key.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:317766274600-compute@developer.gserviceaccount.com"
}
