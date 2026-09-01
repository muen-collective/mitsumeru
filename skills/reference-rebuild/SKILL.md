---
id: reference-rebuild
name: Reference rebuild
description: Rebuild a reference (a Framer template, an existing site, or an established UI pattern) as your own React/Vite front-end. Uses the reference as a shared intermediary — the designer works the UI (the reference's look), the agent works the code (the implementation that matches it) — and is faster than starting from a blank page. Don't reinvent: start from a reference or a proven pattern from the get-go. Triggers whenever the user wants to 'rebuild this from a reference', 'reference-rebuild this template', 'convert this site to react', 're-implement this design as a react front-end', 'remake this from a reference', or 'clone a template into owned code'. Was 'de-framer' — the visual-reference case of 'use a proven pattern, don't reinvent'.
---

# Reference rebuild: turn a reference into owned React code

## The method (why it's fast)

Use a **reference** as the shared intermediary. Two people/two halves:

- The **designer works the UI** — the reference's look: layout, type, color, motion, craft.
- The **agent works the code** — the implementation that matches the reference's look.

Each owns one half; neither invents the other's. It's **faster to start from a reference than a
blank page** because the reference settles the design debate up front — you rebuild it as code
you own rather than whiteboarding a design and guessing at implementation.

## Don't reinvent — two kinds of "already exists"

Before building anything, ask: *does a proven pattern or reference already cover this?* If yes,
use it.

| Kind | Example | Use instead of building from scratch |
|---|---|---|
| **Functional/UX pattern** | sign-in & auth, forgot password, checkout, company/org user management | the established pattern/library/service — Clerk for auth, Stripe Payment Links for checkout, an org/user model for permissions. **Never hand-build a sign-in flow.** |
| **Visual reference** | a Framer template, an existing site, a loved design | the reference-rebuild method below — rebuild the look as owned code. |

## Reference rebuild pipeline

1. **Capture the reference** — `clone-site` → self-hosted static HTML reference (settle →
   capture → build → measure → receipts). The clone is **reference material only, never shipped**.
2. **Extract the visual DNA** — layout rhythm, type scale, color behavior, motion, component set.
   Read the design system from the outside; name it before you rebuild it.
3. **Rebuild as real components** — your design tokens (design-system skill) on primitives;
   composition replaces isolated frames. AI-assisted implementation; you direct, review diffs,
   judge behavior in the running instance.
4. **Polish + verify** — `frontend-read-audit` (read the implementation critically),
   `site-health-check` (launch readiness), `animate-entrance` (motion). No visual drift vs the
   reference at phone/tablet/desktop.
5. **Zero-reference gate + ship** — no generated code from the source platform (e.g. for a
   Framer reference: no `framer-*`, no `framerusercontent.com`, no `data-hmu-*`/`ssr-variant`/
   `hmu-text`); deploy; **client accepts**.

## Rules

- **Never reinvent the wheel.** If a pattern/library/service/reference already exists for the
  job, use it — building a sign-in flow or a checkout from scratch is the failure mode, not the
  point.
- **Never ship the clone or a rename of it** — the rebuild is the product; the clone is reference
  material.
- **Intent is context, geometry is the ask.** During design, classify every instruction: *intent*
  ("the spacing is too loose") is a design decision to interpret + confirm; *geometric* ("move the
  button up 12px") is executed exactly (quote computed values). Use the **debug mode** to tell
  which one you're saying.
- Keep design tokens to the design-system source of truth; no ad-hoc values.
