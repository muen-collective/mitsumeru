#!/usr/bin/env bash
# capture:live — screenshot the RUNNING Mitsumeru window, at 2x, for Figma.
#
# This is the one to use when the reference should show real content — your own
# workspaces and sessions — rather than an empty first run.
#
# It cannot use the app's own capturePage route: a second launch exits on the
# single-instance lock (src/main/index.ts), and the running app exposes no
# screenshot call. So this drives the OS window server instead, which also means
# it captures the real window frame, shadow and all, exactly as it sits on screen.
#
# Coordinate note, since it is the only subtlety here: System Events reports
# position and size in points, and `screencapture -R` takes points too (writing at
# native scale). No conversion is needed, and adding one is a bug — see below.
#
#   bash scripts/capture-live.sh [out-dir]
#
# Requires: the app to be running, and Screen Recording permission for whatever
# terminal runs this (System Settings → Privacy & Security → Screen Recording).
set -euo pipefail
cd "$(dirname "$0")/.." # packages/mitsumeru

OUT=${1:-artifacts/landing}
mkdir -p "$OUT"

if ! pgrep -f "Mitsumeru.app/Contents/MacOS/Mitsumeru" >/dev/null 2>&1; then
  echo "[FAIL] Mitsumeru is not running — launch it, then run this again."
  exit 1
fi

# position + size, in points. e.g. `864, 446, 1778, 927`
GEOM=$(osascript -e 'tell application "System Events" to tell process "Mitsumeru" to get {position, size} of window 1' 2>/dev/null || true)
if [ -z "$GEOM" ]; then
  echo "[FAIL] could not read the window geometry."
  echo "       Accessibility permission is needed for the terminal running this:"
  echo "       System Settings → Privacy & Security → Accessibility."
  exit 1
fi

IFS=', ' read -r X Y W H <<< "$GEOM"
echo "capture-live: window at ${X},${Y} size ${W}x${H} (points)"

# `screencapture -R` takes POINTS and writes the file at the display's native
# scale, so the geometry from System Events passes through unchanged. Measured
# 2026-09-12: `-R 864,446,1778,927` on this 2x display produced a 3556x1854 PNG —
# exactly 2x the region, with no arithmetic on our side. Multiplying the region
# here (the first attempt at this script) asked for a rectangle past the screen
# edge and returned a 2560x1600 crop of the wrong area.
NAME="live-$(date +%Y%m%d-%H%M%S).png"
# -x no sound, -o no window shadow (the shadow belongs to a screen, not a design)
screencapture -x -o -R "${X},${Y},${W},${H}" "$OUT/$NAME"

if [ ! -f "$OUT/$NAME" ]; then
  echo "[FAIL] screencapture wrote nothing — Screen Recording permission, most likely."
  exit 1
fi

sips -g pixelWidth -g pixelHeight "$OUT/$NAME" 2>/dev/null | grep pixel
echo "capture-live: wrote $OUT/$NAME"
