# Private R2 bucket for voice audio. No resources until we need uploads.
locals {
  bucket_name = "${var.name_prefix}-${var.environment}-audio"
}
