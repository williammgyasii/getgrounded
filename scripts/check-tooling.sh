#!/usr/bin/env bash
set -euo pipefail

ok() { printf "  ok   %s\n" "$1"; }
missing() { printf "  skip %s\n" "$1"; }

echo "Required now"
command -v git >/dev/null && ok "git $(git --version | awk '{print $3}')" || missing "git"
command -v gh >/dev/null && ok "gh $(gh --version | head -1 | awk '{print $3}')" || missing "gh"
command -v node >/dev/null && ok "node $(node -v)" || missing "node"
command -v npm >/dev/null && ok "npm $(npm -v)" || missing "npm"
command -v dotnet >/dev/null && ok "dotnet $(dotnet --version)" || missing "dotnet"
command -v docker >/dev/null && ok "docker $(docker --version | awk '{print $3}' | tr -d ',')" || missing "docker"
command -v terraform >/dev/null && ok "terraform $(terraform version -json 2>/dev/null | python3 -c 'import sys,json; print(json.load(sys.stdin)["terraform_version"])' 2>/dev/null || terraform version | head -1)" || missing "terraform"

echo
echo "Useful soon"
command -v eas >/dev/null && ok "eas $(eas --version 2>/dev/null | tail -1)" || missing "eas-cli"
command -v render >/dev/null && ok "render $(render --version 2>/dev/null | head -1)" || missing "render"
command -v wrangler >/dev/null && ok "wrangler $(wrangler --version 2>/dev/null | head -1)" || missing "wrangler"
command -v firebase >/dev/null && ok "firebase $(firebase --version 2>/dev/null | head -1)" || missing "firebase-tools"
command -v elevenlabs >/dev/null && ok "elevenlabs $(elevenlabs --version 2>/dev/null | head -1)" || missing "elevenlabs"
dotnet ef --version >/dev/null 2>&1 && ok "dotnet-ef $(dotnet ef --version 2>/dev/null | tail -1)" || missing "dotnet-ef"
command -v psql >/dev/null && ok "psql $(psql --version | awk '{print $3}')" || missing "psql"

echo
echo "Native builds later"
command -v xcodebuild >/dev/null && ok "xcode $(xcodebuild -version 2>/dev/null | head -1)" || missing "xcode"
command -v pod >/dev/null && ok "cocoapods $(pod --version)" || missing "cocoapods"
/usr/libexec/java_home >/dev/null 2>&1 && ok "java $(java -version 2>&1 | head -1)" || missing "java (Android)"
command -v watchman >/dev/null && ok "watchman" || missing "watchman"
