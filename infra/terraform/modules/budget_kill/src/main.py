import base64
import json
import os

import functions_framework
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

PROJECT = os.environ.get("GCP_PROJECT", "get-ground-448ca")
REGION = os.environ.get("GCP_REGION", "us-central1")
SQL_INSTANCE = os.environ.get("SQL_INSTANCE", "getgrounded-dev")
RUN_SERVICE = os.environ.get("RUN_SERVICE", "getgrounded-dev-api")


def _payload(cloud_event):
    raw = cloud_event.data["message"]["data"]
    return json.loads(base64.b64decode(raw))


@functions_framework.cloud_event
def stop_spend(cloud_event):
    """Stop the paid boxes at 100% of the $50 budget. Do not disable billing."""
    payload = _payload(cloud_event)
    threshold = float(payload.get("alertThresholdExceeded") or 0)
    if threshold < 1.0:
        return

    sql = build("sqladmin", "v1beta4", cache_discovery=False)
    sql.instances().patch(
        project=PROJECT,
        instance=SQL_INSTANCE,
        body={"settings": {"activationPolicy": "NEVER"}},
    ).execute()

    try:
        run = build("run", "v2", cache_discovery=False)
        name = f"projects/{PROJECT}/locations/{REGION}/services/{RUN_SERVICE}"
        run.projects().locations().services().patch(
            name=name,
            updateMask="scaling.maxInstanceCount",
            body={"scaling": {"maxInstanceCount": 0}},
        ).execute()
    except HttpError as error:
        if error.resp.status != 404:
            raise
