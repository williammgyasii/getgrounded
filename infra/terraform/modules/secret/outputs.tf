output "database_url_secret_id" {
  value = google_secret_manager_secret.database_url.secret_id
}

output "elevenlabs_api_key_secret_id" {
  value = google_secret_manager_secret.elevenlabs_api_key.secret_id
}
