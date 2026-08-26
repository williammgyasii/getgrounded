locals {
  bucket_name = "${var.name_prefix}-${var.environment}-audio"
}

resource "cloudflare_r2_bucket" "audio" {
  account_id    = var.cloudflare_account_id
  name          = local.bucket_name
  location      = var.location
  jurisdiction  = "default"
  storage_class = "Standard"
}
