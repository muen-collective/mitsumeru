#!/usr/bin/env bash
# mitsumeru smoke — runs the BUILT app (no build step) and asserts that the harness
# child booted, the UI loaded into the window, and the child exited on quit.
# Prints [PASS]/[FAIL] per check and exits non-zero on any failure.
#
#   pnpm build && pnpm smoke
set -uo pipefail
cd "$(dirname "$0")/.."

if [ ! -f out/main/index.js ]; then
  echo "[FAIL] out/main/index.js missing — run 'pnpm build' first"
  exit 1
fi

LOG=$(mktemp -t mitsumeru-smoke)
STATE=$(mktemp -d -t mitsumeru-smoke-state)
export MITSUMERU_SMOKE=1
export MITSUMERU_DSH_HOME="${MITSUMERU_DSH_HOME:-$STATE}"
export MITSUMERU_LOG_DIR="${MITSUMERU_LOG_DIR:-$STATE/logs}"

count_harness() { pgrep -f "@deepseek-ai/dsh/lib/bin.js" | wc -l | tr -d ' '; }

before=$(count_harness)
node_modules/.bin/electron . >"$LOG" 2>&1 &
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

check "harness readiness line" 'harness-ready http://127.0.0.1'
check "harness UI loaded"      'harness-ui-loaded'
check "smoke quit"             'smoke-quit'

# A clean run logs no lockdown denies at all.
if grep -q '\[lockdown\] deny' "$LOG"; then
  echo "[FAIL] lockdown denies present"
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
