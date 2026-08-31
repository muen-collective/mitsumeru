#!/usr/bin/env bash
# install-mitsu.sh — one-command mitsu-dsh installer (dsh-npx style, from the muen git fork).
#
#   curl -fsSL https://raw.githubusercontent.com/muen-collective/mitsumeru/feat/mitsu-foundation/scripts/install-mitsu.sh | bash
#
# What it does:
#   1. Checks prerequisites: git, node ≥22.19, pnpm (via corepack, pinned by the fork).
#   2. Clones (or pulls) the muen-collective/mitsumeru fork into $MITSU_DIR.
#   3. pnpm install + pnpm run build (the fork's CLI + web frontend are build artifacts).
#   4. Creates the standalone `mitsu` profile at ~/.dsh/profiles/mitsu (all 9 @muen bundles).
#   5. Links the fork's own workspace packages into its root node_modules (the vendored
#      loader resolves bare @deepseek-ai/* and @muen/* from there).
#   6. Prints the exact command to start it (and launches it if you pass --start).
#
# Env overrides: MITSU_DIR (default ~/mitsu-dsh), MITSU_BRANCH (default feat/mitsu-foundation),
# MITSU_PORT (default 57691), MITSU_GIT (default the muen remote).
set -euo pipefail

MITSU_GIT="${MITSU_GIT:-https://github.com/muen-collective/mitsumeru.git}"
MITSU_BRANCH="${MITSU_BRANCH:-feat/mitsu-foundation}"
MITSU_DIR="${MITSU_DIR:-$HOME/mitsu-dsh}"
MITSU_PORT="${MITSU_PORT:-57691}"
DSH_HOME="${DSH_HOME:-$HOME/.dsh}"

echo "== mitsu-dsh installer =="
echo "  git:      $MITSU_GIT ($MITSU_BRANCH)"
echo "  target:   $MITSU_DIR"
echo "  port:     $MITSU_PORT"
echo "  dsh home: $DSH_HOME"

# --- 1. prerequisites ---------------------------------------------------------
command -v git >/dev/null 2>&1 || { echo "✗ git not found — install Xcode CLT or git"; exit 1; }

NODE_BIN="$(command -v node || true)"
if [ -z "$NODE_BIN" ]; then
  echo "✗ node not found on PATH — install Node.js ≥22.19 (https://nodejs.org)"; exit 1
fi
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
NODE_MINOR="$(node -p 'process.versions.node.split(".")[1]')"
if [ "$NODE_MAJOR" -lt 22 ] || { [ "$NODE_MAJOR" -eq 22 ] && [ "$NODE_MINOR" -lt 19 ]; }; then
  echo "✗ node $(node --version) too old — need ≥22.19 or ≥24"; exit 1
fi
echo "  node:     $(node --version) ✓"

if command -v corepack >/dev/null 2>&1; then
  PNPM=(corepack pnpm)
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
    "@muen/mitsu-providers": "link:$MITSU_DIR/plugins/mitsu-providers",
    "@muen/mitsu-rail": "link:$MITSU_DIR/plugins/mitsu-rail",
    "@muen/mitsu-settings": "link:$MITSU_DIR/plugins/mitsu-settings",
    "@muen/mitsu-starter-pack": "link:$MITSU_DIR/plugins/mitsu-starter-pack"
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
        "@muen/mitsu-providers",
        "@muen/mitsu-rail",
        "@muen/mitsu-settings",
        "@muen/mitsu-starter-pack"
      ],
      "patchReload": "live"
    }
  }
}
EOF
  printf '# mitsu profile — user patch layer\n[]\n' > "$PROFILE_DIR/cordis.patch.yml"
  printf '# dsh profile root — composed from bundles + cordis.patch.yml\n[]\n' > "$PROFILE_DIR/cordis.yml"
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
  name=$(node -e "try{console.log(require('./${f#./}').name)}catch(e){}" 2>/dev/null)
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
PORT="\${MITSU_PORT:-$MITSU_PORT}"
LOG=/tmp/mitsu-server.log
if curl -s --max-time 2 "http://127.0.0.1:\$PORT" >/dev/null 2>&1; then
  echo "mitsu-dsh already running at http://127.0.0.1:\$PORT"
else
  nohup node --expose-internals "$MITSU_DIR/apps/cli/lib/bin.js" --profile mitsu --port "\$PORT" --no-open >"\$LOG" 2>&1 &
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
echo "  start now: $BIN_DIR/mitsu"
echo
if [ "${1:-}" = "--start" ]; then
  echo "== starting mitsu-dsh =="
  "$BIN_DIR/mitsu"
fi
