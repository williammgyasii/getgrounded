# Cost pins: scale to zero, max 2, 512Mi. Image is owned by API (dev) deploys.
# Database: Neon Postgres via DATABASE_URL secret (no Cloud SQL socket).

resource "google_cloud_run_v2_service" "api" {
  name     = "getgrounded-dev-api"
  location = "us-central1"
  project  = "get-ground-448ca"
  ingress  = "INGRESS_TRAFFIC_ALL"

  scaling {
    min_instance_count = 0
  }

  template {
    timeout                          = "60s"
    max_instance_request_concurrency = 40
    service_account                  = "317766274600-compute@developer.gserviceaccount.com"

    scaling {
      min_instance_count = 0
      max_instance_count = 2
    }

    containers {
      # Placeholder; ignore_changes keeps the digest CI last deployed.
      image = "us-central1-docker.pkg.dev/get-ground-448ca/cloud-run-source-deploy/getgrounded-dev-api:latest"

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
        cpu_idle          = true
        startup_cpu_boost = true
      }

      ports {
        container_port = 8080
      }

      env {
        name  = "ASPNETCORE_ENVIRONMENT"
        value = "Production"
      }

      env {
        name  = "DOTNET_HOSTBUILDER__RELOADCONFIGONCHANGE"
        value = "false"
      }

      env {
        name  = "FIREBASE_PROJECT_ID"
        value = "get-ground-448ca"
      }

      env {
        name = "DATABASE_URL"
        value_source {
          secret_key_ref {
            secret  = var.database_url_secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "ELEVENLABS_API_KEY"
        value_source {
          secret_key_ref {
            secret  = var.elevenlabs_api_key_secret_id
            version = "latest"
          }
        }
      }

      env {
        name  = "R2_ACCOUNT_ID"
        value = var.r2_account_id
      }

      env {
        name  = "R2_BUCKET"
        value = var.r2_bucket
      }

      env {
        name = "R2_ACCESS_KEY_ID"
        value_source {
          secret_key_ref {
            secret  = var.r2_access_key_id_secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "R2_SECRET_ACCESS_KEY"
        value_source {
          secret_key_ref {
            secret  = var.r2_secret_access_key_secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "OPENAI_API_KEY"
        value_source {
          secret_key_ref {
            secret  = var.openai_api_key_secret_id
            version = "latest"
          }
        }
      }
    }
  }

  lifecycle {
    ignore_changes = [
      client,
      client_version,
      build_config,
      template[0].containers[0].image,
      template[0].revision,
      template[0].labels,
    ]
  }
}

resource "google_cloud_run_v2_service_iam_member" "public" {
  project  = google_cloud_run_v2_service.api.project
  location = google_cloud_run_v2_service.api.location
  name     = google_cloud_run_v2_service.api.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_domain_mapping" "dev" {
  location = "us-central1"
  name     = "dev.get-grounded.app"
  project  = "get-ground-448ca"

  metadata {
    namespace = "get-ground-448ca"
  }

  spec {
    route_name = google_cloud_run_v2_service.api.name
  }

  lifecycle {
    prevent_destroy = true
    ignore_changes  = all
  }
}
