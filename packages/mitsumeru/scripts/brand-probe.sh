#!/usr/bin/env bash
# Does the sidebar brand seat actually hold OUR mark? Read back from a renderer.
#
# The companion to verify-mount.sh, and it exists for the same class of failure:
# a slot occupant that loses silently. The seat is exclusive, upstream ships an
# occupant of its own, and losing that contest produces NO error anywhere — the
# app boots, the UI is complete, and the sidebar simply belongs to somebody else.
# That is what happened for a week of releases. So the winner is asserted, and
# the assertion is positive: our mark present AND the fallback's text absent.
#
# Hermetic: a throwaway DSH_HOME with the profile the app itself writes, so this
# exercises the real fresh-install path rather than the developer's own profile.
#
# Requires a prepared harness tree (`pnpm harness`).
set -euo pipefail
cd "$(dirname "$0")/.." # packages/mitsumeru

PROFILE=mitsu
HARNESS=build/harness
ENTRY="$HARNESS/node_modules/@deepseek-ai/dsh/lib/bin.js"
BRAND=@muen/dsh-brand-mitsumeru

[ -f "$ENTRY" ] || { echo "[FAIL] $ENTRY missing — run: pnpm harness"; exit 1; }

HOME_DIR=$(mktemp -d "${TMPDIR:-/tmp}/mitsumeru-brandprobe-XXXXXX")
cleanup() {
  [ -n "${HARNESS_PID:-}" ] && kill "$HARNESS_PID" 2>/dev/null || true
  rm -rf "$HOME_DIR"
}
trap cleanup EXIT

# The profile manifest the shell writes: our bundles, in order. Written here with
# node so the JSON shape matches src/main/harness.ts exactly (base first, then
# ours) — if that shape changes and this drifts, the probe stops representing
# what ships.
node --input-type=module -e '
import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
const [home, profile, ...plugins] = process.argv.slice(1)
const dir = join(home, "profiles", profile)
mkdirSync(dir, { recursive: true })
writeFileSync(join(dir, "package.json"), JSON.stringify({
  name: `dsh-profile-${profile}`,
  private: true,
  dependencies: {},
  dsh: { profile: { bundles: ["@deepseek-ai/dsh-base", "@deepseek-ai/dsh-web-app", ...plugins], patchReload: "live" } }
}, undefined, 2) + "\n")
writeFileSync(join(dir, "cordis.patch.yml"), "[]\n")
writeFileSync(join(dir, "pnpm-workspace.yaml"), "packages:\n  - .\n")
' "$HOME_DIR" "$PROFILE" "$BRAND"

# Each plugin must also be reachable from the PROFILE anchor: the loader imports
# every entry from there, which is why `dsh plugin add` symlinks into the
# profile's own node_modules. Reproduced, not assumed.
#
# ONE entry, matching SHIPPED_PLUGINS. The appearance plugin used to be composed
# here too; it was dropped 2026-09-12 and the probe mirrors what ships, so this
# list must move with it or the probe stops representing the app.
for name in "$BRAND"; do
  src="$HARNESS/node_modules/$name"
  [ -d "$src" ] || { echo "[FAIL] $src is not in the harness tree — run: pnpm harness"; exit 1; }
  dest="$HOME_DIR/profiles/$PROFILE/node_modules/$name"
  mkdir -p "$(dirname "$dest")"
  ln -sfn "$(pwd)/$src" "$dest"
done

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
echo "brand-probe: harness up at $URL"

# Electron, not Chrome: this app ships on Electron, so a pass here is a pass in
# the engine that matters (sandbox + contextIsolation included).
./node_modules/.bin/electron scripts/brand-probe.cjs "$URL"
