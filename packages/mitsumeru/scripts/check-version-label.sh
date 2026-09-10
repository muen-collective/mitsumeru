#!/usr/bin/env bash
# Release-label guard (Epic 86 T11).
#
# The rule: an internal build carries `-dev` in its version, its artifact
# filenames, its release notes and any download link or CTA that points at it.
# The suffix comes off only when a build is promoted to production/public users.
# This is the machine half of that rule — it fails when a `-dev` version
# produced artifacts that do not say so, and when a promotion is attempted on a
# version that still does.
#
#   pnpm check:label              # internal build: the label must be present
#   PROMOTE=1 pnpm check:label    # release: the label must be gone
set -uo pipefail
cd "$(dirname "$0")/.." # packages/mitsumeru

VERSION=$(node -p "require('./package.json').version")
status=0
ok()   { echo "[PASS] $1"; }
bad()  { echo "[FAIL] $1"; status=1; }

# 1. the version itself
if printf '%s' "$VERSION" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+(-dev)?$'; then
  ok "version parses as 0.x.y[-dev]: $VERSION"
else
  bad "version '$VERSION' is not 0.x.y or 0.x.y-dev"
fi

if [ -n "${PROMOTE:-}" ]; then
  case "$VERSION" in
    *-dev) bad "PROMOTE is set but $VERSION still carries -dev — remove the suffix first" ;;
    *)     ok "promotion: $VERSION carries no -dev suffix" ;;
  esac
else
  case "$VERSION" in
    *-dev) ok "internal build: $VERSION carries the -dev suffix" ;;
    *)     bad "$VERSION has no -dev suffix — a build for the user to install and test must say so" ;;
  esac
fi

# 2. the artifacts that would be handed out. Names come from electron-builder's
# own pattern (productName-version-arch), so the check reads the real files.
shopt -s nullglob
artifacts=(release/Mitsumeru-*.dmg release/Mitsumeru-*.zip)
if [ "${#artifacts[@]}" -eq 0 ]; then
  echo "[skip] no artifacts in release/ yet — run pnpm package:mac"
else
  for a in "${artifacts[@]}"; do
    case "$(basename "$a")" in
      *"$VERSION"*) ok "artifact carries the version: $(basename "$a")" ;;
      *)            bad "artifact name does not carry $VERSION: $(basename "$a")" ;;
    esac
  done
fi

# 3. what the app itself will report. Info.plist is what the About panel reads
# when the app has not been launched yet; the launch path is asserted in T12's
# smoke run (`version <v> dev-build`).
PLIST=release/mac-arm64/Mitsumeru.app/Contents/Info.plist
if [ -f "$PLIST" ]; then
  plist_version=$(/usr/libexec/PlistBuddy -c 'Print :CFBundleShortVersionString' "$PLIST" 2>/dev/null || echo '')
  if [ "$plist_version" = "$VERSION" ]; then
    ok "packaged app reports version $plist_version (About panel reads this)"
  else
    bad "packaged app reports '$plist_version' but package.json says $VERSION — rebuild"
  fi
else
  echo "[skip] no packaged app yet — run pnpm package:mac"
fi

# 4. no production label anywhere it could reach a person. A released-looking
# version string in a notes file or a download CTA is the failure this guards.
if [ -d release-notes ]; then
  stale=$(grep -rlE 'Mitsumeru-[0-9]+\.[0-9]+\.[0-9]+-' release-notes 2>/dev/null | while read -r f; do
    grep -q -- '-dev' "$f" || echo "$f"
  done)
  if [ -n "$stale" ]; then
    bad "release notes name a version with no -dev label: $(echo "$stale" | tr '\n' ' ')"
  else
    ok "release notes: every version named carries -dev"
  fi
fi

exit "$status"
