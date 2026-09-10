#!/usr/bin/env bash
# Build the harness resource the packaged app spawns.
#
# Ship shape: `Resources/harness/node_modules/**` — a flat, self-contained,
# symlink-free node_modules tree.
#   - pnpm's workspace layout is a symlink farm (deps are siblings in the
#     virtual store), and electron-builder copies resources as plain files, so
#     the tree is materialized with the hoisted linker instead of copied.
#   - the harness is executed by node as a child process, so nothing about it
#     may live inside an asar archive (asar: false in electron-builder.yml).
#
# The staged install pins the same release the dev smoke signs off on, and the
# result is checked back against the closure this workspace already resolved —
# a fresh resolution that drifts is a failure, not a surprise in the field.
set -euo pipefail
cd "$(dirname "$0")/.." # packages/mitsumeru

OUT=build/harness
# The stage must live OUTSIDE the workspace: pnpm run from anywhere inside a
# workspace member operates on the whole workspace, and a `--prod` install
# there strips this package's own devDependencies. Off to the side it sees a
# single plain project.
STAGE=${TMPDIR:-/tmp}/mitsumeru-harness-stage
STORE=$(pnpm store path)
VERSION=$(node -p "require('./package.json').dependencies['@deepseek-ai/dsh']")

rm -rf "$OUT" "$STAGE"
mkdir -p "$STAGE"
cat >"$STAGE/package.json" <<JSON
{
  "name": "mitsumeru-harness-resource",
  "private": true,
  "description": "Throwaway manifest for the packaged harness tree. Not published.",
  "dependencies": { "@deepseek-ai/dsh": "$VERSION" }
}
JSON

# ignore-scripts: the harness's native addons (node-pty, koffi) are denied in
# pnpm-workspace.yaml and the stock web profile boots without them.
(cd "$STAGE" && pnpm install --prod \
  --config.node-linker=hoisted \
  --config.ignore-scripts=true \
  --config.store-dir="$STORE" \
  --config.confirm-modules-purge=false \
  --reporter=append-only)

mkdir -p "$OUT"
cp "$STAGE/package.json" "$OUT/package.json"
cp -R "$STAGE/node_modules" "$OUT/node_modules"
rm -rf "$OUT/node_modules/.bin" "$STAGE"

links=$(find "$OUT" -type l | wc -l | tr -d ' ')
files=$(find "$OUT" -type f | wc -l | tr -d ' ')
echo "harness resource: $OUT — @deepseek-ai/dsh@$VERSION, $files files, $links symlinks"
[ "$links" = '0' ] || { echo "[FAIL] symlinks in the resource tree"; exit 1; }
[ -f "$OUT/node_modules/@deepseek-ai/dsh/lib/bin.js" ] || { echo "[FAIL] harness entry missing"; exit 1; }

# Closure identity: every @deepseek-ai/dsh* package the workspace store pins
# must appear at the same version, and nothing else may sneak in.
node --input-type=module -e '
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

const store = "../../node_modules/.pnpm"
const expected = new Set()
for (const dir of readdirSync(store)) {
  if (!dir.startsWith("@deepseek-ai+")) continue
  // Store dir names are `@scope+name@version` plus an optional `_<peer set>`
  // suffix, so the version starts at the first `@` after the scope marker.
  const at = dir.indexOf("@", 1)
  expected.add(`${dir.slice(0, at).replace("+", "/")}@${dir.slice(at + 1).split("_")[0]}`)
}

const scopeDir = "build/harness/node_modules/@deepseek-ai"
const actual = new Set()
for (const dir of readdirSync(scopeDir)) {
  const manifest = JSON.parse(readFileSync(join(scopeDir, dir, "package.json"), "utf8"))
  actual.add(`${manifest.name}@${manifest.version}`)
}

const missing = [...expected].filter((p) => !actual.has(p))
const extra = [...actual].filter((p) => !expected.has(p))
console.log(`closure: ${actual.size} @deepseek-ai/* packages (workspace pins ${expected.size})`)
if (missing.length > 0 || extra.length > 0) {
  console.error("missing:", missing)
  console.error("unexpected:", extra)
  process.exit(1)
}
'
