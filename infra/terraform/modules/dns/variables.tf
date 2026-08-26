variable "zone_id" {
  description = "Cloudflare zone id for get-grounded.app"
  type        = string
}

variable "hostname" {
  description = "Short name, e.g. dev for dev.get-grounded.app"
  type        = string
}

variable "cloud_run_target" {
  description = "CNAME target Cloud Run gives you, usually ghs.googlehosted.com"
  type        = string
  default     = "ghs.googlehosted.com"
}
