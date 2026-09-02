# Mitsu skills

The curated Mitsu skill set, packaged into the fork so `scripts/install-mitsu.sh`
can provision them into the app home (`$MITSU_HOME/skills`, i.e. `~/.mitsu-dsh/skills`
by default). Each skill is a `SKILL.md` directory bundle (DSH / open-standard:
`name` + `description` frontmatter) plus optional `references/`, `scripts/`,
`assets/`, and `skill.json`/`LICENSE`.

## The set

| Skill | Purpose |
|---|---|
| `clone-site` | Clone a website/page to a self-hosted static HTML + assets dir with numeric fidelity gates (settle → capture → build-by-capture → measure → pixel-diff → receipts). Produces the reference for de-Framer; never shipped. |
| `reference-rebuild` | Rebuild a reference (Framer template / existing site / established UI pattern) as your own React/Vite app — designer works the UI, agent works the code. Don't reinvent: start from a reference or proven pattern. |
| `animate-entrance` | Framer-style entrance animations (staggered fade+move, hover grow, scroll reveal) in vanilla CSS+JS. |
| `design-system` | Brand-grade visual craft — design-system-first thinking and anti-AI-slop rules. |
| `fashion-image-prompting` | Fashion/product photography prompting (terminology library + 8 generation rules). |
| `diagram-design` | DESIGN.md-driven HTML, SVG, and editable whiteboard diagrams. |
| `frontend-read-audit` | Read/audit React/Tailwind/shadcn components (pre-handoff QA gate). |
| `site-health-check` | Client site verification vs its Storybook contract (visual regression, WCAG AA, responsive layout, broken links). |
| `story-pointing` | Fibonacci story points + 3-point hour estimates for epics. |
| `migrate-old-website` | Migrate a legacy website (Wix/Shopify/Squarespace/Framer/static) into your own React/Vite app content-first, then rewrite the copy as a separate pass. |
| `install-mitsu-bundle` | Install the curated Mitsu plugin bundle into a DSH profile via the market (`dsh plugin add`) — on-demand, not a fixed bundled set, so plugins stay removable. |

## Provenance

Copied from the Kun skills runtime (`~/.kun/skills`) — the user's curated source
collection — with working data excluded (`targets/`, `node_modules/`, `.DS_Store`).
`clone-site` ships its `scripts/clone-site.mjs` engine (proven self-hosted
implementation); its runtime deps (playwright, jsdom, `@blazediff/core`, pngjs)
are not vendored — see the skill's own `preflight (doctor)` notes.
