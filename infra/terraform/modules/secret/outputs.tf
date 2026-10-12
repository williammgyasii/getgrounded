output "database_url_secret_id" {
  value = google_secret_manager_secret.database_url.secret_id
}

output "elevenlabs_api_key_secret_id" {
  value = google_secret_manager_secret.elevenlabs_api_key.secret_id
}

output "r2_access_key_id_secret_id" {
  value = google_secret_manager_secret.r2_access_key_id.secret_id
}

output "r2_secret_access_key_secret_id" {
  value = google_secret_manager_secret.r2_secret_access_key.secret_id
}

output "openai_api_key_secret_id" {
  value = google_secret_manager_secret.openai_api_key.secret_id
}
