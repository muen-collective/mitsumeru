#!/bin/bash
#
# Exercises support/uninstall-old-mitsumeru.command in a sandbox.
#
# WHY: that script deletes things. Reading it is not evidence that it deletes
# the RIGHT things — specifically that it takes the old app's data and leaves
# the new app's data alone. This builds a fake machine with both apps' paths,
# runs the real script against it, and asserts the outcome.
#
#   bash support/test-uninstall-old-mitsumeru.sh
#
# Uses APPS/TEST_HOME to redirect the script at the sandbox. Those exist only
# for this file; normal runs never set them.

set -u
SCRIPT="$(cd "$(dirname "$0")" && pwd)/uninstall-old-mitsumeru.command"
[ -f "$SCRIPT" ] || { echo "cannot find $SCRIPT"; exit 2; }

pass=0; fail=0
ok()  { echo "  [PASS] $1"; pass=$((pass+1)); }
bad() { echo "  [FAIL] $1"; fail=$((fail+1)); }

# ── build a fake machine ─────────────────────────────────────────────────────

make_sandbox() {
  SB="$(mktemp -d "${TMPDIR:-/tmp}/mitu-uninstall-test-XXXXXX")"
  APPS="$SB/Applications"; HOMED="$SB/home"
  mkdir -p "$APPS" "$HOMED/Library/Application Support" \
           "$HOMED/Library/Preferences" "$HOMED/Library/Logs" \
           "$HOMED/Library/Caches" "$HOMED/Library/Saved Application State" \
           "$HOMED/Library/HTTPStorages" "$HOMED/Library/WebKit" \
           "$HOMED/Library/Application Support/CrashReporter"

  mkapp() { # mkapp <path> <bundle-id> <version>
    local p="$1" id="$2" ver="$3"
    mkdir -p "$p/Contents/MacOS"
    cat > "$p/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleIdentifier</key><string>$id</string>
  <key>CFBundleShortVersionString</key><string>$ver</string>
  <key>CFBundleName</key><string>$(basename "$p" .app)</string>
</dict></plist>
PLIST
  }

  # the old app + everything it leaves behind
  mkapp "$APPS/Mitsumeru Dev.app" "io.muen.mitsumeru-dev" "0.0.3-dev"
  mkdir -p "$HOMED/Library/Application Support/dsh-desktop-dev/harness"   # 882MB in reality
  head -c 4096 /dev/zero > "$HOMED/Library/Application Support/dsh-desktop-dev/harness/blob"
  mkdir -p "$HOMED/Library/Application Support/mitsumeru-electron"
  echo "<plist/>" > "$HOMED/Library/Preferences/io.muen.mitsumeru-dev.plist"
  echo "<plist/>" > "$HOMED/Library/Preferences/io.muen.mitsumeru-dev.helper.plist"
  mkdir -p "$HOMED/Library/Logs/Mitsumeru Dev"
  head -c 512 /dev/zero > "$HOMED/Library/Logs/Mitsumeru Dev/harness.log"

  # the NEW app + its data — must survive
  mkapp "$APPS/Mitsumeru.app" "com.muen.mitsumeru" "0.1.8-dev"
  mkdir -p "$HOMED/Library/Application Support/Mitsumeru/mitsu-dsh/profiles/mitsu"
  echo '{"keep":"this — the new app profile"}' \
    > "$HOMED/Library/Application Support/Mitsumeru/mitsu-dsh/profiles/mitsu/package.json"
  mkdir -p "$HOMED/Library/Preferences"
  echo "<plist/>" > "$HOMED/Library/Preferences/com.muen.mitsumeru.plist"   # new app pref
}

rm_sandbox() { [ -n "${SB:-}" ] && rm -rf "$SB"; }
trap rm_sandbox EXIT

run() { APPS="$APPS" TEST_HOME="$HOMED" DRY_RUN="${1:-0}" bash "$SCRIPT" </dev/null 2>&1; }

# ── 1. dry run touches nothing ───────────────────────────────────────────────

echo "test: dry run removes nothing"
make_sandbox
out="$(run 1)"
[ -d "$APPS/Mitsumeru Dev.app" ] \
  && ok "old app still present after DRY_RUN" \
  || bad "DRY_RUN removed the old app"
[ -f "$HOMED/Library/Application Support/dsh-desktop-dev/harness/blob" ] \
  && ok "old data still present after DRY_RUN" \
  || bad "DRY_RUN removed old data"
case "$out" in *"DRY RUN"*) ok "dry run says so" ;; *) bad "dry run did not announce itself" ;; esac
rm_sandbox

# ── 2. the real run: old goes, new stays ─────────────────────────────────────

echo
echo "test: real run removes the old app and spares the new one"
make_sandbox
out="$(run 0)"
echo "$out" | sed 's/^/      | /'

[ ! -e "$APPS/Mitsumeru Dev.app" ] \
  && ok "old app removed" || bad "old app NOT removed"
[ ! -e "$HOMED/Library/Application Support/dsh-desktop-dev" ] \
  && ok "old app's data dir removed (dsh-desktop-dev)" || bad "old data dir NOT removed"
[ ! -e "$HOMED/Library/Application Support/mitsumeru-electron" ] \
  && ok "stale mitsumeru-electron removed" || bad "mitsumeru-electron NOT removed"
[ ! -e "$HOMED/Library/Preferences/io.muen.mitsumeru-dev.plist" ] \
  && ok "old preferences removed" || bad "old preferences NOT removed"
[ ! -e "$HOMED/Library/Logs/Mitsumeru Dev" ] \
  && ok "old logs removed" || bad "old logs NOT removed"

echo "  --- the things that must survive ---"
[ -d "$APPS/Mitsumeru.app" ] \
  && ok "NEW app still installed" || bad "NEW app was DELETED"
[ "$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$APPS/Mitsumeru.app/Contents/Info.plist" 2>/dev/null)" = "com.muen.mitsumeru" ] \
  && ok "NEW app still has its own identity" || bad "NEW app identity changed"
[ -f "$HOMED/Library/Application Support/Mitsumeru/mitsu-dsh/profiles/mitsu/package.json" ] \
  && ok "NEW app's profile SURVIVED" || bad "NEW app's profile was DELETED"
[ -f "$HOMED/Library/Preferences/com.muen.mitsumeru.plist" ] \
  && ok "NEW app's preferences SURVIVED" || bad "NEW app's preferences were DELETED"
case "$out" in *"intact"*) ok "script reports the new app intact" ;; *) bad "no intact confirmation" ;; esac
rm_sandbox

# ── 3. idempotent ────────────────────────────────────────────────────────────

echo
echo "test: running it twice is safe"
make_sandbox
run 0 >/dev/null
out2="$(run 0)"
case "$out2" in
  *"already gone"*) ok "second run reports nothing to remove" ;;
  *) bad "second run did not report a clean state" ;;
esac
rm_sandbox

# ── 4. the guard: refuse if the new app carries the old identity ─────────────

echo
echo "test: refuses to run if the new app has the OLD app's identity"
make_sandbox
# corrupt the new app's identity to the old one
cat > "$APPS/Mitsumeru.app/Contents/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleIdentifier</key><string>io.muen.mitsumeru-dev</string>
</dict></plist>
PLIST
out3="$(run 0)"
case "$out3" in
  *"STOP"*) ok "stopped as designed" ;;
  *) bad "did not stop on confused identity" ;;
esac
[ -d "$APPS/Mitsumeru Dev.app" ] \
  && ok "removed nothing when it stopped" || bad "removed files despite stopping"
rm_sandbox

# ── 5. nothing installed at all ──────────────────────────────────────────────

echo
echo "test: clean machine, nothing to do"
make_sandbox
rm -rf "$APPS/Mitsumeru Dev.app" "$HOMED/Library/Application Support/dsh-desktop-dev" \
       "$HOMED/Library/Application Support/mitsumeru-electron" \
       "$HOMED/Library/Logs/Mitsumeru Dev" \
       "$HOMED/Library/Preferences/io.muen.mitsumeru-dev.plist" \
       "$HOMED/Library/Preferences/io.muen.mitsumeru-dev.helper.plist"
out4="$(run 0)"
case "$out4" in
  *"already gone"*) ok "reports nothing to remove" ;;
  *) bad "did not handle the clean case" ;;
esac
[ -d "$APPS/Mitsumeru.app" ] && ok "left the new app alone" || bad "touched the new app"
rm_sandbox

# ── summary ──────────────────────────────────────────────────────────────────

echo
if [ "$fail" -eq 0 ]; then
  echo "  $pass passed, $fail failed"
else
  echo "  $pass passed, $fail FAILED"
fi
exit $([ "$fail" -eq 0 ] && echo 0 || echo 1)
