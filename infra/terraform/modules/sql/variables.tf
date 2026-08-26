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

variable "region" {
  description = "Cloud SQL region"
  type        = string
  default     = "us-central1"
}
