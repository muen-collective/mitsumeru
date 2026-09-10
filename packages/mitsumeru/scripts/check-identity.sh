#!/usr/bin/env bash
# Identity guard (Epic 86 § Naming).
#
# The shell's identity lives in one module — src/shared/identity.ts — because a
# rename (mitsumeru → mitsumeru) must stay a one-file change. Two copies cannot
# import TypeScript: the package manifest and the builder config. This check
# keeps those copies equal to the module, so a half-finished rename fails the
# build instead of shipping an app that wears two names.
set -euo pipefail
cd "$(dirname "$0")/.." # packages/mitsumeru

node --input-type=module -e '
import { readFileSync } from "node:fs"

const identity = readFileSync("src/shared/identity.ts", "utf8")
const pick = (key) => new RegExp(`${key} = .([^\\x27]+).`).exec(identity)?.[1]

const builder = readFileSync("electron-builder.yml", "utf8")
// The feed is GitHub Releases: there is no `url` in the builder config any more,
// so the check compares the coordinates the client resolves through instead.
//
// `-?` is not cosmetic: `publish` is a list, so the provider is written as
// `  - provider: github` while owner/repo are plain indented keys. Without the
// dash this check read `undefined` and failed a correct config (measured — the
// first run of the switch).
const feedProvider = /^\s*-?\s*provider: (.+)$/m.exec(builder)?.[1]
const manifest = JSON.parse(readFileSync("package.json", "utf8"))
// The splash screen is a plain HTML file, so it cannot import the module. It is
// user-visible (it is the window title while the harness boots), which is
// exactly how the pilot codename once shipped inside the packaged app.
const renderer = readFileSync("src/renderer/index.html", "utf8")

const checks = [
  ["electron-builder.yml appId", /^appId: (.+)$/m.exec(builder)?.[1], pick("APP_ID")],
  ["electron-builder.yml productName", /^productName: (.+)$/m.exec(builder)?.[1], pick("PRODUCT_NAME")],
  ["electron-builder.yml publish.provider", feedProvider, "github"],
  ["electron-builder.yml publish.owner", /^\s+owner: (.+)$/m.exec(builder)?.[1], pick("UPDATE_OWNER")],
  ["electron-builder.yml publish.repo", /^\s+repo: (.+)$/m.exec(builder)?.[1], pick("UPDATE_REPO")],
  ["package.json productName", manifest.productName, pick("PRODUCT_NAME")],
  ["package.json name", manifest.name, pick("APP_NAME")],
  ["src/renderer/index.html <title>", /<title>([^<]+)<\/title>/.exec(renderer)?.[1]?.trim(), pick("PRODUCT_NAME")]
]

let failed = 0
for (const [what, actual, expected] of checks) {
  if (actual !== expected) {
    console.error(`[FAIL] ${what} = ${actual} — expected ${expected} (src/shared/identity.ts)`)
    failed++
  }
}
if (failed > 0) process.exit(1)
console.log(`identity: single source confirmed — ${pick("APP_ID")} / ${pick("PRODUCT_NAME")} / ${pick("APP_NAME")}`)
console.log(`identity: update feed — github.com/${pick("UPDATE_OWNER")}/${pick("UPDATE_REPO")} releases (tag carries the channel: v<version>)`)
'

# The feed must never be somebody else's: the whole point of wrapping a release
# ourselves is that an upstream feed cannot replace this shell (Epic 86 §
# Independence — dshdesktop.com is the feed DSH Desktop uses).
#
# Matched as a URL, not as a word: the rule being guarded is "no upstream feed
# is configured", and these files are allowed to say the name while explaining
# that. A bare grep would fail on this very comment.
if grep -nEi '[a-z]+://[a-z0-9.-]*dshdesktop\.com' electron-builder.yml src/shared/identity.ts src/main/updater.ts; then
  echo "[FAIL] an upstream (dshdesktop.com) feed URL is configured"
  exit 1
fi
echo "identity: no upstream feed inherited"

# The pilot's codename must not reach a user. It reached one exactly once: the
# splash screen still said `wrap-pilot` (and described the harness internals) in
# the packaged app, because the renderer is a static file no check looked at.
if grep -rn 'wrap-pilot' src/ ; then
  echo "[FAIL] the pilot codename 'wrap-pilot' is still in src/ — it ships in the app"
  exit 1
fi
echo "identity: no pilot codename in src/"
