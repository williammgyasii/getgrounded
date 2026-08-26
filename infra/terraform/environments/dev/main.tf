locals {
  environment = "dev"
  name_prefix = "getgrounded"
}

module "r2" {
  source      = "../../modules/r2"
  environment = local.environment
  name_prefix = local.name_prefix
}

module "render_api" {
  source      = "../../modules/render_api"
  environment = local.environment
  name_prefix = local.name_prefix
}
