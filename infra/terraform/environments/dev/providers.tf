provider "cloudflare" {
  # Reads CLOUDFLARE_API_TOKEN or CLOUDFLARE_EMAIL + CLOUDFLARE_API_KEY.
}

provider "google" {
  project               = "get-ground-448ca"
  region                = "us-central1"
  user_project_override = true
  billing_project       = "get-ground-448ca"
}

provider "google-beta" {
  project               = "get-ground-448ca"
  region                = "us-central1"
  user_project_override = true
  billing_project       = "get-ground-448ca"
}
