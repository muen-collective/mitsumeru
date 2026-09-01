---
id: de-framer
name: De-Framer
description: Hand-rebuild a Framer template (or its static clone) as a Vite + React + TypeScript + Tailwind front-end that carries ZERO Framer-generated code — not just zero 'framer' strings. Triggers whenever the user wants to 'de-framer this template', 'rebuild this as react', 'convert this framer site to react', 're-implement this template in a react front-end', 'hand-build this as a react app', or 'port this framer design to vite react'. Composes clone-site (produces the reference), design-system (visual craft), and animate-entrance (motion). Lineage: mitsu/claire hand-me-up react-rebuild epic (Epic 12), which supersedes the rename/self-host de-Framer pass (Epic 09).
---

# De-Framer: hand-rebuild a Framer template as a React front-end

## The principle (this is the whole point)

**De-framing is a rebuild, not a rename.** A rename/self-host pass (Epic 09) only relabels
Framer's generated code — `framer-*` classes become `hmu-*`, assets move local, but the DOM,
BFF-free render path, hydration markers, and runtime stay Framer's (`data-hmu-hydrate-v2`,
`data-hmu-css-ssr-minified`, `ssr-variant`, `data-hmu-component-type`, `hmu-text
hmu-styles-preset-*`). That is still Framer's product, just renamed — the Framer lock-in remains.

De-framing instead **rebuilds the settled design as clean React components** so the production
code is fully owned: no Framer runtime, no `framer-*` classes, no `framerusercontent.com`
assets, no Framer-generated manifest. Same look, zero dependency.

## Start here

- Use the **clone-site** skill first to capture the template as a self-hosted static HTML
  reference (settle → capture → build → measure → receipts). The clone is **reference material
  only** (teardown + visual DNA) — it is never shipped. It also already extracted the assets
  (fonts, images, video) you will self-host.
- Confirm the **settled design + section inventory** before writing components. If the design is
  not accepted yet, settle it first — do not rebuild against a moving target.

## Stack decision (driven by the business ceiling, not taste)

Decide the stack from what the site actually needs. Default is:

- **Vite + React + TypeScript, static output, no backend.**
- **Tailwind CSS** + CSS variables for design tokens (matches Mitsu muscle memory).
- **Self-hosted fonts** (from the clone's extracted `assets/fonts/`), no external font CDN.
- **Stripe Payment Links** for one-off checkout — no `/api/checkout`, no webhook, no `orders`
  table. "Is it available?" is a human decision from the payment notification, not a database.
- **Vercel static** deploy.

Only reach for a server/framework if a real serverless need appears (e.g. a genuine RSVP flow),
and add it additively (a few functions) rather than rewriting.

## The rebuild contract

```
<client-repo>/
  web/                  ← the Vite React app (the product; this is what ships)
    index.html
    package.json
    vite.config.ts
    src/
      main.tsx
      App.tsx
      styles/           (tokens.css, global.css)
      components/       (Header, Hero, Section, Footer, … one per section)
      lib/              (content loader)
    public/
  content/              ← content model (*.json), consumed by web/
    landing.json  mission.json  works.json  testimonials.json  faq.json  contact.json
  clone/                ← clone-site static reference (NOT shipped; retire after accept)
```

- **Content lives in JSON, never in component code.** Components read `content/*.json` (fetched
  or imported at build). Text + image URLs in JSON — this is the seam the publish/motion layer
  writes to later.
- **Design tokens** come from the design system (design-system skill); apply them as CSS
  variables + Tailwind.
- **Motion** is added with the **animate-entrance** skill (Framer-style entrance animations in
  vanilla CSS/JS), not the Framer runtime.

## Build order (one fresh thread per block)

1. **Scaffold + tokens + fonts + Vercel config** — verify dev serves a styled shell; build emits
   static output.
2. **Content model + loader** — verify JSON drives a placeholder render.
3. **Header + Hero** (incl. arc text, floating cards, CTA).
4. **Mission / Works / Ability / Testimonials / FAQ / Contact / Footer** — one component per
   section, one per block.
5. **Responsive + motion + visual regression** at phone/tablet/desktop vs the reference.
6. **Zero-Framer gate + deploy.**

## The zero-Framer gate (the real acceptance bar)

`grep -ril framer web/` == 0 is necessary but **not sufficient** — Framer code survives a plain
rename. Gate on the *generated-code* markers too:

- No `framer-*` classes or `framerusercontent.com` asset URLs.
- No Framer hydration SSR markers: `data-hmu-hydrate-v2`, `data-hmu-css-ssr-minified`,
  `ssr-variant`, `data-hmu-component-type`, `hmu-text`, `hmu-styles-preset-*`, `hmu-*` (the
  rename trap).
- No Framer runtime/manifest (`unpkg.com/lenis`, `framerusercontent` fonts).

Make it CI-checkable (e.g. a grep/script gate that fails the build on any hit).

## Acceptance bar

- Production site renders the **same sections** at phone/tablet/desktop with **no visual drift**
  vs the accepted reference.
- **Zero Framer-generated code** in the build (not just zero `framer` strings).
- **Content editable via `content/*.json`** without touching components.
- One-off purchase path documented as "Stripe Payment Link + manual ship" (no backend).

## Rules

- Never ship the clone or a rename of it — the rebuild is the product.
- Never hand-reconstruct the clone machine; use clone-site's proven engine for the reference.
- Derive mechanism/measurement from the captured page, never invent values.
- Keep design tokens to the design-system source of truth; no ad-hoc values.
- Reuse animate-entrance + design-system + frontend-read-audit; a mechanical port is faster than
  a from-scratch rebuild.
