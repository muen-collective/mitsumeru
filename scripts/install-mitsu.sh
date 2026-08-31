#!/usr/bin/env bash
# install-mitsu.sh — one-command mitsu-dsh installer (dsh-npx style, from the muen git fork).
#
#   curl -fsSL https://raw.githubusercontent.com/muen-collective/mitsumeru/feat/mitsu-foundation/scripts/install-mitsu.sh | bash
#
# What it does:
#   1. Checks prerequisites: git, node ≥22.19, pnpm (via corepack, pinned by the fork).
#   2. Clones (or pulls) the muen-collective/mitsumeru fork into $MITSU_DIR.
#   3. pnpm install + pnpm run build (the fork's CLI + web frontend are build artifacts).
#   4. Creates the standalone `mitsu` profile at $MITSU_HOME/profiles/mitsu (all 9 @muen
#      bundles), with app files in the hidden $MITSU_HOME (~/.mitsu-dsh) and project files
#      (workspace + attachments) in the visible $MITSU_PROJECT (~/Mitsu).
#   5. Links the fork's own workspace packages into its root node_modules (the vendored
#      loader resolves bare @deepseek-ai/* and @muen/* from there).
#   6. Pre-seeds the welcome-notice acknowledgement so first launch never blocks on
#      "The acknowledgement could not be saved".
#   7. Installs a `mitsu` command (prints it; launches if you pass --start).
#
# Env overrides: MITSU_DIR (default ~/mitsu-dsh), MITSU_BRANCH (default feat/mitsu-foundation),
# MITSU_PORT (default 57691), MITSU_GIT (default the muen remote),
# MITSU_HOME (default ~/.mitsu-dsh — hidden app files), MITSU_PROJECT (default ~/Mitsu — visible project files).
set -euo pipefail

MITSU_GIT="${MITSU_GIT:-https://github.com/muen-collective/mitsumeru.git}"
MITSU_BRANCH="${MITSU_BRANCH:-feat/mitsu-foundation}"
MITSU_DIR="${MITSU_DIR:-$HOME/mitsu-dsh}"
MITSU_PORT="${MITSU_PORT:-57691}"
MITSU_HOME="${MITSU_HOME:-$HOME/.mitsu-dsh}"
MITSU_PROJECT="${MITSU_PROJECT:-$HOME/Mitsu}"
DSH_HOME="$MITSU_HOME"
export MITSU_DIR
export MITSU_PROJECT

mkdir -p "$MITSU_HOME" "$MITSU_PROJECT"
PROFILE_DIR="$MITSU_HOME/profiles/mitsu"

echo "== mitsu-dsh installer =="
echo "  git:        $MITSU_GIT ($MITSU_BRANCH)"
echo "  fork:       $MITSU_DIR"
echo "  port:       $MITSU_PORT"
echo "  app files:  $MITSU_HOME   (hidden)"
echo "  project:    $MITSU_PROJECT (visible — workspace + attachments)"

# --- 1. prerequisites ---------------------------------------------------------
command -v git >/dev/null 2>&1 || { echo "✗ git not found — install Xcode CLT or git"; exit 1; }

# Resolve Node: prefer a user-managed runtime (nvm), then PATH. Never lean on
# another app's bundled node (dsh-desktop, Hermes, etc.) — it can vanish when
# that app is uninstalled. The chosen binary is pinned into the `mitsu` command.
NODE_BIN=""
for candidate in "$HOME"/.nvm/versions/node/*/bin/node; do
  [ -x "$candidate" ] || continue
  major="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || true)"
  # prefer v24+ (>=24) which the fork accepts outright; keep first v22.19+ as fallback
  if [ "${major:-0}" -ge 24 ]; then NODE_BIN="$candidate"; break; fi
  [ -z "$NODE_BIN" ] && NODE_BIN="$candidate"
done
if [ -z "$NODE_BIN" ] && command -v node >/dev/null 2>&1; then
  NODE_BIN="$(command -v node)"
fi
if [ -z "$NODE_BIN" ] || [ ! -x "$NODE_BIN" ]; then
  echo "✗ no usable Node.js found — install Node.js ≥22.19 (https://nodejs.org) or via nvm"; exit 1
fi
NODE_MAJOR="$("$NODE_BIN" -p 'process.versions.node.split(".")[0]')"
NODE_MINOR="$("$NODE_BIN" -p 'process.versions.node.split(".")[1]')"
if [ "$NODE_MAJOR" -lt 22 ] || { [ "$NODE_MAJOR" -eq 22 ] && [ "$NODE_MINOR" -lt 19 ]; }; then
  echo "✗ node $("$NODE_BIN" --version) too old — need ≥22.19 or ≥24"; exit 1
fi
echo "  node:     $("$NODE_BIN" --version) at $NODE_BIN ✓"

if [ -x "$(dirname "$NODE_BIN")/corepack" ]; then
  PNPM=("$(dirname "$NODE_BIN")/corepack" pnpm)
elif command -v pnpm >/dev/null 2>&1; then
  PNPM=(pnpm)
else
  echo "✗ neither corepack nor pnpm found — install Node ≥22.19 (ships corepack)"; exit 1
fi
echo "  pnpm:     $("${PNPM[@]}" --version 2>/dev/null || echo "via corepack")"

# --- 2. clone / pull ------------------------------------------------------------
if [ -d "$MITSU_DIR/.git" ]; then
  echo "== updating existing checkout at $MITSU_DIR =="
  git -C "$MITSU_DIR" fetch origin
  git -C "$MITSU_DIR" checkout "$MITSU_BRANCH" 2>/dev/null || true
  git -C "$MITSU_DIR" pull --ff-only origin "$MITSU_BRANCH"
else
  echo "== cloning $MITSU_GIT ($MITSU_BRANCH) =="
  mkdir -p "$(dirname "$MITSU_DIR")"
  git clone --branch "$MITSU_BRANCH" --single-branch "$MITSU_GIT" "$MITSU_DIR"
fi
cd "$MITSU_DIR"

# --- 3. install + build ----------------------------------------------------------
echo "== pnpm install =="
"${PNPM[@]}" install --frozen-lockfile
echo "== pnpm run build (CLI + web frontend) — this takes a few minutes =="
"${PNPM[@]}" run build

# --- 4. create the mitsu profile --------------------------------------------------
PROFILE_DIR="$DSH_HOME/profiles/mitsu"
if [ -f "$PROFILE_DIR/package.json" ]; then
  echo "== profile exists at $PROFILE_DIR — re-linking @muen bundles =="
else
  echo "== creating mitsu profile at $PROFILE_DIR =="
  mkdir -p "$PROFILE_DIR"
  cat > "$PROFILE_DIR/package.json" <<EOF
{
  "name": "dsh-profile-mitsu",
  "private": true,
  "dependencies": {
    "@muen/mitsu-assets": "link:$MITSU_DIR/plugins/mitsu-assets",
    "@muen/mitsu-brand": "link:$MITSU_DIR/plugins/mitsu-brand",
    "@muen/mitsu-browser": "link:$MITSU_DIR/plugins/mitsu-browser",
    "@muen/mitsu-docs": "link:$MITSU_DIR/plugins/mitsu-docs",
    "@muen/mitsu-modes": "link:$MITSU_DIR/plugins/mitsu-modes",
    "@muen/mitsu-rail": "link:$MITSU_DIR/plugins/mitsu-rail",
    "@muen/mitsu-settings": "link:$MITSU_DIR/plugins/mitsu-settings",
    "@muen/mitsu-starter-pack": "link:$MITSU_DIR/plugins/mitsu-starter-pack",
    "@muen/mitsu-updater": "link:$MITSU_DIR/plugins/mitsu-updater"
  },
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "@deepseek-ai/dsh-web-app",
        "@muen/mitsu-assets",
        "@muen/mitsu-brand",
        "@muen/mitsu-browser",
        "@muen/mitsu-docs",
        "@muen/mitsu-modes",
        "@muen/mitsu-rail",
        "@muen/mitsu-settings",
        "@muen/mitsu-starter-pack",
        "@muen/mitsu-updater"
      ],
      "patchReload": "live"
    }
  }
}
EOF
  # Patch: redirect the attachment store OUT of the hidden home into the visible
  # project dir, and pin the sandbox workspace root to the project dir.
  cat > "$PROFILE_DIR/cordis.patch.yml" <<EOF
# mitsu profile — user patch layer
- id: attachment-local
  config:
    dshHome: "$MITSU_PROJECT"
- id: sandbox-policy
  config:
    workspaceRoot: !!js process.env.MITSU_PROJECT
EOF
  printf '# dsh profile root — composed from bundles + cordis.patch.yml\n[]\n' > "$PROFILE_DIR/cordis.yml"
fi

# Pre-seed the welcome-notice acknowledgement so a fresh home never shows
# "The acknowledgement could not be saved" on first launch.
if [ ! -f "$MITSU_HOME/settings.yaml" ]; then
  printf 'ui-onboarding:\n  welcomeNoticeVersion: 2026-08-13.1\n' > "$MITSU_HOME/settings.yaml"
fi

# Materialize the profile's node_modules (the link: deps become @muen symlinks the
# loader resolves against the profile dir). Re-run on every install to keep links fresh.
echo "== installing profile dependencies ($PROFILE_DIR) =="
( cd "$PROFILE_DIR" && "${PNPM[@]}" install --no-frozen-lockfile )

# --- 5. link workspace packages into the fork root (vendored loader) --------------
echo "== linking workspace packages into fork root node_modules =="
mkdir -p "$MITSU_DIR/node_modules/@deepseek-ai" "$MITSU_DIR/node_modules/@muen"
find "$MITSU_DIR/packages" "$MITSU_DIR/vendor" "$MITSU_DIR/apps" "$MITSU_DIR/native/landlock-run" "$MITSU_DIR/website" "$MITSU_DIR/python" \
  -maxdepth 3 -name package.json -not -path "*/node_modules/*" 2>/dev/null | while read -r f; do
  name=$("$NODE_BIN" -e "try{console.log(require('./${f#./}').name)}catch(e){}" 2>/dev/null)
  case "$name" in
    @deepseek-ai/*)
      short="${name#@deepseek-ai/}"
      [ -e "$MITSU_DIR/node_modules/@deepseek-ai/$short" ] || ln -s "$(dirname "$f")" "$MITSU_DIR/node_modules/@deepseek-ai/$short" 2>/dev/null
      ;;
  esac
done
for d in "$MITSU_DIR"/plugins/mitsu-*; do
  [ -d "$d" ] || continue
  name="$(basename "$d")"
  [ -e "$MITSU_DIR/node_modules/@muen/$name" ] || ln -s "$d" "$MITSU_DIR/node_modules/@muen/$name" 2>/dev/null
done

# --- 6. ready -----------------------------------------------------------------------
echo
echo "== mitsu-dsh installed =="
echo "  fork:      $MITSU_DIR"
echo "  profile:   $PROFILE_DIR"
echo

# Write a `mitsu` launcher command (dsh-npx style: one command to start).
BIN_DIR="${MITSU_BIN_DIR:-$HOME/.local/bin}"
mkdir -p "$BIN_DIR"
cat > "$BIN_DIR/mitsu" <<EOF
#!/usr/bin/env bash
# mitsu — start mitsu-dsh (web profile of the muen fork).
NODE="$NODE_BIN"
export DSH_HOME="\${MITSU_HOME:-$MITSU_HOME}"
export MITSU_DIR="\${MITSU_DIR:-$MITSU_DIR}"
export MITSU_PROJECT="\${MITSU_PROJECT:-$MITSU_PROJECT}"
export MITSU_WORKSPACE="\${MITSU_WORKSPACE:-$MITSU_WORKSPACE}"
PORT="\${MITSU_PORT:-$MITSU_PORT}"
LOG=/tmp/mitsu-server.log
if curl -s --max-time 2 "http://127.0.0.1:\$PORT" >/dev/null 2>&1; then
  echo "mitsu-dsh already running at http://127.0.0.1:\$PORT"
else
  nohup "\$NODE" --expose-internals "$MITSU_DIR/apps/cli/lib/bin.js" --profile mitsu --port "\$PORT" --no-open >"\$LOG" 2>&1 &
  for _ in \$(seq 1 60); do
    curl -s --max-time 2 "http://127.0.0.1:\$PORT" >/dev/null 2>&1 && break
    sleep 1
  done
fi
APP_URL="\$(grep -o "http://127.0.0.1:\$PORT/?token=[A-Za-z0-9_-]*" "\$LOG" 2>/dev/null | head -1)"
[ -n "\$APP_URL" ] || APP_URL="http://127.0.0.1:\$PORT"
echo "mitsu-dsh: \$APP_URL"
if command -v open >/dev/null 2>&1; then open -na "Google Chrome" --args --app="\$APP_URL"; fi
EOF
chmod +x "$BIN_DIR/mitsu"
echo "  command:   $BIN_DIR/mitsu   (add $BIN_DIR to PATH)"

# --- 7. generate a Mitsu.app icon (drag to Applications / Dock) ------------------
# A macOS applet so a non-technical user can just double-click / drag an icon.
# It runs the freshly-generated `mitsu` launcher (which knows this machine's
# MITSU_DIR / MITSU_HOME). Built with osacompile on the user's own machine so the
# paths are correct; lives in ~/Applications (user-scoped, no sudo). If a
# mitsu.icns is shipped in the plugin's assets, inject it so the Dock/Launchpad
# shows the Mitsu brand instead of the generic script glyph.
APP_NAME="Mitsu"
APP_DIR="${MITSU_APP_DIR:-$HOME/Applications}"
ICNS_SRC="$MITSU_DIR/plugins/mitsu-updater/assets/mitsu.icns"
if command -v osacompile >/dev/null 2>&1; then
  mkdir -p "$APP_DIR"
  # Use a login shell so ~/.local/bin (and node) resolve; absolute paths only.
  SCRIPT="do shell script \"export HOME='$HOME'; export PATH='$BIN_DIR':\$PATH; '$BIN_DIR/mitsu'\""
  rm -f "$APP_DIR/$APP_NAME.app"
  if osacompile -o "$APP_DIR/$APP_NAME.app" -e "$SCRIPT" >/dev/null 2>&1; then
    # Inject the brand icon (if shipped) + point Info.plist at it.
    if [ -f "$ICNS_SRC" ]; then
      cp -f "$ICNS_SRC" "$APP_DIR/$APP_NAME.app/Contents/Resources/applet.icns" 2>/dev/null || true
    fi
    echo "  app icon:  $APP_DIR/$APP_NAME.app   (double-click, or drag to Applications / Dock)"
    # Bust the Finder icon cache so the new .applet icon shows immediately.
    if command -v osascript >/dev/null 2>&1; then
      osascript -e "tell application \"Finder\" to update every window" >/dev/null 2>&1 || true
    fi
  else
    echo "  app icon:  (osacompile failed — still use: $BIN_DIR/mitsu)"
  fi
else
  echo "  app icon:  (osacompile not available — still use: $BIN_DIR/mitsu)"
fi
echo "  start now: $BIN_DIR/mitsu"
echo
if [ "${1:-}" = "--start" ]; then
  echo "== starting mitsu-dsh =="
  "$BIN_DIR/mitsu"
fi
