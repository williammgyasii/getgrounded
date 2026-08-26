resource "google_pubsub_topic" "kill" {
  project = "get-ground-448ca"
  name    = "getgrounded-budget-kill"
}

resource "google_pubsub_topic_iam_member" "billing_publisher" {
  project = "get-ground-448ca"
  topic   = google_pubsub_topic.kill.name
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:billing-budget-alert@system.gserviceaccount.com"
}

resource "google_monitoring_notification_channel" "email" {
  project      = "get-ground-448ca"
  display_name = "GetGrounded billing email"
  type         = "email"
  labels = {
    email_address = "williammgyasii@gmail.com"
  }
}

resource "google_billing_budget" "fifty" {
  billing_account = "0164C1-639368-0EF421"
  display_name    = "GetGrounded 50 USD monthly"

  amount {
    specified_amount {
      currency_code = "USD"
      units         = "50"
    }
  }

  budget_filter {
    projects               = ["projects/317766274600"]
    calendar_period        = "MONTH"
    credit_types_treatment = "EXCLUDE_ALL_CREDITS"
  }

  threshold_rules {
    threshold_percent = 0.1
    spend_basis       = "CURRENT_SPEND"
  }
  threshold_rules {
    threshold_percent = 0.25
    spend_basis       = "CURRENT_SPEND"
  }
  threshold_rules {
    threshold_percent = 0.5
    spend_basis       = "CURRENT_SPEND"
  }
  threshold_rules {
    threshold_percent = 0.8
    spend_basis       = "CURRENT_SPEND"
  }
  threshold_rules {
    threshold_percent = 0.9
    spend_basis       = "CURRENT_SPEND"
  }
  threshold_rules {
    threshold_percent = 1.0
    spend_basis       = "CURRENT_SPEND"
  }
  threshold_rules {
    threshold_percent = 0.5
    spend_basis       = "FORECASTED_SPEND"
  }
  threshold_rules {
    threshold_percent = 1.0
    spend_basis       = "FORECASTED_SPEND"
  }

  all_updates_rule {
    pubsub_topic                     = google_pubsub_topic.kill.id
    schema_version                   = "1.0"
    monitoring_notification_channels = [google_monitoring_notification_channel.email.id]
  }
}

resource "google_cloudfunctions2_function" "kill" {
  project  = "get-ground-448ca"
  name     = "getgrounded-budget-kill"
  location = "us-central1"

  build_config {
    runtime     = "python312"
    entry_point = "stop_spend"
    source {
      storage_source {
        bucket = "gcf-v2-sources-317766274600-us-central1"
        object = "getgrounded-budget-kill/function-source.zip"
      }
    }
  }

  service_config {
    max_instance_count    = 1
    available_memory      = "256Mi"
    timeout_seconds       = 60
    service_account_email = "317766274600-compute@developer.gserviceaccount.com"
    environment_variables = {
      GCP_PROJECT  = "get-ground-448ca"
      GCP_REGION   = "us-central1"
      RUN_SERVICE  = "getgrounded-dev-api"
      SQL_INSTANCE = "getgrounded-dev"
    }
  }

  event_trigger {
    trigger_region = "us-central1"
    event_type     = "google.cloud.pubsub.topic.v1.messagePublished"
    pubsub_topic   = google_pubsub_topic.kill.id
    retry_policy   = "RETRY_POLICY_DO_NOT_RETRY"
  }

  lifecycle {
    ignore_changes = [
      build_config,
      service_config,
    ]
  }
}

resource "google_billing_budget" "account_hundred" {
  billing_account = "0164C1-639368-0EF421"
  display_name    = "$100 Monthly budget alert"

  amount {
    specified_amount {
      currency_code = "USD"
      units         = "100"
    }
  }

  budget_filter {
    calendar_period        = "MONTH"
    credit_types_treatment = "INCLUDE_ALL_CREDITS"
  }

  threshold_rules {
    threshold_percent = 0.5
    spend_basis       = "CURRENT_SPEND"
  }
  threshold_rules {
    threshold_percent = 0.9
    spend_basis       = "CURRENT_SPEND"
  }
  threshold_rules {
    threshold_percent = 1.0
    spend_basis       = "CURRENT_SPEND"
  }
  threshold_rules {
    threshold_percent = 1.5
    spend_basis       = "CURRENT_SPEND"
  }
}
