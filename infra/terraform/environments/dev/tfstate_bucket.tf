# This bucket holds THIS state. Import only. Never destroy.

resource "cloudflare_r2_bucket" "tfstate" {
  account_id    = "e23518956f08ff35812d9ab001a39880"
  name          = "getgrounded-tfstate"
  location      = "ENAM"
  jurisdiction  = "default"
  storage_class = "Standard"

  lifecycle {
    prevent_destroy = true
  }
}
