#!/usr/bin/env bash
# theme:preview — look at the EVA theme in the real UI, without building a DMG.
#
# Why this exists: the plugin has no build step. `lib/client.js` and
# `themes/*.json` are loaded straight from the source tree, so a token edit is
# visible after a page reload — while a DMG is a sign/notarize/upload cycle
# costing minutes per iteration. Colour work needs the fast loop.
#
# It does NOT touch your installed app or your normal profile: it boots the
# harness against a throwaway DSH_HOME, so nothing you have saved changes.
#
#   pnpm theme:preview              boot a window you can click around in
#   pnpm theme:preview --shot       boot, capture both themes, exit
#   pnpm theme:preview --shot eva-00   capture one theme only
#   pnpm theme:preview --frameless  boot a FRAMELESS window (no title bar,
#                                   native traffic lights, drag strip) to
#                                   judge moving the window by hand
#                                   add --no-outline to hide the debug outlines
#
# Screenshots land in artifacts/theme-preview/.
set -uo pipefail
cd "$(dirname "$0")/.." # packages/mitsumeru

PLUGIN=dsh-eva-theme
HARNESS=build/harness
ENTRY="$HARNESS/node_modules/@deepseek-ai/dsh/lib/bin.js"
OUT_DIR=artifacts/theme-preview
SHOT=0
FRAMELESS=0
ONLY=""
EXTRA=()

# Unknown arguments are IGNORED with a note, not fatal. Pasting a command with
# the trailing `# comment` still attached is easy to do — the shell only strips
# a comment that starts a word, so `pnpm theme:preview                  # note`
# arrives here as the literal words "#", "note". Refusing to run over that is a
# worse outcome than starting the window the user asked for.
IGNORED=()
for arg in "$@"; do
  case "$arg" in
    --shot) SHOT=1 ;;
    --frameless) FRAMELESS=1 ;;
    --no-outline) EXTRA+=("$arg") ;;
    --settings) EXTRA+=("$arg") ;;
    eva-01|eva-00) ONLY="$arg" ;;
    --help|-h)
      echo "usage: theme:preview [--shot] [--frameless] [--settings] [--no-outline] [eva-01|eva-00]"
      echo "  (no flags)   a normal window to click around in"
      echo "  --shot       screenshot both themes, then exit"
      echo "  --frameless  no title bar; drag strip at the top"
      echo "  --no-outline  hide the pink/blue drag debugging outlines"
      echo "  --settings   open Settings on launch (it is a modal, so it blocks the app otherwise)"
      exit 0 ;;
    *) IGNORED+=("$arg") ;;
  esac
done

if [ "${#IGNORED[@]}" -gt 0 ]; then
  echo "theme:preview — ignoring unrecognised argument(s): ${IGNORED[*]}"
  echo "                (a trailing '#' comment often arrives as arguments; just the command is enough)"
fi

[ -f "$ENTRY" ] || { echo "[FAIL] $ENTRY missing — run: pnpm harness"; exit 1; }
[ -f "plugins/$PLUGIN/lib/client.js" ] || { echo "[FAIL] plugins/$PLUGIN missing"; exit 1; }

# --- vendor the plugin from SOURCE (same copy prepare-harness.sh does) ---------
# Cheap and idempotent, so an edit to the source tree is always what you see.
DEST="$HARNESS/node_modules/@muen/$PLUGIN"
mkdir -p "$DEST/lib" "$DEST/themes"
cp "plugins/$PLUGIN/package.json" "plugins/$PLUGIN/cordis.patch.yml" "$DEST/"
cp plugins/$PLUGIN/lib/*.js "$DEST/lib/"
cp plugins/$PLUGIN/themes/*.json "$DEST/themes/"
echo "theme:preview — vendored $PLUGIN from source"

# --- throwaway home, cleaned up on exit ---------------------------------------
HOME_DIR=$(mktemp -d "${TMPDIR:-/tmp}/mitsumeru-theme-preview-XXXXXX")
cleanup() {
  [ -n "${HARNESS_PID:-}" ] && kill "$HARNESS_PID" 2>/dev/null
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
  name: `dsh-profile-${profile}`, private: true, dependencies: {},
  dsh: { profile: { bundles: ["@deepseek-ai/dsh-base", "@deepseek-ai/dsh-web-app", plugin], patchReload: "live" } }
}, undefined, 2) + "\n")
writeFileSync(join(dir, "cordis.patch.yml"), "[]\n")
writeFileSync(join(dir, "pnpm-workspace.yaml"), "packages:\n  - .\n")
' "$HOME_DIR" mitsu "@muen/$PLUGIN"

mkdir -p "$HOME_DIR/profiles/mitsu/node_modules/@muen"
ln -sfn "$(pwd)/$HARNESS/node_modules/@muen/$PLUGIN" "$HOME_DIR/profiles/mitsu/node_modules/@muen/$PLUGIN"

LOG="$HOME_DIR/boot.log"
DSH_HOME="$HOME_DIR" node "$ENTRY" --profile mitsu --no-open --host 127.0.0.1 --port 0 > "$LOG" 2>&1 &
HARNESS_PID=$!

URL=''
for _ in $(seq 1 60); do
  URL=$(sed -n 's/^dsh web: \(http.*\)$/\1/p' "$LOG" 2>/dev/null | head -1)
  [ -n "$URL" ] && break
  sleep 0.5
done
if [ -z "$URL" ]; then
  echo "[FAIL] harness never came up; log:"; cat "$LOG"; exit 1
fi
echo "theme:preview — harness up at $URL"

if [ "$SHOT" -eq 1 ]; then
  mkdir -p "$OUT_DIR"
  ARGS=("$URL" "$(pwd)/$OUT_DIR")
  [ -n "$ONLY" ] && ARGS+=("$ONLY")
  ./node_modules/.bin/electron scripts/theme-preview-shot.cjs "${ARGS[@]}"
  exit $?
fi

# Frameless prototype: no title bar, native traffic lights, drag strip.
if [ "$FRAMELESS" -eq 1 ]; then
  echo "theme:preview — opening a FRAMELESS window (Ctrl-C here to stop)"
  # ${EXTRA[@]+...} not ${EXTRA[@]}: under `set -u`, expanding an EMPTY
  # array is an unbound-variable error, which killed the plain
  # `--frameless` run (only `--frameless --no-outline` worked).
  exec ./node_modules/.bin/electron scripts/frameless-open.cjs "$URL" ${EXTRA[@]+"${EXTRA[@]}"}
fi

# Interactive: a real, visible window on the live app. Edit a token, reload.
echo "theme:preview — opening a window (Ctrl-C here to stop)"
exec ./node_modules/.bin/electron scripts/theme-preview-open.cjs "$URL"
