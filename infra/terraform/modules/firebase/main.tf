resource "google_firebase_project" "this" {
  provider = google-beta
  project  = "get-ground-448ca"
}

resource "google_project_service" "identitytoolkit" {
  project            = "get-ground-448ca"
  service            = "identitytoolkit.googleapis.com"
  disable_on_destroy = false
}

resource "google_identity_platform_config" "auth" {
  provider = google-beta
  project  = google_project_service.identitytoolkit.project

  sign_in {
    email {
      enabled           = true
      password_required = true
    }
  }

  depends_on = [google_firebase_project.this]
}
