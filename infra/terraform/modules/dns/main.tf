resource "cloudflare_dns_record" "api" {
  zone_id = var.zone_id
  name    = var.hostname
  type    = "CNAME"
  content = var.cloud_run_target
  proxied = false
  ttl     = 1
}
