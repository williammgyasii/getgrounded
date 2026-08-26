output "audio_bucket_name" {
  value = module.r2.bucket_name
}

output "api_service_name" {
  value = module.render_api.service_name
}

output "database_name" {
  value = module.render_api.database_name
}
