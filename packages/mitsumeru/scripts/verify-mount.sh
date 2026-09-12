#!/usr/bin/env bash
# verify:mount — does our plugin actually MOUNT? (Epic 88 C9)
#
# Retargeted 2026-09-12 from the retired dsh-mitsumeru-appearance plugin to
# dsh-eva-theme. The appearance plugin is no longer vendored (see RETIRED_PLUGINS
# in src/main/harness.ts), so this gate was probing a package the app does not
# ship — it would have proved nothing about the build.
#
# Why this exists as a first-class gate rather than a manual check:
# `window.__ModuleLoader__` fails SILENTLY. A client module that throws on import,
# or that evaluates but never registers, leaves the boot succeeding with only a
# console line. "UI boots, zero errors, panel absent" is the documented failure
# mode, and it is indistinguishable from success by looking. So the check must
# assert POSITIVELY, read back from a real renderer, and be shown to fail.
#
# Hermetic on purpose. It builds a throwaway DSH_HOME, writes the profile the app
# would write, and boots that — which means every run also exercises the
# fresh-install path (`ensureProfile` + bundle resolution from the installation
# anchor) instead of trusting the developer's existing profile.
#
# Requires a prepared harness tree (`pnpm harness`) with our plugin vendored into
# it; the vendoring below is idempotent and mirrors scripts/prepare-harness.sh, so
# a dev tree works without a full rebuild.
set -euo pipefail
cd "$(dirname "$0")/.." # packages/mitsumeru

PROFILE=mitsu
PLUGIN=dsh-eva-theme
ENTRY=build/harness/node_modules/@deepseek-ai/dsh/lib/bin.js
HARNESS=build/harness

[ -f "$ENTRY" ] || { echo "[FAIL] $ENTRY missing — run: pnpm harness"; exit 1; }

# --- vendor our plugins into the shipped tree (same as prepare-harness.sh) -----
# A profile bundle resolves from the installation anchor first, so anything we
# ship has to physically live in the harness node_modules.
mkdir -p "$HARNESS/node_modules/@muen/$PLUGIN/lib"
cp "plugins/$PLUGIN/package.json" "plugins/$PLUGIN/cordis.patch.yml" "$HARNESS/node_modules/@muen/$PLUGIN/"
cp plugins/$PLUGIN/lib/*.js "$HARNESS/node_modules/@muen/$PLUGIN/lib/"
[ -d "plugins/$PLUGIN/themes" ] && mkdir -p "$HARNESS/node_modules/@muen/$PLUGIN/themes" \
  && cp plugins/$PLUGIN/themes/*.json "$HARNESS/node_modules/@muen/$PLUGIN/themes/"

# --- throwaway home, with the profile the app writes ---------------------------
HOME_DIR=$(mktemp -d "${TMPDIR:-/tmp}/mitsumeru-verifymount-XXXXXX")
cleanup() {
  [ -n "${HARNESS_PID:-}" ] && kill "$HARNESS_PID" 2>/dev/null || true
  rm -rf "$HOME_DIR"
}
trap cleanup EXIT

node --input-type=module -e '
import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
const [home, profile, plugin] = process.argv.slice(1)
const dir = join(home, "profiles", profile)
mkdirSync(dir, { recursive: true })
writeFileSync(join(dir, "package.json"), JSON.stringify({
  name: `dsh-profile-${profile}`,
  private: true,
  dependencies: {},
  dsh: { profile: { bundles: ["@deepseek-ai/dsh-base", "@deepseek-ai/dsh-web-app", plugin], patchReload: "live" } }
}, undefined, 2) + "\n")
writeFileSync(join(dir, "cordis.patch.yml"), "[]\n")
writeFileSync(join(dir, "pnpm-workspace.yaml"), "packages:\n  - .\n")
' "$HOME_DIR" "$PROFILE" "@muen/$PLUGIN"

# The loader imports each entry from the PROFILE anchor, so the plugin must be
# reachable from the profile's node_modules — this is exactly what ensureProfile
# does in the app, and what `dsh plugin add` achieves with its own symlink.
# Without it the boot dies with
# `Cannot find package ... imported from <profileDir>`, even though resolveBundleDir
# already accepted the name from the installation tree.
mkdir -p "$HOME_DIR/profiles/$PROFILE/node_modules/@muen"
ln -sfn "$(pwd)/$HARNESS/node_modules/@muen/$PLUGIN" "$HOME_DIR/profiles/$PROFILE/node_modules/@muen/$PLUGIN"

# --- boot it, and take the URL straight off the readiness line -----------------
LOG="$HOME_DIR/boot.log"
DSH_HOME="$HOME_DIR" node "$ENTRY" --profile "$PROFILE" --no-open \
  --host 127.0.0.1 --port 0 > "$LOG" 2>&1 &
HARNESS_PID=$!

URL=''
for _ in $(seq 1 40); do
  URL=$(sed -n 's/^dsh web: \(http.*\)$/\1/p' "$LOG" 2>/dev/null | head -1)
  [ -n "$URL" ] && break
  sleep 0.5
done
if [ -z "$URL" ]; then
  echo "[FAIL] harness never printed a readiness line; log:"
  cat "$LOG"
  exit 1
fi
echo "verify:mount harness up at $URL"

# --- the renderer half --------------------------------------------------------
# Electron, not Chrome: it is the runtime this app actually ships on, so a pass
# here is a pass in the app's own engine (sandbox + contextIsolation included).
./node_modules/.bin/electron scripts/mount-probe.cjs "$URL"
