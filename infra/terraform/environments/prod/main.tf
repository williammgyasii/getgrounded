locals {
  environment = "prod"
  name_prefix = "getgrounded"
}

module "r2" {
  source                = "../../modules/r2"
  environment           = local.environment
  name_prefix           = local.name_prefix
  cloudflare_account_id = "e23518956f08ff35812d9ab001a39880"
}
