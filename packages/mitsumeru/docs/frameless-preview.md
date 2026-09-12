# Frameless window prototype

**What this is:** a way to look at Mitsumeru with no title bar — the Figma/Discord
shape — where the app's own top strip becomes the thing you drag to move the
window. It is a **prototype**. The app itself is unchanged.

## Run it

Open a terminal and paste this:

```bash
cd /Users/thuypham/mitsumeru/packages/mitsumeru
pnpm theme:preview --frameless
```

A window opens after ~15 seconds. It has **no title bar**, and the top of it is
outlined to show you where you can grab.

### What you should see and try

1. **Drag the pink dashed area** at the very top. The window should move.
2. **Click a session tab** (outlined blue). It should switch sessions, not drag.
3. **Open Settings** (bottom of the sidebar) and switch between **EVA 01** and
   **EVA 00**. The strip follows the app colour — that is the point, because the
   stock title bar follows the *operating system* appearance instead.
4. **Press Ctrl-C in the terminal** to close it.

### Seeing it without the outlines

```
pnpm theme:preview --frameless --no-outline
```

Same window, no pink/blue debug lines. This is the version to judge on looks.

### If you don't want the frameless version

```bash
pnpm theme:preview
```
(same as above — the plain command is the normal-window version.)

```bash
pnpm theme:preview --shot
```
Screenshots both themes to `artifacts/theme-preview/`, then exits.

**Copy a line whole.** Do not include the `#` explanation if you copy from
anywhere — a shell only treats `#` as a comment when it starts a word, so a
pasted explanation arrives as arguments. Unknown arguments are now ignored with
a warning rather than being fatal, and `pnpm theme:preview --help` lists the
flags.

## Check it mechanically

```bash
pnpm frameless:check
```

14 checks. It does not need the app running. It answers: is the window really
frameless, are the native traffic lights kept, does the strip drag, do tabs still
click, is the traffic-light gutter reserved.

All 14 should say `PASS`.

## Things that will confuse you

- **It takes ~15 seconds** to open. It boots a whole harness first.
- **The terminal stays busy.** That is the window running. Ctrl-C closes it.
- **Your installed app is untouched.** The preview boots against a throwaway
  profile, so your real Mitsumeru settings, sessions and plugins are not read or
  written.
- **If you see "Failed to load plugins"** in the window, run `pnpm harness` and
  try again.

## What is NOT done

- **The app does not use this yet.** `src/main/index.ts` still creates a normal
  window. This is a prototype to look at and decide on.
- **Two decisions are open**, and they are the reason this has not been wired in:
  1. **The traffic lights would overlap the first session tab.** The strip has
     10px of left padding; the lights need roughly 18px + 52px. Either nudge them
     right (affects your app only) or reserve ~72px of leading space (what Figma
     and Discord do).
  2. **A 38px draggable band across the top swallows drags aimed at the app** —
     selecting text, grabbing a scrollbar. Figma and Discord accept this because
     that strip is permanently their window chrome. Here it is a session-tab row
     that sometimes is not there at all.

Tell me which way you want those two settled and it can be wired in.

## Why the strip needs a fallback bar

Measured: **this app has no persistent top bar.** The session tab strip is the
only thing that ever occupies the top row, and it does not exist until you open a
session. With the title bar hidden, a fresh window would have nothing to grab —
so the prototype also keeps a transparent, click-through bar across the top edge.
Click-through matters: it must never steal a click from the tab underneath.
