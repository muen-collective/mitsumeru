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
# Credentials come from the login keychain or the environment, never the repo:
#   pnpm store:credentials                    # once: writes the keychain profile
#   NOTARY_PROFILE=asuka-notary pnpm notarize
# or APPLE_ID + APPLE_APP_SPECIFIC_PASSWORD + APPLE_TEAM_ID.
# The store step goes through scripts/store-notary-credentials.sh rather than a pasted
# one-liner: bracketed placeholders read as "substitute here" in prose but are redirection
# operators in zsh, and a parse error there looks exactly like a credentials problem.
set -euo pipefail
cd "$(dirname "$0")/.." # packages/mitsumeru

APP=release/mac-arm64/Mitsumeru.app
VERSION=$(node -p "require('./package.json').version")

if [ -n "${NOTARY_PROFILE:-}" ]; then
  AUTH=(--keychain-profile "$NOTARY_PROFILE")
elif [ -n "${APPLE_ID:-}" ] && [ -n "${APPLE_APP_SPECIFIC_PASSWORD:-}" ] && [ -n "${APPLE_TEAM_ID:-}" ]; then
  AUTH=(--apple-id "$APPLE_ID" --password "$APPLE_APP_SPECIFIC_PASSWORD" --team-id "$APPLE_TEAM_ID")
else
  cat >&2 <<'MSG'
[FAIL] no notarization credentials — nothing was submitted.
  Store them once:  pnpm store:credentials
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
# The old artifacts are deleted first, on purpose. electron-builder decides an
# existing archive is "up to date" and skips rewriting it — measured 2026-09-10:
# `skipped archiving reason=Archive file is up to date` on the zip, leaving one
# built before the staple, whose app carries no ticket ("does not have a ticket
# stapled to it", on the extracted copy). spctl still called that copy `accepted`
# because it could reach Apple and ask. Deleting first makes the rewrite
# unavoidable, which is the entire point of repackaging from the stapled app.
rm -f release/*.dmg release/*.dmg.blockmap release/*.zip release/*.zip.blockmap release/*-mac.yml
npx electron-builder --mac dmg zip --prepackaged "$APP" --publish never

# --- 2b. the update manifest ------------------------------------------------
#
# The manifest is deleted above with the archives and re-sorted here, for two
# measured reasons:
#
#   * it is written by the same tooling that decided an "up to date" archive
#     could be skipped, so it can end up describing a build that no longer
#     exists. The first published release proved it (2026-09-10): the manifest
#     was from an earlier run, its sha512 did not match the zip, and the only
#     reason nothing failed is that discovery and version comparison do not read
#     the checksum. Any real download would have.
#   * with the github provider, electron-builder names it `latest-mac.yml` even
#     for a `-dev` version, while the client asks for `dev-mac.yml` (the generic
#     provider it replaced derived the name from the version). Renaming here
#     keeps ONE rule — the version names the channel — instead of pinning
#     `channel:` in electron-builder.yml, which would be a second source of the
#     same fact, free to drift from the version.
MANIFEST=$(ls release/*-mac.yml 2>/dev/null | head -1 || true)
[ -n "$MANIFEST" ] || { echo "[FAIL] the repackage wrote no update manifest"; exit 1; }
CHANNEL=$(node -p "const v = require('./package.json').version; v.includes('-') ? v.split('-')[1].split('.')[0] : 'latest'")
WANTED="release/$CHANNEL-mac.yml"
if [ "$MANIFEST" != "$WANTED" ]; then
  echo "notarize: manifest $(basename "$MANIFEST") → $(basename "$WANTED") (the name a $CHANNEL client asks for)"
  mv "$MANIFEST" "$WANTED"
fi
if [ "$(ls release/*-mac.yml | wc -l | tr -d ' ')" != "1" ]; then
  echo "[FAIL] more than one update manifest in release/ — the feed would serve an ambiguous set"
  exit 1
fi

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

# --- 3b. the manifest's dmg entry -------------------------------------------
#
# The dmg's bytes are not final when the repackage writes the manifest: signing
# it and stapling a ticket onto it both change the file, so the entry the builder
# wrote describes a dmg that no longer exists. The gate caught exactly this on
# the first run of the corrected pipeline (sha512 and size both off). The zip
# needs no equivalent treatment — nothing touches it after the repackage, which
# is why its entry already matched.
#
# Patched rather than regenerated: the rest of the file is the builder's output
# and is correct, and rewriting the whole manifest by hand would put our own
# idea of the format between the client and its own tooling.
MANIFEST="release/$CHANNEL-mac.yml"
DMG_SHA=$(openssl dgst -sha512 -binary "$DMG" | openssl base64 -A)
DMG_SIZE=$(stat -f %z "$DMG")
node --input-type=module -e '
import { readFileSync, writeFileSync } from "node:fs";
const [file, url, sha, size] = process.argv.slice(1);
const lines = readFileSync(file, "utf8").split("\n");
let inEntry = false;
let patched = 0;
for (let i = 0; i < lines.length; i++) {
  const entry = /^\s*-\s*url:\s*(.+?)\s*$/.exec(lines[i]);
  if (entry) { inEntry = entry[1] === url; continue; }
  if (!inEntry) continue;
  if (/^\s+sha512:\s*\S+\s*$/.test(lines[i])) { lines[i] = `    sha512: ${sha}`; patched++; }
  else if (/^\s+size:\s*\d+\s*$/.test(lines[i])) { lines[i] = `    size: ${size}`; patched++; }
}
// Two lines or nothing: a manifest whose shape changed must fail here, not ship
// with one entry silently unpatched.
if (patched !== 2) { console.error(`[FAIL] expected to patch 2 lines in ${file}, patched ${patched}`); process.exit(1); }
writeFileSync(file, lines.join("\n"));
console.log(`notarize: manifest ${url} → ${size}B, sha512 updated`);
' "$MANIFEST" "$(basename "$DMG")" "$DMG_SHA" "$DMG_SIZE"

echo "notarize: done — $DMG"
echo "notarize: verify with pnpm verify:release"
