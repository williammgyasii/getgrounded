locals {
  environment = "dev"
  name_prefix = "getgrounded"
}

module "r2" {
  source                = "../../modules/r2"
  environment           = local.environment
  name_prefix           = local.name_prefix
  cloudflare_account_id = "e23518956f08ff35812d9ab001a39880"
}

module "dns" {
  source   = "../../modules/dns"
  zone_id  = "f9283359d769fb8a0a14a9793acb1b15"
  hostname = "dev"
}

module "sql" {
  source      = "../../modules/sql"
  environment = local.environment
  name_prefix = local.name_prefix
}

module "secret" {
  source = "../../modules/secret"
}

module "cloud_run" {
  source                 = "../../modules/cloud_run"
  sql_connection_name    = module.sql.connection_name
  database_url_secret_id = module.secret.database_url_secret_id
}

module "wif" {
  source = "../../modules/wif"
}

module "budget_kill" {
  source = "../../modules/budget_kill"
}

module "firebase" {
  source = "../../modules/firebase"
  providers = {
    google-beta = google-beta
  }
}
