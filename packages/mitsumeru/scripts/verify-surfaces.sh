#!/usr/bin/env bash
# verify:surfaces — does the app wear OUR brand, on every surface, read back
# from the artifact rather than assumed? (Epic 87 P9/A7, Epic 89 C12)
#
# Why this exists: the sidebar kept showing the upstream whale for a week of
# releases while the app was already ours everywhere else. Nothing was broken in
# a way any check could see — no error, no missing file, no failed boot. The brand
# package simply was not composed, so the seat kept its fallback occupant, and the
# only way to notice was to open the app and look. Every check in this repo at the
# time asserted that things LOADED; none asserted whose name was on the result.
#
# Three stages, cheapest first, and each one catches a different failure:
#
#   [1] source   — the brand package is shipped, and its patch layer both vacates
#                  upstream's seat and mounts ours. Catches the case where the
#                  package exists but is not wired in (the actual bug).
#   [2] bundle   — the built harness tree carries the package, and the icon has
#                  the geometry macOS expects. Catches the case where the source
#                  is right but the build did not pick it up (the 0.1.4-dev bug:
#                  the DMG predated its own vendoring commit).
#   [3] render   — a real renderer boots the profile and reports which brand is
#                  actually in the sidebar. Catches a seat occupant that loses to
#                  another one at runtime, which no static check can see.
#
# Stage 3 needs a harness tree on disk (`pnpm harness`); without it the stage is
# reported as skipped, not as a pass — a missing check must never read as green.
#
# Exits non-zero on any failure.
set -uo pipefail
cd "$(dirname "$0")/.." # packages/mitsumeru

BRAND=dsh-brand-mitsumeru
HARNESS=build/harness
status=0
ok()   { echo "[PASS] $1"; }
bad()  { echo "[FAIL] $1"; status=1; }
skip() { echo "[skip] $1"; }

# ── [1] source ───────────────────────────────────────────────────────────────

[ -f "plugins/$BRAND/package.json" ] \
  && ok "source: plugins/$BRAND exists" \
  || bad "source: plugins/$BRAND is missing — the sidebar seat has no occupant of ours"
[ -f "plugins/$BRAND/lib/client.js" ] \
  && ok "source: $BRAND has a client half" \
  || bad "source: $BRAND has no client half — nothing would render"

# Vendoring: the package must be copied into the shipped tree.
grep -q "for pkg in .*$BRAND" scripts/prepare-harness.sh \
  && ok "source: prepare-harness.sh vendors $BRAND" \
  || bad "source: prepare-harness.sh does not vendor $BRAND — the built app would not carry it"

# Composition: the profile manifest's bundles list comes from SHIPPED_PLUGINS.
grep -q "'@muen/$BRAND'" src/main/harness.ts \
  && ok "source: SHIPPED_PLUGINS composes @muen/$BRAND" \
  || bad "source: @muen/$BRAND is not in SHIPPED_PLUGINS — present on disk is not mounted"

# The two patch entries. This is the seat itself: without the disable, upstream's
# occupant competes for it and mount order decides the winner.
PATCH="plugins/$BRAND/cordis.patch.yml"
if [ -f "$PATCH" ]; then
  grep -q "id: ui-brand-official" "$PATCH" \
    && ok "source: patch vacates upstream's occupant (ui-brand-official)" \
    || bad "source: patch does not disable ui-brand-official — the seat is contested"
  grep -qE "^\s+disabled: true" "$PATCH" \
    && ok "source: the disable is actually set" \
    || bad "source: ui-brand-official is named but not disabled: true"
  grep -q "name: '@muen/$BRAND'" "$PATCH" \
    && ok "source: patch mounts @muen/$BRAND" \
    || bad "source: patch does not insert @muen/$BRAND"
else
  bad "source: $PATCH missing — the package would mount without vacating the seat"
fi

# The id we disable must still be the id upstream ships. Renamed upstream row =
# our disable silently stops applying = the whale comes back with no error.
UPSTREAM="$(ls "$HARNESS"/node_modules/@deepseek-ai/dsh-web-app/cordis.patch.yml 2>/dev/null || true)"
if [ -n "$UPSTREAM" ]; then
  grep -q "id: ui-brand-official" "$UPSTREAM" \
    && ok "source: upstream still ships id 'ui-brand-official' (the disable targets something real)" \
    || bad "source: upstream no longer ships 'ui-brand-official' — the disable is dead, the seat is contested again"
fi

# ── [2] bundle ───────────────────────────────────────────────────────────────

if [ -d "$HARNESS/node_modules/@deepseek-ai" ]; then
  DEST="$HARNESS/node_modules/@muen/$BRAND"
  [ -f "$DEST/package.json" ] \
    && ok "bundle: @muen/$BRAND is vendored into the shipped tree" \
    || bad "bundle: @muen/$BRAND is NOT in the harness tree — the packaged app has no brand"
  [ -f "$DEST/lib/client.js" ] && ok "bundle: vendored client half present" || bad "bundle: vendored client half missing"
  # The wordmark payload: without it the package mounts and renders nothing,
  # which looks exactly like the seat falling back to the whale.
  if [ -f "$DEST/lib/client.js" ]; then
    if node --input-type=module -e '
      import { readFileSync } from "node:fs"
      const src = readFileSync(process.argv[1], "utf8")
      const hits = [...src.matchAll(/data:image\/svg\+xml;base64,([A-Za-z0-9+/=]+)/g)].map((m) => m[1])
      if (hits.length < 2) { console.error(`only ${hits.length} embedded asset(s)`); process.exit(1) }
      let wordmark = 0
      for (const h of hits) {
        const svg = Buffer.from(h, "base64").toString("utf8")
        if (!svg.startsWith("<svg") || !svg.includes("</svg>")) { console.error("a payload is not SVG"); process.exit(1) }
        if (svg.includes("Mitsumeru")) wordmark++  // the wordmark carries its own alt-ish text node
      }
      // The cyan dot is the mark: #00EEFF, present in the Mark slot.
      if (!hits.some((h) => Buffer.from(h, "base64").toString("utf8").includes("00EEFF"))) {
        console.error("no cyan mark (#00EEFF) in any payload"); process.exit(1)
      }
      console.log(`${hits.length} embedded SVG asset(s), cyan mark present`)
    ' "$DEST/lib/client.js" >/dev/null 2>&1; then
      ok "bundle: embedded brand assets decode (cyan mark + wordmark present)"
    else
      bad "bundle: embedded brand assets are missing or unreadable — the row would mount blank"
    fi
  fi
else
  skip "bundle: no harness tree yet — run pnpm harness"
fi

# Icon geometry. Read, not eyeballed: the shipped icon must sit on the same grid
# macOS draws its own icons on, because an icon that is merely "present" can still
# be the wrong size beside every other app in the Dock (that was the 0.1.4-dev bug).
if [ -f build/icon.icns ]; then
  python3 - <<'PY'
import sys
try:
    from PIL import Image
except ImportError:
    print("[skip] bundle: Pillow not installed — cannot measure build/icon.icns")
    sys.exit(0)
im = Image.open("build/icon.icns").convert("RGBA")
bbox = im.split()[3].getbbox()
if bbox is None:
    print("[FAIL] bundle: build/icon.icns is fully transparent"); sys.exit(1)
fill = (bbox[2] - bbox[0]) / im.width
# 0.875 is Apple's own body grid (measured: Safari/Notes/Music/Calculator all
# 0.875 at 256px). 1.0 is the off-grid full-bleed the old fork shipped.
if 0.86 <= fill <= 0.89:
    print(f"[PASS] bundle: icon artwork fills {fill:.3f} of the canvas (Apple's grid)")
elif fill >= 0.99:
    print(f"[FAIL] bundle: icon artwork fills {fill:.3f} — full-bleed and off the macOS grid, it reads oversized")
else:
    print(f"[FAIL] bundle: icon artwork fills {fill:.3f} — not on Apple's 0.875 grid (run scripts/make-icon.sh)")
    sys.exit(1)
PY
else
  bad "bundle: build/icon.icns is missing"
fi

# ── [2b] theme plugin ────────────────────────────────────────────────────────
#
# The theme plugin has no exclusive seat to contest, so it cannot fail the way
# the brand does. It fails differently, and more quietly: its client bundle is
# executed inside the web shell's module table, so a require() target that the
# shell does not provide throws at materialization and the whole plugin
# disappears — themes silently absent from the picker, no error on screen. That
# is exactly what `@deepseek-ai/dsh-client-runtime/client` did (it was removed
# from the shell in DSH Desktop 2.0.4; defineStore now lives in
# `@deepseek-ai/dsh-client-store`). So the gate reads the seed table the shell
# actually exposes and refuses any require() outside it.
THEME=dsh-eva-theme
THEME_DEST="$HARNESS/node_modules/@muen/$THEME"

if [ -f "plugins/$THEME/package.json" ]; then
  ok "source: plugins/$THEME exists"
  grep -q "for pkg in .*$THEME" scripts/prepare-harness.sh \
    && ok "source: prepare-harness.sh vendors $THEME" \
    || bad "source: prepare-harness.sh does not vendor $THEME — the built app would not carry it"
  grep -q "'@muen/$THEME'" src/main/harness.ts \
    && ok "source: SHIPPED_PLUGINS composes @muen/$THEME" \
    || bad "source: @muen/$THEME is not in SHIPPED_PLUGINS — present on disk is not mounted"
  grep -q "id: $THEME" "plugins/$THEME/cordis.patch.yml" \
    && ok "source: patch inserts the loader row" \
    || bad "source: plugins/$THEME/cordis.patch.yml does not insert the row"
  [ -f "plugins/$THEME/themes/eva-01.json" ] && [ -f "plugins/$THEME/themes/eva-00.json" ] \
    && ok "source: both EVA token tables are generated" \
    || bad "source: themes/eva-0{0,1}.json missing — run node scripts/gen-themes.mjs"
else
  bad "source: plugins/$THEME is missing — the app ships no EVA theme"
fi

if [ -f "$THEME_DEST/lib/client.js" ]; then
  ok "bundle: @muen/$THEME is vendored into the shipped tree"
  # The seed module table lives in the SHELL's frontend bundle, not in the plugin
  # (the plugin is a consumer of it). Reading both from the plugin's own file is
  # the mistake this gate was written to catch, so it reads each from its own
  # source: table from the frontend dist, requires from the plugin bundle.
  #
  # The table is in ONE of the dist's chunks under a build-time hashed name, so
  # every chunk is passed and the script picks the one carrying it. It is keyed
  # on the literal `function ...(){return{react:` rather than any
  # `(){return{...}}` shape, because the minified bundles contain many unrelated
  # small returns of that shape and an unanchored pattern matched one of those
  # (measured: `definitions:new Map,footnotes:new Map`).
  FRONTEND=$(ls "$HARNESS"/node_modules/@deepseek-ai/dsh-web-frontend/dist/assets/*.js 2>/dev/null || true)
  if [ -z "$FRONTEND" ]; then
    skip "bundle: no frontend dist to read the seed module table from"
  elif node --input-type=module -e '
    import { readFileSync } from "node:fs"
    const plugin = readFileSync(process.argv[1], "utf8")
    const chunks = process.argv.slice(2)
    let table = null
    for (const chunk of chunks) {
      const found = readFileSync(chunk, "utf8")
        .match(/function [A-Za-z_$][\w$]*\(\)\{return\{react:([^}]*)\}\}/)?.[1]
      if (found !== undefined) { table = found; break }
    }
    if (table === null) { console.error("could not locate the seed module table in any frontend chunk"); process.exit(2) }
    // `react` is the first key and sits before the first quoted key, so it is
    // read off the anchor rather than lost to the quoted-key scan.
    const words = new Set(["react", ...[...table.matchAll(/"([^"]+)":/g)].map((m) => m[1])])
    const requires = [...new Set([...plugin.matchAll(/require\("([^"]+)"\)/g)].map((m) => m[1]))]
    const missing = requires.filter((r) => !words.has(r))
    if (missing.length > 0) {
      console.error(`require() outside the seed table: ${missing.join(", ")} (table: ${[...words].join(", ")})`)
      process.exit(1)
    }
    console.log(`${requires.length} require(s) all provided by the shell`)
  ' "$THEME_DEST/lib/client.js" $FRONTEND; then
    ok "bundle: $THEME requires only the shell's seed-table modules"
  else
    bad "bundle: $THEME requires a module the shell does not provide — the plugin would vanish silently"
  fi
  # The bundle must register the package name, not a bare id: client-modules
  # keys its boot rows by the loader entry's package name and verifies the
  # bundle registers exactly that.
  grep -q "id: \"@muen/$THEME\"" "$THEME_DEST/lib/client.js" \
    && ok "bundle: registers id \"@muen/$THEME\" (matches the loader entry)" \
    || bad "bundle: registers the wrong id — the boot graph would not match the row"
  # Both skins must survive the copy, and the light one must really be light.
  if node --input-type=module -e '
    import { readFileSync } from "node:fs"
    const src = readFileSync(process.argv[1], "utf8")
    const m = src.match(/const SKINS = (\[[\s\S]*?\]);\n/)
    if (!m) { console.error("no SKINS in the bundle"); process.exit(1) }
    const skins = JSON.parse(m[1])
    const ids = skins.map((s) => s.id).sort().join(",")
    if (ids !== "eva-00,eva-01") { console.error(`skins are ${ids}`); process.exit(1) }
    const dark = skins.find((s) => s.id === "eva-01")
    const light = skins.find((s) => s.id === "eva-00")
    if (dark.colorScheme !== "dark" || light.colorScheme !== "light") { console.error("schemes wrong"); process.exit(1) }
    if (Object.keys(dark.tokens).length !== Object.keys(light.tokens).length) { console.error("token sets differ"); process.exit(1) }
    console.log(`${ids}: ${Object.keys(dark.tokens).length} tokens each`)
  ' "$THEME_DEST/lib/client.js" >/dev/null 2>&1; then
    ok "bundle: EVA 01 (dark) + EVA 00 (light) present with matching token sets"
  else
    bad "bundle: the two EVA skins are missing, mis-schemed, or lopsided"
  fi
else
  bad "bundle: @muen/$THEME is NOT vendored — the shipped app would have no EVA theme"
fi

# ── [3] render ───────────────────────────────────────────────────────────────

if [ -f "$HARNESS/node_modules/@deepseek-ai/dsh/lib/bin.js" ] && [ -x ./node_modules/.bin/electron ]; then
  bash scripts/brand-probe.sh || status=1
else
  skip "render: no harness tree or electron — run pnpm harness (the seat occupant cannot be read back)"
fi

if [ "$status" -eq 0 ]; then
  echo "verify:surfaces — the app wears our brand"
else
  echo "verify:surfaces — FAILED; a surface still wears someone else's"
fi
exit "$status"
