---
id: frontend-read-audit
name: Frontend read & audit
description: Read and audit React/Tailwind/shadcn components with a fixed protocol that doubles as the pre-handoff QA gate, and write geometry-first prompts in dev language. Use when learning to read frontend code, reviewing a component before handing it to the implementation partner, checking a component against a rigorous frontend audit bar, or describing a UI bug/integration in a prompt.
---

# Frontend read & audit

One asset, two jobs: train the reader and guarantee handoffs pass audit. Every component reviewed with this protocol produces a short audit note that **is** the handoff doc for the implementation partner — they then only harden the backend.

## The five mental models

1. **JSX is nested function calls.** `<Card title="X">` is `Card({ title: "X", children })`. Reading React = reading a call tree, not magic markup.
2. **Props are the contract.** The interface/type at the top of a component IS its API. Read it first; everything below is implementation.
3. **DOM is what the browser actually builds.** React holds a virtual description and reconciles it. "Understanding DOM" = predicting the element tree from JSX, then confirming in devtools.
4. **Tailwind is atomic CSS.** One class ≈ one declaration (`flex` → `display:flex`). Translate classes to declarations; when unsure, check the Computed tab. Build a personal dictionary of the ~50 classes actually used.
5. **shadcn = thin wrappers over Radix/Base UI primitives.** The wrapper file is where customization lives; the primitive underneath handles a11y. Never fight the primitive.

## Read protocol (5 steps)

1. **Contract** — read the props interface and what the component renders.
2. **Tree** — trace the JSX: what DOM results, what nests in what.
3. **Styles** — translate Tailwind → computed CSS; check values against DESIGN.md tokens (no ad-hoc values).
4. **Behavior** — state, effects, data flow; check keys, deps, cleanup.
5. **Verify** — what you read must match what renders in the browser. Mismatch = the mental model is wrong; fix the model, that is the learning.

## Audit checklist (the "rigorous frontend audit" bar)

- Semantics: real elements — a button is a `<button>`, not a `<div onClick>`.
- a11y: labels, focus order, contrast (WCAG AA), reduced-motion fallback, full keyboard support.
- Responsive: no overflow at mobile widths; intentional mobile layout, not a squished desktop.
- State correctness: no stale closures, no missing keys, correct effect deps and cleanup.
- Token compliance: DESIGN.md tokens used; no ad-hoc colors/spacing/radius.
- Dead code: unused imports and exports removed.
- Accessibility tree: check what assistive tech actually sees.

## Output

A one-page audit note: contract, tree, risks. This note is the handoff doc.

## Designer → dev vocabulary (glossary)

Design intent is context; geometry is the ask. When a prompt uses Figma language, translate before acting.

| You say (Figma) | Dev actually means |
|---|---|
| Frame | A container/div with a layout context (flex or grid) — not a canvas region |
| Group | A plain wrapper div — usually removable or `display: contents` |
| Auto layout | `flex` (row/column) or `grid`; spacing between items = `gap` |
| "Spacing" | Never use alone — always `gap` (between siblings), `margin` (outside a box), or `padding` (inside a box) |
| Layer | DOM element/node |
| Constraints | `flex-grow/shrink`, `width: %`, `min-width` |
| Clip content | `overflow: hidden` |
| Stroke | `border` (or `outline`) |
| Corner radius | `border-radius` |
| Shadow | `box-shadow` |
| x/y | `left/top` or `translate` — inside flex/grid, x/y are computed, never set |
| Width/height | The box model — devtools Computed tab shows content-box vs border-box |
| Variant | A `prop` (React) or a class variant |

Bug-hunting geometry vocab: `computed value` (ground truth, devtools Computed tab), `offsetWidth/offsetHeight`, `scrollHeight` vs `clientHeight`. An iframe element's height never auto-matches its embedded document — it is a separate document; fix = match heights or `overflow`.

## Prompt template (geometry-first)

Never describe a visual bug by intention alone. F12 → find the element → quote computed values.

```
Intent (one line): what the design should communicate/do.
Element: [component/div, where in the tree]
Observed: [computed value from devtools, e.g. div.y=812, height=480]
Expected: [value + the rule, e.g. bottom edge should sit 16px above parent → use gap/margin]
Must not change: [other behavior to preserve]
```

Canonical example: portfolio iframe gap bug. Intention-only prompt ("the demo isn't filling the iframe") failed; the fix landed only when the prompt quoted the y-value of the div vs the iframe position.

## Tutor loop rule

When a prompt (from Claire or anyone) describes UI in Figma language, translate it back in dev language before acting: "You said *frame* — I read that as a flex container at this node; item spacing is `gap: 16px`." Every Figma-language prompt becomes a correction. Log every word misfire as: your word → correct word → one-line mental model. The log becomes the glossary.

## Training loop

Before editing any component, do the 10-minute read-back (contract → tree → Tailwind translation → behavior), then describe the component in dev language out loud. One new component per day — the repo is the curriculum. In every bug prompt, quote a number from devtools or don't prompt yet.
