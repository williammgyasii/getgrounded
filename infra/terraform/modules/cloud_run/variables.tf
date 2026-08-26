variable "sql_connection_name" {
  description = "project:region:instance for Cloud SQL"
  type        = string
}

variable "database_url_secret_id" {
  description = "Secret Manager id, not the password"
  type        = string
}

variable "elevenlabs_api_key_secret_id" {
  description = "Secret Manager id for the ElevenLabs API key"
  type        = string
}

variable "elevenlabs_agent_id" {
  description = "ElevenLabs Conversational AI agent id"
  type        = string
}
