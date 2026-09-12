#!/usr/bin/env bash
# Regenerate build/icon.icns from the authored artwork (Epic 86 P9, fixed 2026-09-11).
#
# Why this is a script and not a hand-made binary: build/icon.icns was committed
# as bytes with nothing recording how it was produced, so the only way to change
# the icon was to make a new one by hand. The next edit would have been another
# un-reproducible binary, and a mismatch between the artwork and the shipped
# icon could only be found by looking at the Dock — which is exactly how the
# sizing bug below survived a release.
#
# The bug this fixes: the shipped icon put the artwork on Apple's body grid
# (824 of 1024, fill 0.805) but the app people were coming from — Mitsumeru Dev
# from the old fork — was full-bleed (1024 of 1024, fill 1.000). Same artwork,
# ~24% smaller on the Dock, which reads as "the new app's icon is the wrong
# size". Measured fill of the icons macOS itself ships, for the target:
#
#   Safari / Music / Notes / Calculator / Maps  0.875 at 256 (Apple's grid)
#   Visual Studio Code / Chrome                 0.867 / 0.859 (Electron apps)
#   Mitsumeru Dev (old fork)                    1.000 (not on the grid)
#
# So the target is 0.875 — Apple's own grid — and the old full-bleed icon is the
# outlier, not the reference. To match the old fork exactly instead, change FILL
# to 1.0; that is the entire difference.
#
# Requires: Pillow (`python3 -m pip install pillow`) and Xcode's iconutil/sips.
# The generated build/icon.icns is committed, so a normal build needs neither.
set -euo pipefail
cd "$(dirname "$0")/.." # packages/mitsumeru

SRC=build/icon-1024.png
OUT=build/icon.icns
ICONSET=build/icon.iconset
# Artwork extent as a fraction of the icon canvas — see the measurement above.
FILL=0.875

[ -f "$SRC" ] || { echo "[FAIL] $SRC missing — it is the authored source artwork"; exit 1; }

rm -rf "$ICONSET"
python3 - "$SRC" "$ICONSET" "$FILL" <<'PY'
import os, sys
from PIL import Image

src, iconset, fill = sys.argv[1], sys.argv[2], float(sys.argv[3])
os.makedirs(iconset, exist_ok=True)

art = Image.open(src).convert("RGBA")
bbox = art.split()[3].getbbox()
if bbox is None:
    raise SystemExit(f"[FAIL] {src} is fully transparent")
art = art.crop(bbox)  # the artwork alone, no inherited padding

# (filename, pixel size) — the ten representations iconutil expects.
reps = [
    ("icon_16x16.png", 16), ("icon_16x16@2x.png", 32),
    ("icon_32x32.png", 32), ("icon_32x32@2x.png", 64),
    ("icon_128x128.png", 128), ("icon_128x128@2x.png", 256),
    ("icon_256x256.png", 256), ("icon_256x256@2x.png", 512),
    ("icon_512x512.png", 512), ("icon_512x512@2x.png", 1024),
]

for name, size in reps:
    # 16/32 px are rendered full-bleed: at that size the inset costs legibility,
    # and Apple's own 16x16 rep measures a 1.0 fill for the same reason.
    inset = 1.0 if size <= 32 else fill
    target = max(1, round(size * inset))
    scaled = art.resize((target, target), Image.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    off = (size - target) // 2
    canvas.paste(scaled, (off, off), scaled)
    canvas.save(os.path.join(iconset, name))
    print(f"  {name:24s} {size:5d}px  art {target}px  fill {target / size:.3f}")

# Report what the largest rep actually carries, so the number in the comment
# above and the bytes on disk cannot drift apart silently.
big = Image.open(os.path.join(iconset, "icon_512x512@2x.png")).convert("RGBA")
b = big.split()[3].getbbox()
print(f"  verified: 1024 rep art {b[2] - b[0]}px, fill {(b[2] - b[0]) / big.width:.3f}")
PY

iconutil -c icns "$ICONSET" -o "$OUT"
sips -g pixelWidth -g pixelHeight "$OUT" >/dev/null
echo "icon: $OUT regenerated from $SRC (fill $FILL)"
