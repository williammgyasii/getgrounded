variable "environment" {
  description = "dev or prod"
  type        = string

  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "environment must be dev or prod."
  }
}

variable "name_prefix" {
  description = "Shared name prefix, usually getgrounded"
  type        = string
}

variable "cloudflare_account_id" {
  description = "Cloudflare account that owns the private audio bucket"
  type        = string
}

variable "location" {
  description = "R2 location hint"
  type        = string
  default     = "ENAM"
}
