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

variable "r2_account_id" {
  description = "Cloudflare account that owns the private audio bucket"
  type        = string
}

variable "r2_bucket" {
  description = "R2 bucket name for morning recordings"
  type        = string
}

variable "r2_access_key_id_secret_id" {
  description = "Secret Manager id for the R2 access key, not the key"
  type        = string
}

variable "r2_secret_access_key_secret_id" {
  description = "Secret Manager id for the R2 secret key, not the key"
  type        = string
}
