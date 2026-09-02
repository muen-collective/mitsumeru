#!/usr/bin/env bash
# publish-mitsu-plugins.sh — publish the @muen/mitsu-* plugins to npm (public) so
# `dsh plugin add @muen/<pkg>` works (the install-mitsu-bundle prompt-install path).
#
# PREREQ:
#   1. npm login   (this machine must be authenticated)
#   2. Claim the @muen scope on npm (a user/org you own) — otherwise publish is
#      rejected with E404 / EINVALIDPACKAGENAME.
#
# Usage:
#   bash scripts/publish-mitsu-plugins.sh            # publish all
#   bash scripts/publish-mitsu-plugins.sh --dry-run  # show what would publish
#   MITSU_PLUGIN=@muen/mitsu-open-in-sidebar bash scripts/publish-mitsu-plugins.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DRY=0
for a in "$@"; do [ "$a" = "--dry-run" ] && DRY=1; done

# The curated set to publish (matches install-mitsu-bundle). Edit to curate.
BUNDLE=(
  mitsu-brand
  mitsu-assets
  mitsu-browser
  mitsu-modes
  mitsu-rail
  mitsu-settings
  mitsu-starter-pack
  mitsu-krea
  mitsu-runninghub
  mitsu-sidebar-tree
  mitsu-task-switcher
  mitsu-open-in-sidebar
)

echo "== publishing @muen/mitsu-* plugins =="
for name in "${BUNDLE[@]}"; do
  d="$ROOT/plugins/$name"
  [ -f "$d/package.json" ] || { echo "  - skip (no package.json): $name"; continue; }
  pkg="@muen/$name"
  echo "== $pkg =="
  if [ "$DRY" = "1" ]; then echo "    (dry) cd plugins/$name && npm publish --access public"; continue; fi
  ( cd "$d" && npm publish --access public ) || { echo "  ✗ FAILED: $pkg"; exit 1; }
done
echo
echo "done. Next: add each to the awesome-dsh-plugin registry (plugins.json) so dshmarket lists it."
