# Studio and Agent Platform are not resources here.
# Gemini publisher models need the API + IAM, not an endpoint.

locals {
  project = "get-ground-448ca"
  apis = [
    "aiplatform.googleapis.com",
    "speech.googleapis.com",
    "texttospeech.googleapis.com",
  ]
  caller_roles = [
    "roles/aiplatform.user",
    "roles/speech.client",
  ]
}

resource "google_project_service" "ai" {
  for_each = toset(local.apis)

  project            = local.project
  service            = each.value
  disable_on_destroy = false
}

resource "google_project_iam_member" "run_caller" {
  for_each = toset(local.caller_roles)

  project = local.project
  role    = each.value
  member  = "serviceAccount:${var.run_service_account}"

  depends_on = [google_project_service.ai]
}
