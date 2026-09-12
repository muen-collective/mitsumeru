#!/usr/bin/env bash
# capture:app — screenshots of the REAL, packaged app, for design reference.
#
# Why the packaged app and not the dev build: this captures what a client
# actually sees — the shipped brand package in the sidebar, the shipped icon, the
# real window. A dev run can differ, which is exactly the confusion this avoids.
#
# Throwaway DSH_HOME on purpose: the shots show a clean first-run state, not
# whatever the developer's own profile has accumulated, and nothing here touches
# the real profile.
#
# MITSUMERU_SMOKE=1 makes the app quit by itself once the harness UI reports
# loaded; MITSUMERU_SCREENSHOT=1 makes it write the PNG first. Both are the
# switches the smoke scripts already use, so this drives the same code path.
#
#   bash scripts/capture-app.sh [out-dir]
#
# TWO THINGS THIS HAS TO GET RIGHT, both measured 2026-09-12:
#
#   1. The app must not be running. It takes a single-instance lock, and a second
#      launch exits immediately with `single-instance-denied quit` — which looks
#      exactly like a capture failure. Quit the app first.
#   2. The app writes its PNG into `artifacts/` next to the built output, not into
#      whatever directory this script was handed. The file is MOVED to out-dir
#      afterwards rather than the app being told where to write (it has no switch
#      for that).
set -euo pipefail
cd "$(dirname "$0")/.." # packages/mitsumeru

APP=release/mac-arm64/Mitsumeru.app
BIN="$APP/Contents/MacOS/Mitsumeru"
OUT=${1:-artifacts/landing}

[ -x "$BIN" ] || { echo "[FAIL] $BIN missing — run pnpm package:mac first"; exit 1; }

if pgrep -f "Mitsumeru.app/Contents/MacOS/Mitsumeru" >/dev/null 2>&1; then
  echo "[FAIL] Mitsumeru is already running and holds the single-instance lock."
  echo "       Launching now would exit with 'single-instance-denied quit', which"
  echo "       reads like a capture failure. Quit the app, then run this again."
  exit 1
fi

mkdir -p "$OUT"
WORK=$(mktemp -d "${TMPDIR:-/tmp}/mitsumeru-capture-XXXXXX")
cleanup() {
  [ -n "${APP_PID:-}" ] && kill "$APP_PID" 2>/dev/null || true
  rm -rf "$WORK"
}
trap cleanup EXIT

# Clear any earlier shot, so a stale file can never be mistaken for this run's.
rm -f artifacts/screenshot-*.png

echo "capture: launching the packaged app (throwaway DSH_HOME at $WORK/state)"

MITSUMERU_SMOKE=1 \
MITSUMERU_SCREENSHOT=1 \
MITSUMERU_DSH_HOME="$WORK/state" \
MITSUMERU_LOG_DIR="$WORK/logs" \
MITSUMERU_UPDATE_DISABLE=1 \
  "$BIN" > "$WORK/run.log" 2>&1 &
APP_PID=$!

for _ in $(seq 1 120); do
  grep -q 'screenshot ' "$WORK/run.log" 2>/dev/null && break
  grep -q 'smoke-quit' "$WORK/run.log" 2>/dev/null && break
  kill -0 "$APP_PID" 2>/dev/null || break
  sleep 1
done
sleep 2
kill "$APP_PID" 2>/dev/null || true
sleep 1
kill -9 "$APP_PID" 2>/dev/null || true

echo "--- run log (signals) ---"
grep -E "plugin-linked|harness-ready|harness-ui-loaded|dom-nodes |screenshot|smoke-quit|single-instance|harness-failed" "$WORK/run.log" || echo "(no matching lines)"

FOUND=$(ls -t artifacts/screenshot-*.png 2>/dev/null | head -1 || true)
if [ -z "$FOUND" ]; then
  echo "[FAIL] no screenshot was written — see the log above"
  exit 1
fi

# The window is 1280x800 (src/main/index.ts); capturePage returns it at the
# device scale factor, so a 2x display yields 2560x1600 for Figma at 2x.
NAME="window-$(date +%Y%m%d-%H%M%S).png"
mv "$FOUND" "$OUT/$NAME"
echo "capture: wrote $OUT/$NAME"
sips -g pixelWidth -g pixelHeight "$OUT/$NAME" 2>/dev/null | grep pixel
