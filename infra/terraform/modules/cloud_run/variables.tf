variable "sql_connection_name" {
  description = "project:region:instance for Cloud SQL"
  type        = string
}

variable "database_url_secret_id" {
  description = "Secret Manager id, not the password"
  type        = string
}

variable "elevenlabs_api_key_secret_id" {
  description = "Secret Manager id for Scribe, not the key"
  type        = string
}
