#!/usr/bin/env bash
# Trigger a Metro reload on connected Android dev client (USB).
set -euo pipefail

METRO="${METRO_URL:-http://127.0.0.1:8080}"

if curl -sf "${METRO}/status" >/dev/null 2>&1; then
  curl -sf -X POST "${METRO}/reload" >/dev/null 2>&1 || true
  echo "Metro reload sent (${METRO})."
else
  echo "Metro not running on ${METRO} — start mobile: npm start"
  exit 1
fi

DEVICE="$(adb devices 2>/dev/null | awk 'NR>1 && $2=="device"{print $1; exit}')"
if [[ -n "${DEVICE}" ]]; then
  adb -s "${DEVICE}" reverse tcp:8080 tcp:8080 2>/dev/null || true
  adb -s "${DEVICE}" reverse tcp:5217 tcp:5217 2>/dev/null || true
  echo "Device ${DEVICE} — adb reverse ok."
fi
