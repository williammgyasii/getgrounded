resource "google_iam_workload_identity_pool" "github" {
  project                   = "get-ground-448ca"
  workload_identity_pool_id = "github-pool"
  display_name              = "GitHub Actions"
}

resource "google_iam_workload_identity_pool_provider" "github" {
  project                            = "get-ground-448ca"
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github"
  display_name                       = "GitHub"
  attribute_condition                = "assertion.repository=='williammgyasii/getgrounded'"
  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.actor"      = "assertion.actor"
    "attribute.repository" = "assertion.repository"
  }
  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

resource "google_service_account" "github_deploy" {
  project      = "get-ground-448ca"
  account_id   = "github-deploy"
  display_name = "GitHub Actions deploy"
}

resource "google_service_account_iam_member" "github_wif" {
  service_account_id = google_service_account.github_deploy.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/williammgyasii/getgrounded"
}

resource "google_project_iam_member" "github_deploy" {
  for_each = toset([
    "roles/run.admin",
    "roles/cloudbuild.builds.editor",
    "roles/artifactregistry.writer",
    "roles/secretmanager.secretAccessor",
    "roles/storage.admin",
  ])
  project = "get-ground-448ca"
  role    = each.value
  member  = "serviceAccount:${google_service_account.github_deploy.email}"
}
