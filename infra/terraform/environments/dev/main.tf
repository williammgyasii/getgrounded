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

module "secret" {
  source = "../../modules/secret"
}

module "cloud_run" {
  source                         = "../../modules/cloud_run"
  database_url_secret_id         = module.secret.database_url_secret_id
  elevenlabs_api_key_secret_id   = module.secret.elevenlabs_api_key_secret_id
  r2_account_id                  = "e23518956f08ff35812d9ab001a39880"
  r2_bucket                      = module.r2.bucket_name
  r2_access_key_id_secret_id     = module.secret.r2_access_key_id_secret_id
  r2_secret_access_key_secret_id = module.secret.r2_secret_access_key_secret_id
  openai_api_key_secret_id       = module.secret.openai_api_key_secret_id
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
    google      = google
    google-beta = google-beta
  }
}
