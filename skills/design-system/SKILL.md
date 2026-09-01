---
id: design-system
name: Design system & craft
description: Brand-grade visual craft for design work — design-system-first thinking and anti-AI-slop rules.
---

# Design system & craft

Hold this bar on any visual work — HTML mockups, prototypes, real UI.

## 1. Design system is the source of truth
- Look for root `DESIGN.md` first. When it exists and validates, it is the canonical Google-compatible project theme shared by the canvas, HTML/SVG generation, and code implementation.
- Patch its YAML front matter structurally, preserve its Markdown rationale and unknown extension keys, and use the exact current source hash for conflict-safe updates.
- Never draw a separate HTML, SVG, or freeform "style guide" artifact. Kun renders `DESIGN.md` through its fixed built-in specimen board.
- `.kun-design/HANDOFF.md` is generated project handoff, not a theme. `.kun-design/DESIGN.md` and `.kun-design/design-system.json` are compatibility/migration inputs only.
- Derive every visual decision from tokens (color, spacing scale, radius, type scale), not ad-hoc values. Keep them consistent across the whole artifact.

## 2. Avoid generic AI tells
These read as "AI made this" — do not ship them:
- Cream / sand / beige default backgrounds; default to a deliberate neutral that fits the brand.
- Purple→blue diagonal gradients as a hero default.
- Bounce / elastic / overshoot easing. Use calm, short, standard easing.
- Endlessly nested cards (a card inside a card inside a card).
- Low-contrast gray text on colored or tinted backgrounds.
- Emoji as iconography in a serious product.

## 3. Craft baseline
- **Contrast & a11y**: verify text contrast (WCAG AA); never rely on color alone; provide a `prefers-reduced-motion` fallback for any animation.
- **Type**: a real type scale (not two sizes); generous line-height for body; tighten headings.
- **Spacing**: one spacing scale, applied rhythmically; align to a grid; let content breathe.
- **Hierarchy**: one clear focal point per view; size/weight/color do the work, not borders everywhere.
- **Motion**: purposeful and subtle; entrance/feedback only; respect reduced-motion.
- **Responsive**: design mobile and desktop intentionally, not just a squished desktop.

## 4. Maintain DESIGN.md as living documentation

- When a new reusable UI component is accepted (Button variant, Card, Chip, TextField, etc.), **add its API table and usage notes to `DESIGN.md`** in the Component tokens section.
- Keep the table format: `| Prop | Type | Default |` with a short description below.
- When adding a test/design page (e.g. `/workflow-menu-test`), add a link in the **Design System** sidebar at `src/pages/DesignSystemPage.tsx` under the "Test Pages" section.
- If tokens change in `src/tokens.ts`, update the corresponding tables in `DESIGN.md` immediately.
- Do not let DESIGN.md drift from the code — if you read a component and its docs are missing or stale, fix them.

## 5. Output
- Choose the artifact that matches the request: self-contained HTML for interactive UI, SVG for vector illustration or motion, and editable native shapes for whiteboard structure.
- Make HTML/SVG runnable as-is. Prefer system fonts or a single well-chosen web font.
- When the user iterates, change only what they asked for — keep the rest stable.
