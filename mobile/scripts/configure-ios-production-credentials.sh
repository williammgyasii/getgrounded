#!/usr/bin/env bash
set -euo pipefail

ASC_ENV="${ASC_ENV:-$HOME/.config/getgrounded/apple/asc.env}"
if [[ ! -f "$ASC_ENV" ]]; then
  echo "Missing $ASC_ENV"
  echo "Copy mobile/scripts/ios-asc.env.example → $ASC_ENV and fill Issuer ID + Team ID."
  exit 1
fi

# shellcheck source=/dev/null
source "$ASC_ENV"

if [[ ! -f "${EXPO_ASC_API_KEY_PATH:-}" ]]; then
  echo "ASC key not found at EXPO_ASC_API_KEY_PATH=$EXPO_ASC_API_KEY_PATH"
  exit 1
fi

cd "$(dirname "$0")/.."

echo "Using ASC key id ${EXPO_ASC_KEY_ID}, team ${EXPO_APPLE_TEAM_ID:-unset}."
echo ""
echo "Push Notifications (required by expo-notifications):"
echo "  EAS auto-sync often fails against Apple's API for PUSH_NOTIFICATIONS."
echo "  Enable it manually, then this script skips sync and refreshes credentials."
echo ""
echo "  1. Open Identifiers → app.getgrounded.dev"
echo "     https://developer.apple.com/account/resources/identifiers/bundleId/edit/KUM32FD446"
echo "  2. Capabilities → Push Notifications → ON → Save → Confirm"
echo "  3. If an old App Store profile exists without push, remove it in EAS after step 4:"
echo "     eas credentials -p ios  →  Provisioning Profile → Remove (production)"
echo ""
read -r -p "Press Enter after Push Notifications is enabled in Apple Developer…"

export EXPO_NO_CAPABILITY_SYNC=1
echo "EXPO_NO_CAPABILITY_SYNC=1 (manual capabilities on Apple; avoids PATCH errors)."
echo "When asked to reuse the distribution certificate, choose Yes."
eas credentials:configure-build -p ios -e production
