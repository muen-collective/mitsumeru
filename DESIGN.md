# Mitsu Design System

> Single source of truth for visual tokens and UI components.
> **Status: AUDITED + FIXED + SOURCE-VERIFIED (2026-08-11) — frozen for Block #1 (dark scope); canonical at the Mitsu repo root since kickoff (Block #0, 2026-08-11).** Kimi K3 audit adjudicated; findings 1–16 resolved in [Resolved inconsistencies](#resolved-inconsistencies). All codified values spot-checked against the actual claire-ai sources (globals.css, tokens.ts, Mitsu stories) on 2026-08-11 — deltas found are recorded in Resolved #8–11. During the migration, the claire-ai Storybook (`Patterns/Mitsu` stories) is the design source of truth; this file is its codification.
>
> **Scope: Block #1 freeze covers Dark EVA Unit 01 only.** Components consume tokens exclusively via CSS variables — **no hex literals in component code** — so Light EVA (Unit 00) values slot in later without code changes. Light EVA token set + h1–h4 codification land before Block #2.
>
> Canonical token values come from **what actually renders** in the claire-ai Storybook dark theme (EVA dark): `src/globals.css` `.dark` block (L239–300) + Tailwind `@theme inline` mappings (L19–58), verified against the Mitsu stories' rendered classes. `src/tokens.ts` constants are authoritative for programmatic spacing/size where stated; **radius is NOT** (Resolved #3). (Correction 2026-08-11: the `@theme inline` block is at L62–131, not L19–58 — L19–52 are `@font-face`; `.dark` L239–300 verified exact.) Conflicts are listed in [Resolved inconsistencies](#resolved-inconsistencies) with their decisions — do not silently pick a side.

---

## Brand

| Property | Value |
|----------|-------|
| Name | Mitsu (Mitsumeru) |
| What | BYOK creative tool — Electron + Web, same account both tiers (Clerk) |
| Theme | **Dark EVA Unit 01** is the default (first login); Light EVA (Unit 00) is the light mode |
| Voice | Precise, calm, grounded. Talks to working designers/creators as peers. |
| Defaults | Controls are **monochrome**; brand color is an explicit opt-in. No AI-slop: no cream backgrounds, no purple→blue hero gradients, no bounce easing. |

---

## Color — Dark EVA Unit 01

> Block #1 scope: dark values only (see header). All values below are canonical for dark; Light EVA is a separate token set delivered with Block #2.

### Neutrals (default surface + text)

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `oklch(0.13 0 0)` | Page background |
| `--foreground` | `oklch(0.95 0 0)` | Primary text |
| `--card` / `--popover` | `oklch(0.08 0 0)` | Cards, popovers, dropdowns |
| `--card-foreground` / `--popover-foreground` | `oklch(0.95 0 0)` | Text on cards |
| `--muted` | `oklch(0.22 0 0)` | Muted surfaces (note boxes, hover fills) |
| `--muted-foreground` | `oklch(0.68 0 0)` | Secondary text, captions |
| `--border` / `--input` | `oklch(0.3 0 0)` | Borders, input outlines (monochrome) |
| `--ring` | `oklch(0.66 0.11 292)` | Focus ring — **2px solid; ≥3:1 verified (6.2:1 on background, 6.4:1 on card)**. The glow is decorative and never the focus indicator (Resolved #9) |
| `--inverse` / `--inverse-foreground` | `oklch(0.985 0 0)` / `oklch(0.13 0 0)` | Inverted selection surface |
| `--sidebar` / `-foreground` | `oklch(0.15 0 0)` / `oklch(0.95 0 0)` | Sidebar surface |
| `--sidebar-accent` / `-accent-foreground` | `oklch(0.22 0 0)` / `oklch(0.95 0 0)` | Sidebar active/hover row |
| `--sidebar-border` | `oklch(0.25 0 0)` | Sidebar edge |
| `--sidebar-ring` | `var(--ring)` | Sidebar focus |
| `--accent` / `--accent-foreground` | `oklch(0.16 0.02 55)` / `oklch(0.94 0.02 55)` | Warm deep-surface emphasis (re-expressed in oklch — Resolved #6) |

### EVA brand triad (identity only)

| Token | Value | Usage |
|-------|-------|-------|
| `--primary` / `-foreground` | `#765898` (purple) / `#ffffff` | Brand surfaces: solid primary buttons (`variant="default"`), selected fills (paired with foreground), `color="brand"` opt-ins. **Raw `text-primary` is banned for text on dark surfaces — 3.5:1, fails AA (see Contrast)** |
| `--secondary` / `-foreground` | `#52d053` (EVA green) / `#0a0808` | Secondary actions (outline tint), identity accent. **NOT status — positive/running states use `--success` (Resolved #2)** |
| `--tertiary` / `-foreground` | `#c62a3e` (crimson) / `#ffffff` | Wayfinding **strokes/fills only**: kicker underline, line-tab underline, punctuation accents — 3.6:1, non-text ✓ but **banned as text** |
| `--tertiary-text` | `#e0485c` | **Tertiary as text** (kickers, punctuation, word accents) — 5.0:1 on background ✓ (Resolved #5). Tab active labels do NOT use it — they stay `text-foreground` (story-verified) |
| Hover | No hover tokens — opacity overlays only (story-verified: zero hex hovers in Mitsu stories): solid primary `hover:bg-primary/80`; outline-secondary `hover:bg-secondary/10 hover:text-secondary`; ghost `hover:bg-muted`; list rows `hover:bg-muted/60`; border accents `hover:border-<color>/30` | Single hover mechanism (Resolved #8) |
| `brand` | alias of `--primary` (`--brand: var(--primary)`) | `bg-brand` etc. = explicit brand opt-in for non-button controls |

### Feedback (status only — non-text)

| Token | Value | Foreground |
|-------|-------|------------|
| `--destructive` | `oklch(0.52 0.19 28)` | `oklch(0.9 0 0)` |
| `--success` | `oklch(0.5 0.12 145)` | `oklch(0.95 0 0)` |
| `--warning` | `oklch(0.52 0.16 55)` | `oklch(0.95 0 0)` |
| `--info` | `oklch(0.5 0.15 260)` | `oklch(0.95 0 0)` |

> **Non-text-only rule (Resolved #10):** status colors are for icons, dots, fills, borders, and indicator surfaces — each is 3.3–3.7:1 on card (passes 3:1 non-text). **Status *text* (captions, alert descriptions) uses `foreground`/`muted-foreground`, never a status color.** Raw `--destructive` as text is banned (3.3:1). Solid destructive button: fill `--destructive`, text `--destructive-foreground` (4.6:1 ✓).

### Dataviz (charts only)

`chart-1..10`: `#765898` purple · `#52d053` green · `#c62a3e` crimson · `#e6770b` orange · `#f6c026` gold · `#68a8a8` teal · `#d94a9c` magenta · `#b9a3c9` lavender · `#60A5FA` blue · `#22D3EE` cyan. First three are the brand triad — **triad hexes may be reused inside charts**; feedback colors are never used in dataviz. Asset resolution underlines are dataviz-context: `--color-reso-4k: #e6770b`, `--color-reso-6k: #52d053`.

### Gradients

```css
--gradient-bg: radial-gradient(512px at top right,
  color-mix(in oklab, var(--primary) 12%, transparent) 0%,
  color-mix(in oklab, var(--secondary) 10%, transparent) 55%,
  color-mix(in oklab, var(--secondary) 0%, transparent) 100%);
```
Subtle brand moment for hero/splash surfaces only — never a default background.

### Color token architecture (rules)

1. **Three palettes + one documented exception**: EVA triad = identity (primary brand / secondary actions / tertiary wayfinding); Feedback = status (**non-text only**); Dataviz = charts (may reuse triad hexes, never feedback); `--color-badge-*` = the only ad-hoc family (kept — Resolved #7). Cross-purpose use is a design error.
2. **Neutrals are the default control color.** Switches, inputs, tabs render monochrome unless `color="brand"` (or equivalent) is explicitly passed. Brand tints (`bg-primary/10` behind neutral text) are opt-ins, never defaults. **Two codified exceptions: (a) Button `variant="default"` = solid primary — the view's focal action (Resolved #11); (b) selection/active highlighting uses brand tints by default** — selected list rows `bg-primary/5`, active filter chips `border-primary bg-primary/10`, active nav row `bg-accent/10` (all story-verified). Rule 2 governs interactive control color, not selection state.
3. **Components use role tokens only — never raw hex.** Exception: badge candy. **Text restriction:** triad/status colors as *text* on dark surfaces only via `--tertiary-text`; `text-primary` / `text-secondary` / `text-destructive` / status colors as body/caption text are banned (see Contrast).
4. **Hover**: no hover tokens — opacity overlays only (rule 4 in triad table). No `color-mix` hover formula.
5. Legacy aliases (`--coral`, `--periwinkle`, `--color-primary: #7C8CFF` legacy blue, `themeVars.ts` bridge) are **dead for new work** — migrate off, do not extend.

---

## Typography

| Token | Value | Usage |
|-------|-------|-------|
| `--font-sans` | `'Satoshi', ui-sans-serif, system-ui` (300/400/500/700/900, self-hosted) | All UI |
| `--font-mono` | `'JetBrains Mono', ui-monospace` (variable 100–700) | Keys, paths, SHAs, URLs, code |

### Scale

| Level | Size / weight / line-height | Usage |
|-------|------------------------------|-------|
| h5 | 1.8rem / 600 / 1.3 | Section titles (largest codified) |
| h6 | 1.35rem / 500 / 1.3 | Card/section headers |
| xl | 1.25rem / 400 / 1.5 | Lead text (canonical = tokens.ts FONT — Resolved #4) |
| lg | 1.125rem / 400 / 1.5 | Emphasis body |
| md | 0.95rem / 400 / 1.5 | Default body |
| sm | 0.85rem / 400 / 1.5 | Rows, secondary text |
| xs | 0.75rem / 400 / 1.5 | Inputs, tabs, captions (12px) |
| xxs | 0.65rem / 400 / 1.5 | Micro-labels (only when xs is too big) |
| eyebrow | 0.75rem / 600 / 1.3, uppercase, `0.04em` tracking | Kickers, section eyebrows |

h1–h4 are **not codified** — do not invent sizes; use h5/h6 + size classes. **Codification is a Block #2 gate** (Resolved #4).

### Small-text conventions (verified in Mitsu stories)

- Row-level labels: 11–12px (≈ `text-xs`).
- Chips/badges: 9.5–10px uppercase, `rounded border border-border px-1.5 py-0.5`.
- Mono for any machine-readable value: API keys, paths, SHAs, URLs, repo names.
- Body line-height ≥ 1.5; headings tightened to 1.3.

---

## Spacing

- Base grid: **4px** (Tailwind v4 default — do not override).
- Settings/panel row rhythm: `py-2.5` rows, `py-3` empty states, `px-3` panel padding — **rows separate by spacing, never by separators** (see Layout).
- Panel rhythm: `space-y-3` / `space-y-4` between groups; model/key rows are card-style: `rounded-md bg-background px-3 py-2`.
- Programmatic constants (`tokens.ts`): `SPACING` (rem) xs .25 · sm .35 · md .5 · lg .75 · xl 1 · xxl 1.5; `SPACING_PX` xxs 4 · xs 6 · sm 8 · md 10 · lg 12; `GAP` xs 2 · sm 4 · md 6 · lg 8.

---

## Radius

| Level | Value (rendered) | Notes |
|-------|------------------|-------|
| `--radius` | `0.5rem` = 8px | Base |
| Tailwind sm | 4.8px (0.6×) | small chips |
| Tailwind md | 6.4px (0.8×) | inputs, compact rows, model/key rows (`rounded-md`) |
| Tailwind lg | 8px (1×) | cards, dialogs, default |
| Tailwind xl | 11.2px (1.4×) | large surfaces |
| Tailwind 2xl+ | 14.4 / 17.6 / 20.8px | only if a surface demands it |

> **Resolved #3:** the Tailwind mapping above is the **single canonical radius source** in Mitsu. `tokens.ts RADIUS` (xs 6 / sm 8 / md 12 / lg 16 / xl 16 / full 999) is **retired** — it conflicts with what renders, and its `xl 16 = lg 16` entry is stale data. Do not port it.

---

## Shadows & glow

| Token | Value | Usage |
|-------|-------|-------|
| Glow ring (dark) | `0 0 0 1px rgba(118,88,152,.4), 0 0 16px rgba(118,88,152,.3), 0 0 48px rgba(118,88,152,.25)` | **Decorative halo only** for focus/selected brand moments. ≈2.0:1 at 40% alpha — never the focus indicator; contrast is carried by the 2px `--ring` |
| Toast | `0 8px 32px rgba(0,0,0,.12), 0 2px 8px rgba(0,0,0,.06)` | `.cn-toast` |
| `--shadow-sm/md/lg` | **Deleted from dark scope** | Undefined in globals.css; dark elevation = card surface + `border-border` + optional glow. Light EVA may reintroduce shadows (Resolved #5) |

---

## Motion

- Calm and short; standard easing only (no bounce/elastic/overshoot).
- Entrance/feedback only — never decorative looping.
- `prefers-reduced-motion`: all animation falls back to instant/opacity-only.
- Focus visibility: **2px `--ring` (≥3:1) + optional glow**; never color alone, never glow alone.

---

## Layout

- **No row separators/dividers in settings and panels.** Rows separate by spacing only (`py-2.5`/`py-3` rhythm). Cards keep their borders (`bg-muted` note boxes, token board, profile card); structural chrome (header bar, sidebar edge) keeps its border. Verified: Mitsu settings/panels contain no `border-t`/`divide-*`/Separator except the browser block's status footer (structural).
- One focal point per view — one solid primary button at most per surface.
- Settings shell: fullscreen page, left icon nav (Profile / Providers / Sites / MCP servers / Skills / Memory / Migrate), right detail panel. Sections reachable via `initialSection` for deep links.
- Web tier: never iframe external sites or Storybook — open in the installed browser. Only local HTML docs render in a sandboxed `srcDoc` iframe (MitsuDocViewer).

---

## Contrast (dark) — verified 2026-08-11, WCAG 2.1 AA

Computed from the token values above (this is the reference table; recompute if any value changes).

| Pair | Ratio | Verdict |
|------|-------|---------|
| `--muted-foreground` on `--muted` | 6.0:1 | ✅ AA text |
| `--muted-foreground` on `--card` / `--background` | 7.2:1 / 7.0:1 | ✅ AA text |
| `secondary-foreground #0a0808` on `secondary #52d053` | 10.0:1 | ✅ AA text |
| `#ffffff` on `primary #765898` / `tertiary #c62a3e` | 5.8:1 / 5.5:1 | ✅ AA text |
| `--tertiary-text #e0485c` on `--background` / `--card` | 5.0:1 / 5.2:1 | ✅ AA text |
| `--ring` on `--background` / `--card` | 6.2:1 / 6.4:1 | ✅ 1.4.11 focus (2px solid) |
| `--destructive-foreground` on `--destructive` fill | 4.6:1 | ✅ AA text |
| `primary #765898` on `--background` / `--card` | 3.5:1 / 3.6:1 | ⚠️ non-text only; **banned as text** |
| `tertiary #c62a3e` on `--background` / `--muted` | 3.6:1 / 3.1:1 | ⚠️ non-text only (strokes, underlines); **banned as text** |
| Status colors (`destructive/success/warning/info`) on `--card` | 3.3–3.7:1 | ⚠️ non-text only (icons, fills); **banned as text** |
| Glow core `rgba(118,88,152,.4)` on `--background` | ≈2.0:1 | ❌ never the focus indicator (decorative only) |

---

## Component tokens

### Button

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `variant` | `default \| outline \| ghost \| destructive` | `default` | See styling table. (`brand` variant removed — it was byte-identical to `default`; Resolved #11) |
| `size` | `xs \| sm \| default` | `default` | Panels use `sm`; utility rows use `xs` |

| Variant | Styling | Use |
|---------|---------|-----|
| `default` | solid `bg-primary text-primary-foreground` | The view's focal action (rare — one per surface). **The single codified exception to monochrome-default; `variant="default"` IS the brand opt-in for buttons** |
| `outline` (secondary) | `border-secondary text-secondary hover:bg-secondary/10` | **Default secondary action** (Add provider, Compare models, Create draft, Preview, Set default) |
| `outline` (neutral) | `border-border` | Tertiary affordance only |
| `ghost` | `text-foreground hover:bg-muted` | Utility rows (URL bar ops, open in browser) |
| `destructive` | fill `--destructive`, text `--destructive-foreground` | Destructive confirmation only |

### Switch

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `size` | `sm \| default` | `sm` in panels | Monochrome states: **on = track `bg-foreground`, thumb `bg-background`; off = track `bg-muted`, thumb `bg-background border-border`**. `color="brand"` opt-in → on-track `bg-primary` |

### Input / Select

| Component | Notes |
|-----------|-------|
| `Input` | `h-8 text-xs` in settings; monochrome `border-input`; used for API keys, base URLs, search. **Error state (`aria-invalid`): `border-destructive` + caption `text-muted-foreground text-xs`** (optional destructive icon — raw destructive text is banned) |
| `Select` | shadcn `SelectTrigger/Content/Item`; monochrome; used for format choices, model pickers |

### Tabs

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `variant` | `default \| line` | `default` | `line` + `color="tertiary"` = underlined section tabs |
| `color` | `tertiary \| ...` | monochrome | Explicit opt-in |
| Tab labels | `text-xs` | — | Settings sections, memory Overview/Records. **`line` + tertiary: underline 2px `bg-tertiary` (non-text ✓); active label stays `text-foreground`** (story-verified — tabs.tsx `after:bg-tertiary`; label never tinted) |

### Dialog

Confirmations only (publish, remove provider, clear memory, account). Destructive actions get destructive-styled confirm button. No nested dialogs.

### Alert

| Variant | Styling | Notes |
|---------|---------|-------|
| `info` (+ `AlertTitle`, `AlertDescription`, `AlertAction`) | Surface `bg-card border border-border`; icon per variant token (non-text ✓); Title `text-sm font-medium text-foreground`; Description `text-sm text-muted-foreground`; Action = `outline`(secondary)/`sm` | Inline notice pattern (e.g. model comparison prompt bar). No dismiss-by-default. **Icon color only — never tint the text with the variant color** |

### Chip / badge

`rounded border border-border px-1.5 py-0.5`, 9.5–10px uppercase. Built-in skills etc. Use `bg-muted` variant for emphasis inside cards. (The provider model list's default-model marker is NOT a chip — it's the ★ star indicator; see Provider panel section.)

### Settings nav

Sidebar item: icon + label, active = **`bg-accent/10 text-foreground`** (story-verified — MitsuSettings nav row; the sidebar-accent alternative is dropped), hover `bg-muted`, no dividers between items.

### MitsuDocViewer

`{ title: string; html: string; onOpenInBrowser: () => void }` — sandboxed `srcDoc` iframe for local HTML docs (moodboard/prototype); "open in browser" ghost/xs button. Never iframe remote URLs.

### MitsuBrowserBlock (pilot publish console)

`{ siteName, repo, liveUrl, draftUrl, draftSha?, liveSha?, lastPublished?, onPublish?, onRollback?, onOpenInBrowser? }` — URL bar (ghost/xs ops), draft/preview buttons (outline/sm secondary), Publish (**`default`/xs** — solid primary focal), rollback (ghost/xs destructive), status line: `sha` in mono + time (structural border-t footer). Publish always behind a confirm Dialog.

### Provider panel (Block #1) — model list state

- Empty states (no providers / no models): centered `py-3` block, `text-sm text-muted-foreground`, optional `outline`(secondary)/`xs` action.
- Selected model/provider row: **`bg-primary/5`** (story-verified — not muted), hover `bg-muted/60`; model name in mono.
- Default model: **★ star indicator** (ghost/xs, `hover:text-foreground` — story-verified marker), model name in mono.
- Set-default / keep actions: `outline`(secondary)/`xs`.

---

## Migration map (story → block)

| Story (claire-ai Storybook) | Mitsu block | Status |
|------------------------------|-------------|--------|
| `Patterns/Mitsu provider panel` | Block #1 — provider settings right panel | Prototype done, not implemented |
| `Patterns/Settings → Mitsu MVP settings` | Block #2 — Settings shell (Profile + S1–S8) | Prototype done 2026-08-10 |
| `Patterns/Mitsu doc viewer` | Web embed preview | Prototype done |
| `Patterns/Mitsu browser block` | Pilot publish console (epic 07) | Prototype done |
| `Theme/Brand → Mitsu theme` | Theme source for this file | Reference |

Shared components are **vendored into Mitsu** (resolved 2026-08-11, epic 09 §9): each story component is ported as production code into the Mitsu repo — no runtime dependency on claire-ai. Remove the duplicate Claire-era `Patterns/Settings` (BetaSettings) title when migrating.

---

## Resolved inconsistencies (Kimi K3 audit, 2026-08-11)

1. **claire-ai DESIGN.md top palette is stale** (light coral `#FAA0A0` / dark periwinkle `#7C8CFF` as primary). **RESOLVED:** follow globals.css; dark primary `#765898` is canonical.
2. **`tokens.ts COLORS_DARK`** still carries legacy blue `#7C8CFF`. **RESOLVED:** port `#765898` triad into Mitsu; do not extend legacy aliases.
3. **Radius conflict** (claire DESIGN.md sm 4/md 6/lg 8 ≠ tokens.ts RADIUS xs 6/sm 8/md 12/lg 16/xl 16 ≠ Tailwind sm 4.8/md 6.4/lg 8). **RESOLVED:** Tailwind mapping (what renders) is canonical; **tokens.ts RADIUS is retired**, including its stale `xl 16 = lg 16` entry.
4. **Type scale conflict** (tokens.ts FONT.xl 1.25rem vs claire DESIGN.md `--text-xl` 1rem; h1–h4 uncodified). **RESOLVED:** tokens.ts FONT + h5/h6 canonical; h1–h4 codification is a **Block #2 gate**.
5. **Shadows** (`--shadow-sm/md/lg` documented but undefined in globals.css). **RESOLVED:** deleted from dark scope; elevation = card + border + optional glow; Light EVA may reintroduce.
6. **Theme story `--tx-*` grays** (`#0a0808`/`#100d0d`/…) slightly warmer than oklch neutrals. **RESOLVED:** oklch values canonical; `--accent` re-expressed as `oklch(0.16 0.02 55)` / `oklch(0.94 0.02 55)`.
7. **Candy badge colors** (`--color-badge-*`). **RESOLVED:** kept; rule 1 amended to document the exception family.
8. **Hover contradiction (new):** documented hover hexes (`#9370b8`/`#6ede63`/`#e0462c`) are inconsistent with the stated `color-mix` formula (a 5% foreground mix cannot produce the documented lightness/hue — e.g. `#e0462c` differs in hue from `#c62a3e`, and mixing with white preserves hue). **Source-verified 2026-08-11:** `#9370b8` exists nowhere in the repo; the real hover constants live in tokens.ts as **legacy** entries (`primaryHover: #6B7BFF` — still legacy blue!, `secondaryHover: #6ede63`, `tertiaryHover: #e0462c`), and no Mitsu story uses a hex hover. **RESOLVED:** hex row + formula deleted; **opacity overlays only** (`/80` solid primary, `/10` outline-secondary, `bg-muted` ghost, `/60` list rows — per vendored primitive + stories); tokens.ts hover constants are dead for Mitsu.
9. **Focus-ring contrast (new):** `--ring: var(--primary)` + glow: solid primary is 3.5:1 (passes 3:1 only as a ≥2px solid) but the 40%-alpha glow core is ≈2.0:1 — fails WCAG 1.4.11 and the draft's own "never color alone" rule. **Source-verified 2026-08-11:** primitives render `focus-visible:ring-3 ring-ring/50` (≈2.2:1 — fails); custom inputs use `focus:border-primary` only (no ring). **RESOLVED:** dedicated `--ring: oklch(0.66 0.11 292)` (6.2:1, 2px solid); glow is decorative only. **The vendored port must drop the `/50` alpha and use solid `--ring` in Button/Input/Switch focus-visible classes — this is the one deliberate deviation from the reviewed story render, and it only lands if the port implements it.**
10. **Feedback-as-text contrast (new):** all four status colors fail 4.5:1 on card as text (3.3–3.7:1). **RESOLVED:** status colors are non-text only (icons/fills/borders); status text uses neutral tokens; destructive button text uses `--destructive-foreground` (4.6:1 ✓).
11. **Button `default` vs `brand` (new):** two variants rendered byte-identical (`bg-primary`), an ambiguity that invites misuse. **Source-verified 2026-08-11:** every solid focal button in the Mitsu stories uses `variant="brand"` (~10 sites: Save, Publish, Authorize, Open account, Create project…); `variant="default"` (no variant prop) is used exactly once ("Create skill"). **RESOLVED:** `brand` variant deleted; `variant="default"` = solid primary per shadcn convention is the single codified exception to monochrome-default; **the vendored port renames the story's `brand` call sites to `default`** (mechanical, ~10 sites); `color="brand"` remains the opt-in for non-button controls. (Direction differs from the audit's proposal — shadcn convention wins over keeping a claire-ai custom variant; the port rewrites these components anyway.)

---

## Guidelines (quick rules)

- Controls default monochrome; `color="brand"` / primary tints are explicit opt-ins. **Button `default` (solid primary) is the one codified exception.**
- Secondary actions = outline + `border-secondary text-secondary hover:bg-secondary/10`; neutral `border-border` outline is tertiary-only.
- No row separators in settings/panels — spacing does the work.
- Role tokens only; never raw hex; no new legacy aliases. **Triad/status colors as text: only `--tertiary-text`; everything else is non-text (see Contrast table).**
- Focus visibility = 2px `--ring`; glow is decoration, never the indicator.
- One focal action per view; destructive always behind confirm.
- Components reference CSS variables only — no hex literals (Light EVA readiness).
- No bounce easing; respect `prefers-reduced-motion`.
