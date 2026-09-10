#!/usr/bin/env bash
# Identity guard (Epic 86 § Naming).
#
# The shell's identity lives in one module — src/shared/identity.ts — because a
# rename (asuka → mitsumeru) must stay a one-file change. Two copies cannot
# import TypeScript: the package manifest and the builder config. This check
# keeps those copies equal to the module, so a half-finished rename fails the
# build instead of shipping an app that wears two names.
set -euo pipefail
cd "$(dirname "$0")/.." # packages/asuka

node --input-type=module -e '
import { readFileSync } from "node:fs"

const identity = readFileSync("src/shared/identity.ts", "utf8")
const pick = (key) => new RegExp(`${key} = .([^\\x27]+).`).exec(identity)?.[1]

const builder = readFileSync("electron-builder.yml", "utf8")
const manifest = JSON.parse(readFileSync("package.json", "utf8"))

const checks = [
  ["electron-builder.yml appId", /^appId: (.+)$/m.exec(builder)?.[1], pick("APP_ID")],
  ["electron-builder.yml productName", /^productName: (.+)$/m.exec(builder)?.[1], pick("PRODUCT_NAME")],
  ["package.json productName", manifest.productName, pick("PRODUCT_NAME")],
  ["package.json name", manifest.name, pick("APP_NAME")]
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
'
