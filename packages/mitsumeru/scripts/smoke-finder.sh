#!/usr/bin/env bash
# mitsumeru smoke:finder — the smoke that reproduces a DOUBLE-CLICK.
#
# Why this exists (measured 2026-09-11): `pnpm smoke` launches the app as a child
# of your shell, so PATH contains node and `resolveNodePath` picks it. Finder
# launches the app with a minimal PATH, so the shell falls back to
# Electron-as-node — and that is where the harness died:
#
#   Error: failed to apply loader entry … (@deepseek-ai/cordis-plugin-hmr):
#   --expose-internals is required for HMR service
#
# 0.1.3-dev shipped because the smoke run could not see the path a real install
# takes. This script is the same assertions with the REAL exit path: env -i (only
# HOME/PATH/USER/SHELL, exactly what launchd gives a GUI app) and cwd /.
#
#   pnpm build && pnpm smoke:finder
set -uo pipefail
cd "$(dirname "$0")/.."

if [ ! -f out/main/index.js ]; then
  echo "[FAIL] out/main/index.js missing — run 'pnpm build' first"
  exit 1
fi

# Resolve the real Electron binary BEFORE the environment is stripped. Not
# node_modules/.bin/electron: that is a shell shim whose first line execs `node`,
# and node is deliberately absent from the stripped PATH, so the shim dies with
# "node: not found" and the run never reaches the app (measured 2026-09-11).
ELECTRON=$(node -p "require('electron')")
if [ ! -x "$ELECTRON" ]; then
  echo "[FAIL] electron binary not found at $ELECTRON — run pnpm install"
  exit 1
fi

LOG=$(mktemp -t mitsumeru-smoke-finder)
STATE=$(mktemp -d -t mitsumeru-smoke-finder-state)

count_harness() { pgrep -f "@deepseek-ai/dsh/lib/bin.js" | wc -l | tr -d ' '; }
before=$(count_harness)

# `node` must NOT be reachable, or this is just smoke.sh again. PATH=/usr/bin:/bin
# is what Finder's children get; it contains neither our node nor the workspace.
env -i \
  HOME="$HOME" \
  USER="$USER" \
  SHELL="${SHELL:-/bin/zsh}" \
  PATH=/usr/bin:/bin \
  TMPDIR="${TMPDIR:-/tmp}" \
  MITSUMERU_SMOKE=1 \
  MITSUMERU_DSH_HOME="$STATE" \
  MITSUMERU_LOG_DIR="$STATE/logs" \
  "$ELECTRON" . >"$LOG" 2>&1 &
app_pid=$!

for _ in $(seq 1 90); do
  grep -q 'smoke-quit' "$LOG" && break
  kill -0 "$app_pid" 2>/dev/null || break
  sleep 1
done
sleep 2 # let the child reap

status=0
check() {
  if grep -q "$2" "$LOG"; then
    echo "[PASS] $1"
  else
    echo "[FAIL] $1"
    status=1
  fi
}

# The precondition this whole script exists for: the app must be driving the
# harness through Electron-as-node, not a real node from PATH.
if grep -q 'expose-internals' "$LOG" || ! grep -q 'harness-ready' "$LOG"; then
  echo "[FAIL] harness did not survive a PATHless launch (the 0.1.3-dev failure)"
fi
check "harness readiness line" 'harness-ready http://127.0.0.1'
check "harness UI loaded"      'harness-ui-loaded'
check "smoke quit"             'smoke-quit'

if grep -q 'expose-internals is required' "$LOG"; then
  echo "[FAIL] HMR refused the boot: --expose-internals missing on the electron-as-node path"
  status=1
fi

after=$(count_harness)
if [ "$after" -le "$before" ]; then
  echo "[PASS] no orphan harness (before=$before after=$after)"
else
  echo "[FAIL] orphan harness (before=$before after=$after)"
  status=1
fi

if kill -0 "$app_pid" 2>/dev/null; then
  echo "[FAIL] app still running — killing"
  kill "$app_pid" 2>/dev/null
  status=1
else
  echo "[PASS] app exited"
fi

if [ "$status" -ne 0 ]; then
  echo "--- log tail ($LOG) ---"
  tail -30 "$LOG"
fi
exit "$status"
