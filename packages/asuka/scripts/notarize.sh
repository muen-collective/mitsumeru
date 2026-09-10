#!/usr/bin/env bash
# Notarization (Epic 86 T10).
#
# Order matters, and it is the whole content of this script:
#   1. submit the signed .app (zipped) and staple the ticket to it;
#   2. re-package dmg + zip FROM that stapled app, so the copy inside each
#      artifact carries the ticket already;
#   3. submit + staple the dmg as well, because `spctl -a -t open` on a dmg
#      checks the dmg, not the app inside it.
#
# Why not `mac.notarize: true` in electron-builder.yml: the dmg and the zip are
# built before any ticket exists, and a zip cannot be stapled after the fact —
# its checksum is written into latest-mac.yml at build time, so regenerating it
# would break the update feed. Notarizing first and packaging second is the only
# order where all three artifacts agree.
#
# Credentials come from the environment or the login keychain, never the repo:
#   xcrun notarytool store-credentials asuka-notary \
#     --apple-id "you@example.com" --team-id 4Q6GC57QG4
#   NOTARY_PROFILE=asuka-notary pnpm notarize
# or APPLE_ID + APPLE_APP_SPECIFIC_PASSWORD + APPLE_TEAM_ID.
# The password is omitted on purpose: notarytool prompts for it hidden. Angle brackets
# read as "substitute here" in prose but are redirection operators when pasted into zsh;
# the message below therefore carries no bracketed placeholder.
set -euo pipefail
cd "$(dirname "$0")/.." # packages/asuka

APP=release/mac-arm64/Asuka.app
VERSION=$(node -p "require('./package.json').version")

if [ -n "${NOTARY_PROFILE:-}" ]; then
  AUTH=(--keychain-profile "$NOTARY_PROFILE")
elif [ -n "${APPLE_ID:-}" ] && [ -n "${APPLE_APP_SPECIFIC_PASSWORD:-}" ] && [ -n "${APPLE_TEAM_ID:-}" ]; then
  AUTH=(--apple-id "$APPLE_ID" --password "$APPLE_APP_SPECIFIC_PASSWORD" --team-id "$APPLE_TEAM_ID")
else
  cat >&2 <<'MSG'
[FAIL] no notarization credentials — nothing was submitted.
  Store them once (replace the quoted Apple ID with the real one):
    xcrun notarytool store-credentials asuka-notary \
      --apple-id "you@example.com" --team-id YOUR_TEAM_ID
  Then run:         NOTARY_PROFILE=asuka-notary pnpm notarize
  (or export APPLE_ID + APPLE_APP_SPECIFIC_PASSWORD + APPLE_TEAM_ID)
  Signing without notarization still works: pnpm package:mac
MSG
  exit 2
fi

[ -d "$APP" ] || { echo "[FAIL] $APP missing — run pnpm package:mac first"; exit 1; }

# The identity is read back from the app that was just signed, so this script
# never carries a name either. `Authority=` is the leaf certificate.
IDENTITY=$(codesign -dvvv "$APP" 2>&1 | sed -n 's/^Authority=//p' | head -1)
[ -n "$IDENTITY" ] || { echo "[FAIL] $APP carries no signing authority — sign it first"; exit 1; }
echo "notarize: signing as $IDENTITY"

submit() {
  echo "notarize: submitting $1"
  xcrun notarytool submit "$1" "${AUTH[@]}" --wait --timeout 45m
}

# --- 1. the app -------------------------------------------------------------

APP_ZIP="release/.notarize-$VERSION-app.zip"
rm -f "$APP_ZIP"
# ditto, not zip: it preserves the symlinks and resource forks inside the
# bundle, and notarytool rejects an archive that does not match the bundle.
ditto -c -k --keepParent "$APP" "$APP_ZIP"
submit "$APP_ZIP"
echo "notarize: stapling $APP"
xcrun stapler staple "$APP"
xcrun stapler validate "$APP"
rm -f "$APP_ZIP"

# --- 2. repackage from the stapled app --------------------------------------

echo "notarize: repackaging dmg + zip from the stapled app"
npx electron-builder --mac dmg zip --prepackaged "$APP" --publish never

# --- 3. the dmg -------------------------------------------------------------

DMG=$(ls -t release/*.dmg | head -1)
# electron-builder does not sign the dmg (verified 2026-09-10: `codesign -dv` on
# the artifact says "code object is not signed at all"), and an unsigned disk
# image cannot be notarized — so sign it here, with a timestamp, first.
echo "notarize: signing $DMG"
codesign --sign "$IDENTITY" --timestamp --force "$DMG"
submit "$DMG"
echo "notarize: stapling $DMG"
xcrun stapler staple "$DMG"
xcrun stapler validate "$DMG"

echo "notarize: done — $DMG"
echo "notarize: verify with pnpm verify:release"
