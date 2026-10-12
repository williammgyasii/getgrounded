#!/usr/bin/env bash
# Start local dev: API in Docker (5217) + Metro (8080) + Android (device or emulator).
# Default: run in the current shell (Cursor terminal). No Terminal.app windows.
#
# Usage: ./scripts/restart-servers.sh [device|emulator]
#   device   — physical phone over USB/Wi‑Fi (default if adb shows a device)
#   emulator — boot GetGrounded_Pixel_7 AVD and install dev client
#
# Optional: RESTART_SERVERS_IN_TERMINAL=1 opens macOS Terminal.app tabs instead.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MOBILE="$ROOT/mobile"
API="$ROOT/api"

LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || true)"
if [[ -f "$MOBILE/.env.local" ]]; then
  HOST_FROM_ENV="$(grep -E '^REACT_NATIVE_PACKAGER_HOSTNAME=' "$MOBILE/.env.local" | cut -d= -f2- | tr -d '\r' || true)"
  if [[ -n "$HOST_FROM_ENV" ]]; then
    LAN_IP="$HOST_FROM_ENV"
  fi
fi
LAN_IP="${LAN_IP:-127.0.0.1}"

TARGET="${1:-}"
if [[ -z "$TARGET" ]]; then
  if adb devices 2>/dev/null | grep -q '[[:space:]]device$'; then
    TARGET=device
  else
    TARGET=emulator
  fi
fi

echo "Stopping anything on 5217 and 8080..."
for port in 5217 8080; do
  lsof -ti:"$port" | xargs kill -9 2>/dev/null || true
done
(cd "$API" && docker compose down 2>/dev/null) || true
sleep 1

if [[ ! -f "$API/.env" ]]; then
  echo "Missing api/.env — copy api/.env.example and set DATABASE_URL (Neon) + FIREBASE_PROJECT_ID."
  exit 1
fi

DEV_CLIENT_URL="exp+getgroundedapp://expo-development-client/?url=http%3A%2F%2F${LAN_IP}%3A8080"

start_api() {
  echo "▶ API :5217 (Docker)"
  cd "$API"
  docker compose up --build
}

start_metro() {
  echo "▶ Metro :8080"
  cd "$MOBILE"
  npm start
}

open_android() {
  DEVICE_ID=""
  if command -v adb >/dev/null 2>&1; then
    DEVICE_ID="$(adb devices 2>/dev/null | awk 'NR>1 && $2=="device"{print $1; exit}')"
  fi

  if [[ "$TARGET" == "emulator" ]]; then
    echo "▶ Emulator GetGrounded_Pixel_7 (host microphone)"
    "${ANDROID_HOME:-$HOME/Library/Android/sdk}/emulator/emulator" -avd GetGrounded_Pixel_7 &
    adb wait-for-device
    adb wait-for-device shell 'while [[ -z $(getprop sys.boot_completed) ]]; do sleep 1; done' 2>/dev/null || sleep 15
    adb emu avd hostmicon 2>/dev/null || true
    adb shell pm grant app.getgrounded.dev android.permission.RECORD_AUDIO 2>/dev/null || true
    DEVICE_ID="$(adb devices 2>/dev/null | awk 'NR>1 && $2=="device"{print $1; exit}')"
    (cd "$MOBILE" && npx expo run:android --device "$DEVICE_ID" --port 8080) &
    return
  fi

  if [[ -n "$DEVICE_ID" ]]; then
    echo "▶ Android device ${DEVICE_ID}"
    adb -s "$DEVICE_ID" reverse tcp:8080 tcp:8080 2>/dev/null || true
    adb -s "$DEVICE_ID" reverse tcp:5217 tcp:5217 2>/dev/null || true
    if ! adb -s "$DEVICE_ID" shell am start -a android.intent.action.VIEW -d "$DEV_CLIENT_URL" >/dev/null 2>&1; then
      (cd "$MOBILE" && npx expo run:android --device "$DEVICE_ID" --port 8080) &
    fi
    return
  fi

  echo "No Android device — plug in phone or pass: ./scripts/restart-servers.sh emulator"
}

if [[ "${RESTART_SERVERS_IN_TERMINAL:-}" == "1" ]]; then
  API_CMD="cd '$API' && echo '▶ API :5217 (Docker)' && docker compose up --build"
  osascript <<EOF
tell application "Terminal"
  activate
  do script "$API_CMD"
  do script "cd '$MOBILE' && echo '▶ Metro :8080' && npm start"
end tell
EOF
  if [[ "$TARGET" == "emulator" ]]; then
    osascript <<EOF
tell application "Terminal"
  do script "echo '▶ Emulator' && '${ANDROID_HOME:-$HOME/Library/Android/sdk}/emulator/emulator' -avd GetGrounded_Pixel_7"
end tell
EOF
    osascript <<EOF
tell application "Terminal"
  do script "adb wait-for-device && cd '$MOBILE' && npm run android:device"
end tell
EOF
  else
    osascript <<EOF
tell application "Terminal"
  do script "sleep 8 && echo '▶ Android device' && DEVICE=\$(adb devices | awk 'NR>1 && \$2==\"device\"{print \$1; exit}') && adb -s \"\$DEVICE\" reverse tcp:8080 tcp:8080 2>/dev/null; adb -s \"\$DEVICE\" reverse tcp:5217 tcp:5217 2>/dev/null; adb -s \"\$DEVICE\" shell am start -a android.intent.action.VIEW -d '$DEV_CLIENT_URL' || (cd '$MOBILE' && npx expo run:android --device \"\$DEVICE\" --port 8080)"
end tell
EOF
  fi
  echo "Opened Terminal.app tabs — API (Docker), Metro, Android ($TARGET)."
else
  echo "Starting API in Docker on :5217..."
  ( start_api ) &
  API_PID=$!

  echo "Starting Metro on :8080..."
  ( start_metro ) &
  METRO_PID=$!

  echo "Waiting for Metro..."
  for _ in $(seq 1 45); do
    if curl -sf "http://127.0.0.1:8080/status" >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done

  open_android

  echo ""
  echo "Running in this shell (keep it open):"
  echo "  API pid ${API_PID}   http://${LAN_IP}:5217"
  echo "  Metro pid ${METRO_PID}   http://${LAN_IP}:8080"
  echo "  Target: ${TARGET}"
  wait "${API_PID}" "${METRO_PID}"
fi

echo "  API:   http://${LAN_IP}:5217"
echo "  Metro: http://${LAN_IP}:8080"
