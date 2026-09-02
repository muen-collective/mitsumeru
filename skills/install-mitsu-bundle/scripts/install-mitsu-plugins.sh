#!/usr/bin/env bash
# install-mitsu-plugins.sh — install the curated Mitsu plugin bundle into a DSH profile
# via the standard DSH mechanism (dsh plugin add / Settings -> Plugins).
#
# Why: NOT a fixed bundled set. This script stands up the curated @muen/mitsu-* set once,
# on demand, so each plugin is a normal market plugin — installable, updatable, and removable
# (a removed plugin does NOT come back on restart, because nothing re-seeds it on boot).
#
# Usage:
#   bash install-mitsu-plugins.sh --profile <name> [--dry-run]
#   MITSU_PLUGIN_SOURCE=@muen bash install-mitsu-plugins.sh --profile <name>
set -euo pipefail

PROFILE="web"
DRY_RUN=0
# Source for each plugin. Default @muen/<pkg> (npm). Unset -> fall back to the fork.
# MITSU_PLUGIN_SOURCE can be a prefix (e.g. @muen) or a github: URL template.
MITSU_PLUGIN_SOURCE="${MITSU_PLUGIN_SOURCE:-@muen}"

while [ $# -gt 0 ]; do
  case "$1" in
    --profile) PROFILE="$2"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    *) echo "unknown arg: $1"; exit 1 ;;
  esac
done

# The curated Mitsu plugin bundle — edit this to curate. Order doesn't matter.
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

# Resolve the install target for one plugin.
resolve() {
  local name="$1"
  case "$MITSU_PLUGIN_SOURCE" in
    @*) echo "${MITSU_PLUGIN_SOURCE}/${name}" ;;
    github:*) echo "${MITSU_PLUGIN_SOURCE/PLUGIN/$name}" ;;
    *) echo "${MITSU_PLUGIN_SOURCE}/${name}" ;;
  esac
}

echo "== Mitsu plugin bundle -> profile '$PROFILE' =="
echo "  source: ${MITSU_PLUGIN_SOURCE} (default @muen; set MITSU_PLUGIN_SOURCE to override)"
for name in "${BUNDLE[@]}"; do
  pkg="$(resolve "$name")"
  if [ "$DRY_RUN" = "1" ]; then
    echo "  [dry-run] dsh plugin --profile $PROFILE add $pkg"
    continue
  fi
  # Skip if already installed (the profile manifest is the source of truth).
  if dsh plugin --profile "$PROFILE" list 2>/dev/null | grep -q "${name}"; then
    echo "  ✓ already installed: ${name}"
    continue
  fi
  echo "  + installing: ${pkg}"
  dsh plugin --profile "$PROFILE" add "$pkg" || echo "  ✗ failed: ${pkg} (check source / publish state)"
done

echo
echo "== restart the harness/profile to compose the new bundles (startup-only). =="
echo "  profile: $PROFILE"
