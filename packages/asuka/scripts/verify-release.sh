#!/usr/bin/env bash
# Release gate (Epic 86 T10). Machine-run, no eyeballing:
#
#   codesign --verify --deep --strict   the whole bundle, nested code included
#   codesign -dvvv                      WHO signed it, and was it timestamped
#   spctl -a -t exec                    Gatekeeper on the app
#   spctl -a -t open                    Gatekeeper on the dmg a person downloads
#   stapler validate                    is the notarization ticket attached
#
# Prints [PASS]/[FAIL] per check, exits non-zero on any failure. Before
# `pnpm notarize` has run, the Gatekeeper and stapler lines are expected to
# fail with `source=Unnotarized Developer ID` — that is the honest state of the
# build, and the reason this script exists instead of a manual click-through.
set -uo pipefail
cd "$(dirname "$0")/.." # packages/asuka

APP=release/mac-arm64/Asuka.app
DMG=$(ls -t release/*.dmg 2>/dev/null | head -1 || true)
status=0
check() { # check <description> <command...>
  local what="$1"; shift
  if "$@" >/dev/null 2>&1; then
    echo "[PASS] $what"
  else
    echo "[FAIL] $what"
    status=1
  fi
}

[ -d "$APP" ] || { echo "[FAIL] $APP missing — run pnpm package:mac"; exit 1; }

check "app: codesign --verify --deep --strict" codesign --verify --deep --strict "$APP"
check "app: Gatekeeper (spctl -a -t exec)" spctl -a -t exec "$APP"

# Signing identity: the point of asserting this instead of trusting the config
# is that an unsigned or wrongly-signed build must not reach a download link.
identity=$(codesign -dvvv "$APP" 2>&1 | sed -n 's/^Authority=//p' | head -1)
team=$(codesign -dvvv "$APP" 2>&1 | sed -n 's/^TeamIdentifier=//p' | head -1)
if [ -n "$team" ]; then
  echo "[PASS] app: signed by ${identity:-unknown} (team $team)"
else
  echo "[FAIL] app: no TeamIdentifier — not signed with a Developer ID"
  status=1
fi

# A timestamp is what notarization needs; without it the ticket cannot be issued.
#
# Read into a variable and matched with a shell pattern, never `codesign | grep
# -q`: this script runs under `pipefail`, grep -q exits at the first match, and
# the resulting SIGPIPE makes the whole pipeline look failed — which is exactly
# how this check reported "no timestamp" on a correctly timestamped app.
sig=$(codesign -dvvv "$APP" 2>&1)
case "$sig" in
  *Timestamp=*)
    echo "[PASS] app: signature carries a secure timestamp"
    ;;
  *)
    echo "[FAIL] app: signature has no timestamp (notarization would be refused)"
    status=1
    ;;
esac

# Every Mach-O inside the shipped harness must be signed too — a notarization
# submission fails on the first unsigned binary it finds, and the harness is a
# separate tree (24 445 files, 10 of them code).
unsigned=''
while IFS= read -r f; do
  fileSig=$(codesign -dv "$f" 2>&1)
  case "$fileSig" in
    *TeamIdentifier=*) ;;
    *) unsigned="${unsigned}${f}"$'\n' ;;
  esac
done < <(find "$APP/Contents/Resources/harness" -type f -print0 2>/dev/null \
  | xargs -0 file 2>/dev/null | grep -i 'Mach-O' | cut -d: -f1)

if [ -z "$unsigned" ]; then
  echo "[PASS] harness: every Mach-O binary is signed"
else
  echo "[FAIL] harness: unsigned binaries:"
  echo "$unsigned" | sed 's/^/         /'
  status=1
fi

if [ -n "$DMG" ]; then
  check "dmg: Gatekeeper (spctl -a -t open)" spctl -a -t open "$DMG"
  check "dmg: stapler validate" xcrun stapler validate "$DMG"
  check "app: stapler validate" xcrun stapler validate "$APP"
else
  echo "[FAIL] no dmg in release/ — run pnpm package:mac"
  status=1
fi

exit "$status"
