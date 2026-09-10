#!/usr/bin/env bash
# Store the notarytool keychain profile (Epic 86 T10).
#
# Why this exists: the raw one-liner is short but hostile to paste. Its
# "<apple id>" placeholders are redirection operators in zsh, so a verbatim
# paste dies with "parse error" before notarytool is ever reached — a shell
# error, which reads like a credentials error and sends you looking in the
# wrong place. Here the only thing you type is an email address, and the
# password is never an argument at all: notarytool prompts for it with hidden
# input, so the secret stays out of shell history, out of `ps`, and out of
# this script's argv.
#
#   pnpm store:credentials
#   NOTARY_PROFILE=my-profile pnpm store:credentials   # to use another name
set -euo pipefail
cd "$(dirname "$0")/.." # packages/asuka

PROFILE="${NOTARY_PROFILE:-asuka-notary}"

# The team ID is not written into the config either — it is read back out of the
# app that was signed, the same way notarize.sh reads the signing identity.
TEAM_ID="${APPLE_TEAM_ID:-}"
if [ -z "$TEAM_ID" ] && [ -d release/mac-arm64/Asuka.app ]; then
  TEAM_ID=$(codesign -dvvv release/mac-arm64/Asuka.app 2>&1 | sed -n 's/^TeamIdentifier=//p' | head -1)
fi
if [ -z "$TEAM_ID" ]; then
  read -r -p "Apple Team ID: " TEAM_ID || true
fi
[ -n "$TEAM_ID" ] || { echo "[FAIL] no team ID — pass APPLE_TEAM_ID=... or build the app first" >&2; exit 1; }

read -r -p "Apple ID (email): " APPLE_ID || true
[ -n "$APPLE_ID" ] || { echo "[FAIL] no Apple ID given" >&2; exit 1; }

echo "store-credentials: profile=$PROFILE  team=$TEAM_ID"
echo "notarytool will now prompt for the app-specific password (input hidden)."
exec xcrun notarytool store-credentials "$PROFILE" --apple-id "$APPLE_ID" --team-id "$TEAM_ID"
