terraform {
  backend "s3" {
    bucket = "getgrounded-tfstate"
    key    = "dev/terraform.tfstate"
    endpoints = {
      s3 = "https://e23518956f08ff35812d9ab001a39880.r2.cloudflarestorage.com"
    }
    region                      = "auto"
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_s3_checksum            = true
    use_lockfile                = true
  }
}
