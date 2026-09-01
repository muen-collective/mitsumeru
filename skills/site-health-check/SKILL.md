---
id: site-health-check
name: Site health check
description: Client-facing verification skill. Checks a Mitsu-built site against its Storybook contract and reports pass/fail in plain language — visual regression (every pattern still renders green in the client Storybook), WCAG AA contrast on the theme and rendered pages, layout at phone/tablet/desktop widths (no overflow, no overlap), and broken links or missing assets on the live site. Triggers whenever the client asks "is my site broken", "check my site", "why does this look off", "run the health check", or after any theme/content/section edit ("did my change break anything").
---

# Site health check (the client's verification surface)

Run after any client-side change and before asking the agency for help. The client
should never be the first person to discover a broken page — this skill is the
checkpoint that proves edits are safe, and it is the only QA surface a client account ships with.

## Inputs

- **Deployed site URL** (the live product).
- **Storybook URL** (the client product's Storybook — the contract; every pattern must render green here).
- **Theme tokens** (the token layer — checks run against token values, not rendered pixels alone).

## Checks (run in order; stop-and-report on the first failure class)

### 1. Storybook contract regression
- Load the client Storybook; run the visual regression baseline and the a11y pass
  (axe: no critical/serious violations).
- Every pattern/story must render green — a red story means the pattern library itself
  broke, which is an agency issue, not a client one: report and escalate.
- This is the contract: if Storybook is green and the site renders from the same
  components, the site is structurally safe.

### 2. Contrast (WCAG AA)
- Check theme token pairs on rendered pages: text vs background ≥ 4.5:1 (body) and
  ≥ 3:1 (large text / UI components). Never rely on color alone — also check non-text
  indicators (focus rings, status dots) against their backgrounds.
- If a token pair fails, report the exact token names and the computed contrast ratio —
  then point to `theme-tune` ("warm it up" stays within tokens) rather than a manual fix.

### 3. Layout (phone → desktop)
- Check widths: 375 / 768 / 1280. Fail on horizontal overflow (any element wider than
  the viewport), overlapping interactive elements, or a broken spacing rhythm (a
  section that lost its gutter).
- Quote computed values in the report (element, width, overflow amount) — geometry,
  not vibes: "the hero title wraps at 375px and overflows 12px", not "the hero looks broken".

### 4. Broken links & assets
- Crawl the live site: 404s, dead anchors, missing images/fonts/media, broken CTAs.
- List each broken URL with the page that links to it.

## Report format

```
Site health: PASS / FAIL (n of 4 check groups passed)

1. Storybook contract — PASS/FAIL (…)
2. Contrast (WCAG AA) — PASS/FAIL (failing pairs: token × token, ratio)
3. Layout — PASS/FAIL (device, element, computed overflow/overlap)
4. Links & assets — PASS/FAIL (broken URL, source page)

If FAIL: a plain-language summary of what's wrong, what the client can fix themselves
(which client skill: content-manage / theme-tune / section-add), and anything that
needs the agency (custom logic, red Storybook) → "request a change".
```

## Boundaries (the wall)

- Anything this skill cannot verify (custom logic, new collections, integrations) is
  **not a health-check gap** — it is the escalation wall: report "this needs Muen" with
  the one-click request path. Never improvise a check that requires agency-side tooling.
