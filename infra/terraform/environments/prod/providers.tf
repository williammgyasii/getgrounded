provider "cloudflare" {
  # Reads CLOUDFLARE_API_TOKEN from the environment when we plan/apply.
}

provider "render" {
  # Reads RENDER_API_KEY and RENDER_OWNER_ID when we plan/apply.
}
