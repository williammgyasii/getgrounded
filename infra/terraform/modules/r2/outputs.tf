output "bucket_name" {
  description = "Private audio bucket name"
  value       = cloudflare_r2_bucket.audio.name
}
