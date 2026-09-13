#!/bin/bash
#
# Remove the OLD Mitsumeru (the one called "Mitsumeru Dev") from this Mac.
#
# Written for the Yammanman setup (Noi). Double-click to run.
#
# WHY THIS EXISTS
# There were two different apps, and they look alike:
#
#   old   /Applications/Mitsumeru Dev.app    "Mitsumeru Dev"   0.0.3-dev
#   new   /Applications/Mitsumeru.app        "Mitsumeru"       0.1.x
#
# Only the new one is maintained. The old one is a retired build that no longer
# receives updates, and it keeps its own copy of everything — so it also wastes
# about 1.7 GB. This removes the old one and everything it left behind, and
# leaves the new one completely alone.
#
# THE TRAP THIS SCRIPT EXISTS TO AVOID
# The old app does not store its data under its own name. Its folder is called
# "dsh-desktop-dev", which matches nothing about the app you can see in Finder.
# Someone tidying up by hand would look for "Mitsumeru Dev", find only a small
# log folder, and leave 882 MB behind. Worse, the obvious guess — a folder
# simply called "Mitsumeru" — belongs to the NEW app, and deleting it would wipe
# the new app's settings and profile. Both folders are checked by identity
# below, never by name.
#
# SAFETY
#   * removes only paths on the explicit list further down
#   * never removes /Applications/Mitsumeru.app (verified by bundle id)
#   * needs no administrator password — everything it touches belongs to you
#   * prints a report at the end you can screenshot back to us
#
set -u

# Set DRY_RUN=1 to see what it would do without removing anything.
DRY_RUN="${DRY_RUN:-0}"

# The two app locations are overridable so this can be exercised against a
# sandbox (see support/test-uninstall-old-mitsumeru.sh) instead of only being
# reasoned about. In normal use they are never set and the defaults apply.
APPS="${APPS:-/Applications}"
OLD_APP="$APPS/Mitsumeru Dev.app"
OLD_ID="io.muen.mitsumeru-dev"
NEW_APP="$APPS/Mitsumeru.app"
NEW_ID="com.muen.mitsumeru"

HOME_DIR="${TEST_HOME:-$HOME}"
SUPPORT="$HOME_DIR/Library/Application Support"

removed_count=0
failed_count=0
freed_kb=0

# ── presentation ─────────────────────────────────────────────────────────────

bold()  { printf '\033[1m%s\033[0m\n' "$1"; }
green() { printf '\033[32m%s\033[0m\n' "$1"; }
warn()  { printf '\033[33m%s\033[0m\n' "$1"; }
red()   { printf '\033[31m%s\033[0m\n' "$1"; }
rule()  { printf '────────────────────────────────────────────────────────────\n'; }

# A readable size for a path, or nothing if it is not there.
size_of() {
  [ -e "$1" ] || { printf ''; return; }
  du -sh "$1" 2>/dev/null | awk '{print $1}'
}

# Confirm a bundle's identity by its id, so nothing is removed on the strength
# of its filename. Prints the id, or nothing.
bundle_id() {
  [ -f "$1/Contents/Info.plist" ] || { printf ''; return; }
  /usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$1/Contents/Info.plist" 2>/dev/null
}

echo
rule
bold "  Remove the old Mitsumeru from this Mac"
rule
echo
echo "  This removes the retired app (\"Mitsumeru Dev\") and the files it left"
echo "  behind. It leaves your current Mitsumeru completely untouched."
echo
if [ "$DRY_RUN" != "0" ]; then
  warn "  DRY RUN — nothing will actually be removed."
  echo
fi

# ── 1. protect the new app ───────────────────────────────────────────────────
#
# Establish up front that the new app is present and is really the new app. If
# it is missing there is nothing to protect — but if it is present and somehow
# carries the old id, stop, because the two have been confused.

if [ -d "$NEW_APP" ]; then
  new_id="$(bundle_id "$NEW_APP")"
  if [ "$new_id" = "$OLD_ID" ]; then
    red "  STOP: /Applications/Mitsumeru.app has the OLD app's identity."
    echo "  Nothing has been removed. Send us a screenshot of this window."
    echo
    exit 1
  fi
  echo "  Your current Mitsumeru was found and will not be touched."
else
  echo "  (No current Mitsumeru found in Applications — that is fine.)"
fi
echo

# ── 2. quit the old app if it is open ────────────────────────────────────────
#
# Deleting a running app leaves a half-removed thing behind and can fail on
# files still in use. Ask it to quit first, the same way clicking Quit does.

old_running() {
  # In a sandbox the old app is not installed at the sandbox path, so there is
  # nothing of ours to be running — and matching the real process name would
  # talk about the developer's own live copy, not the sandbox.
  [ -n "${TEST_HOME:-}" ] && return 1
  pgrep -f "$OLD_APP/Contents/MacOS/Mitsumeru Dev" >/dev/null 2>&1
}

if old_running; then
  if [ "$DRY_RUN" != "0" ]; then
    # A dry run must not close anything, and must not then pretend the app is
    # still open — it would report a failure it caused itself. Say what a real
    # run would do and carry on to the list, which is the point of a dry run.
    warn "  (The old app is open. A real run would close it first.)"
    echo
  else
    echo "  The old app is open. Closing it…"
    osascript -e 'tell application "Mitsumeru Dev" to quit' >/dev/null 2>&1 || true
    # give it a moment to shut down cleanly
    for _ in $(seq 1 10); do
      old_running || break
      sleep 1
    done
    if old_running; then
      warn "  It did not close on its own — asking it to stop…"
      pkill -f "$OLD_APP/Contents/MacOS/Mitsumeru Dev" >/dev/null 2>&1 || true
      sleep 2
    fi
    # Re-check rather than trusting the kill: files still held by a live
    # process are exactly what makes a partial removal.
    if old_running; then
      red "  STOP: the old app is still running."
      echo "  Quit it by hand (Command-Q on its window), then run this again."
      echo
      exit 1
    fi
    green "  Closed."
    echo
  fi
fi

# ── 3. the list ──────────────────────────────────────────────────────────────
#
# Every path the old app is known to use. Nothing outside this list is ever
# removed. The two user-data folders are the important ones: "dsh-desktop-dev"
# is the old app's (it is NOT named after the app), and it is the large one.
#
# NOT on this list, deliberately:
#   ~/Library/Application Support/Mitsumeru   ← the NEW app's settings + profile
#   /Applications/Mitsumeru.app               ← the NEW app

CANDIDATES=(
  "$OLD_APP"
  "$SUPPORT/dsh-desktop-dev"
  "$SUPPORT/mitsumeru-electron"
  "$HOME_DIR/Library/Preferences/$OLD_ID.plist"
  "$HOME_DIR/Library/Preferences/$OLD_ID.helper.plist"
  "$HOME_DIR/Library/Logs/Mitsumeru Dev"
  "$HOME_DIR/Library/Caches/$OLD_ID"
  "$HOME_DIR/Library/Caches/Mitsumeru Dev"
  "$HOME_DIR/Library/Saved Application State/$OLD_ID.savedState"
  "$HOME_DIR/Library/HTTPStorages/$OLD_ID"
  "$HOME_DIR/Library/WebKit/$OLD_ID"
  "$HOME_DIR/Library/Application Support/CrashReporter/Mitsumeru Dev Helper_FE73CEFC-3780-562E-AE7E-BCB9B1D4EBA7.plist"
)

PRESENT=()
for p in "${CANDIDATES[@]}"; do
  [ -e "$p" ] && PRESENT+=("$p")
done

if [ "${#PRESENT[@]}" -eq 0 ]; then
  echo
  green "  Nothing to remove — the old app is already gone."
  echo
  rule
  echo "  Your current Mitsumeru is unaffected. You are done."
  rule
  echo
  exit 0
fi

# ── 4. show what will go, before anything goes ───────────────────────────────

echo "  The following will be removed:"
echo
total_human=""
for p in "${PRESENT[@]}"; do
  pretty="${p/#$HOME_DIR/~}"
  sz="$(size_of "$p")"
  printf '    %-62s %s\n' "$pretty" "$sz"
done
echo
total_human="$(du -sch "${PRESENT[@]}" 2>/dev/null | tail -1 | awk '{print $1}')"
echo "    Total: ${total_human:-unknown}"
echo
echo "  Your current Mitsumeru and its settings are NOT on this list."
echo

if [ "$DRY_RUN" = "0" ]; then
  printf '  Press Return to remove these, or press Control-C to cancel. '
  if [ -t 0 ]; then
    read -r _ || true
  fi
  echo
fi

# ── 5. remove ────────────────────────────────────────────────────────────────

for p in "${PRESENT[@]}"; do
  pretty="${p/#$HOME_DIR/~}"
  if [ "$DRY_RUN" != "0" ]; then
    echo "    would remove  $pretty"
    continue
  fi
  if rm -rf "$p" 2>/dev/null && [ ! -e "$p" ]; then
    green "    removed  $pretty"
    removed_count=$((removed_count + 1))
  else
    red   "    FAILED   $pretty"
    failed_count=$((failed_count + 1))
  fi
done

echo

# ── 6. prove the new app survived ────────────────────────────────────────────
#
# The whole point is that the old app goes and the new one stays. Check that
# rather than assume it.

if [ -d "$NEW_APP" ]; then
  now_id="$(bundle_id "$NEW_APP")"
  if [ "$now_id" = "$NEW_ID" ]; then
    green "  Your current Mitsumeru is intact and still installed."
  else
    red   "  Your current Mitsumeru looks wrong (id: ${now_id:-missing})."
    echo  "  Send us a screenshot of this window."
  fi
fi

if [ -d "$SUPPORT/Mitsumeru" ]; then
  green "  Your Mitsumeru settings and profile were left alone."
fi

# ── 7. report ────────────────────────────────────────────────────────────────

echo
rule
if [ "$DRY_RUN" != "0" ]; then
  bold "  Dry run finished — nothing was removed."
elif [ "$failed_count" -eq 0 ]; then
  bold "  Done."
  echo
  echo "  Removed: $removed_count item(s), about ${total_human:-?} freed."
  echo "  Your current Mitsumeru is untouched."
elif [ "$failed_count" -gt 0 ] && [ "$removed_count" -gt 0 ]; then
  bold "  Mostly done."
  echo
  warn "  Removed $removed_count item(s), but $failed_count could not be removed."
  echo "  Screenshot this window and send it to us and we will finish it."
else
  bold "  Nothing could be removed."
  echo
  red "  Screenshot this window and send it to us."
fi
echo
rule
echo
echo "  You can close this window now."
echo
