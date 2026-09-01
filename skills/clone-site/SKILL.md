---
name: clone-site
description: Clone a website or page into a self-hosted static HTML + assets directory, with numeric fidelity gates. Triggers whenever the user wants to clone, copy, replicate, or capture a site/page/URL as a static HTML artifact - e.g. 'clone this website', 'copy this page's design', 'capture this URL for a prototype', 'replicate a template's look'. Drives the enforced pipeline - settle, capture, build-by-capture, measure, pixel diff, receipts - without external reviewer dependencies.
---

# Clone a site (self-hosted static clone, gate-checked)

This skill turns any URL into a self-hosted static clone at
`targets/<NAME>/clone/` with numeric fidelity gates and receipts. It is the
local, dependency-free sibling of the pingfusi pixel-perfect kit: same method
(settle before capture, build by capture, measure the painted mark, gates exit
0), no external reviewer service and no login.

## When to use
- User wants a website/page cloned, captured, or replicated as static HTML.
- You need a faithful design reference (structure, tokens, layout) to build a
  prototype in the same visual language.
- You want a runnable static copy of a page with its CSS, fonts, and images
  self-hosted.

## Preflight (doctor)
Run `node scripts/clone-site.mjs doctor` from the skill directory. Required:
- node 20+
- playwright + chromium available (resolved from the workspace's node_modules
  or claire-ai's; the runner finds them automatically)
- jsdom available (same resolution)
- @blazediff/core available (same resolution; used by the visual gate)

If anything fails, the command prints the exact fix. Stop until doctor exits 0.

## The three values
- **URL** - the page to clone (ask if not given).
- **WIDTH** - fixed measurement viewport width, default 1728.
- **NAME** - short slug, default derived from the domain. Targets land in
  `targets/<NAME>/` under the **current working directory**.

## Pipeline (each phase advances only when its gate exits 0)

Run `node scripts/clone-site.mjs status <NAME>` anytime - it always says what
is next.

1. **new** - `node scripts/clone-site.mjs new <NAME> <URL> [WIDTH]`
   Scaffolds `targets/<NAME>/` and pins the target. Gate: target.json exists
   with URL + width.

2. **capture** - `node scripts/clone-site.mjs capture <NAME>`
   Opens the page in headless chromium at exactly WIDTH px. **Settle first:
   scroll-sweep the page, then confirm stability** (DOM height + image count
   unchanged across a settle window). If the page never settles, capture is
   refused - a DOM that was still mounting is a page that never existed, and
   every later gate would go green over a hole. Writes `dom.html`,
   `live.png` (full-page screenshot), and `settle.json`.

3. **build** - `node scripts/clone-site.mjs build <NAME>`
   **Build by capture, never hand-reconstruct.** Processes the captured
   `dom.html`: strips scripts/CSP/modulepreloads, self-hosts stylesheets,
   fonts, and images (tracking/analytics URLs are skipped), rewrites URLs to
   local `assets/`. Writes `clone/index.html` + `clone/assets/`. Gate:
   clone/index.html exists and references no external http(s) assets.

4. **measure** - `node scripts/clone-site.mjs measure <NAME>`
   Measures BOTH pages (live + clone) at the same WIDTH via the painted-mark
   method: for every visible element, capture the rendered box (x/y/w/h),
   text glyph box via `Range`, font (family/size/weight/color/line-height/
   smoothing), backdrop color (nearest opaque ancestor background), border
   boxes, and underline boxes. Numbers, not eyeballs. Writes
   `measure-live.json` and `measure-clone.json`.

5. **visual** - `node scripts/clone-site.mjs visual <NAME>`
   Screenshots the clone at the same WIDTH, then pixel-diffs live vs clone
   with @blazediff (threshold 0.1, diff image `diff.png`). Gate: differing
   pixel ratio <= tolerance (default 0.02 = 2%). Screenshots triage, they
   never certify a match on their own - the numeric measure gate is the
   certifier.

6. **strict** - `node scripts/clone-site.mjs strict <NAME>`
   Compares the numeric measures: every painted leaf's box and text metrics
   within tolerance (default 0.5px). Deltas over tolerance fail the gate with
   the list. Colour/visibility deltas are NEVER structural - they fail.
   Structural (DOM-level) differences are documented in `strict.json`, not
   silently ignored. **JS-driven dynamics** (carousels, marquees, tickers)
   that a static clone cannot reproduce are excused WITH A DOCUMENTED REASON
   via `targets/<NAME>/behavior-exempt.json` (array of `{key, reason}`, key
   matches a leaf key substring) - they land in `strict.json` under
   `behavior`, not in the failing `deltas`.

7. **report** - `node scripts/clone-site.mjs report <NAME>`
   Writes `receipts.md`: gate table, measure summary, diff ratio, artifact
   inventory with sha256, and the exact commands to re-verify.

## Rules
- Never `--force` a gate. A blocked phase means fix what the gate names.
- Never invent values: measurements come from the page, mechanisms from its
  captured CSS/markup.
- Font smoothing: set `-webkit-font-smoothing: antialiased` on the clone root
  by default (perceived weight changes without font-weight changing).
- Keep tolerance at 0.5px for measures - sub-0.5px is sub-pixel noise with
  zero visual payoff. When something "reads wrong" at 0.01px, the defect is
  the technique (a positioned div vs a real border), not the tolerance.
- A solid `background-color` on an ancestor (bar, button, badge) is a painted
  mark - measure the effective backdrop, never just the text leaf's color.
- An underline/strike/rule is a BOX drawn by some element (often an ancestor):
  measure thickness + x/width + y on the element that draws it, never a
  boolean.
- Batch browser calls aggressively; each CDP round-trip is slow.
- Deliver with receipts: final `status` table + `receipts.md`.

## Artifacts layout
```
targets/<NAME>/
  target.json       - pinned URL + width
  dom.html          - settled captured DOM (source of truth)
  live.png          - live full-page screenshot
  clone/index.html  - self-hosted clone
  clone/assets/     - css/ fonts/ media/
  measure-live.json / measure-clone.json
  diff.png          - visual diff visualization
  strict.json       - numeric deltas + structural notes
  receipts.md       - final report with sha256 inventory
```

## Honest limits
- Static capture: JS-driven dynamics (marquees, hover menus, infinite scroll)
  are not reproduced; note what was stripped in receipts.md.
- No independent reviewer: gates are numeric and deterministic, but a human
  (user) should eyeball `diff.png` + `clone/index.html` for taste-level
  fidelity. The pixel-perfect pingfusi kit remains the choice when an
  external reviewer verdict is required.
