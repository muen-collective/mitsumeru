# Initiative: Mitsu MVP on DSH

**Goal:** Ship a client-safe Mitsu product on the DSH fork, with a curated settings layer, mode-based agent workspaces, and first-class asset/doc/browser surfaces, without exposing DSH power-user internals to non-technical clients.

**Status:** Draft
**Owner:** Muen collective
**Base:** `feat/mitsu-foundation`

---

## Core principles

1. DSH core is the substrate. Mitsu owns the product layer.
2. Clients see curated Mitsu surfaces, not raw DSH internals.
3. Power-user features live behind Advanced.
4. Every surface is a plugin.
5. Assets, docs, browser, writing, and creation are reversible/optional.
6. Human documents live in visible folders, not hidden dotfolders.
7. Keep DSH message queue behavior — polish visuals only.
8. Tool calls compact after completion to reduce vertical noise.

---

## MVP scope

### Epic 1 — Brand & shell

- Replace DeepSeek brand with Mitsu brand mark (`Mitsumeru.`)
- Add slotable sidebar header
- Hide DSH pill handle, match left-tree drag behavior
- Full-screen settings modal
- Mitsu primary token applied to UI

### Epic 2 — Mode tabs

- Add `Code / Write / Create` tabs above composer
- Default mode: Code
- Mode state accessible to other plugins (`window.__MITSU_MODE__` or later a Cordis service)
- Code mode: project tree + agent loop + browser dock for localhost preview
- Write mode: left tree = `docs/`, center = agent loop, right = doc viewer
- Create mode: left tree = assets/tree, center = agent loop, right = assets/preview, composer shows workflow switcher instead of model selector

### Epic 3 — Settings

- Add `Mitsu Plugins` tab
- Keep `Advanced` tab behind toggle
- Advanced contains: raw plugin config, DSH plugin list, DSH presets, package management
- Normal clients see: General, Mitsu Plugins, Providers

### Epic 4 — Providers

- Replace DSH Models page with Mitsu provider panel
- Provider search/cards
- API key input + test
- Pull models via DSH LLM API
- Base URL editing
- Diffusion presets
- Persist through DSH settings/credentials APIs
- Hide DeepSeek first-run dialog; keep provider-agnostic onboarding

### Epic 5 — Right rail / workspace surfaces

- Right rail shell plugin
- Surface registry (`window.__MITSU_RAIL__`)
- Separate Cordis plugins:
  - Assets dock
  - Docs dock
  - Browser dock
- Dock panels push agent loop, resizable, stay attached to rail
- Avatar placeholder at rail bottom
- Internal panel resize handles
- Hide DSH details pill, keep invisible drag strip behavior

### Epic 6 — Assets dock

- Search
- Grid tiles
- Selection
- Bulk actions
- Asset detail (later)
- Asset picker integration with composer

### Epic 7 — Docs / Write workspace

- Visible project folder structure (`docs/`, `brand/`, `plugins/`, `assets/`, `.dsh/`)
- No hidden `.kun` for human docs
- Write mode maps left tree to `docs/`
- Doc viewer dock
- Git-friendly: docs tracked, `.dsh/` ignored

### Epic 8 — Browser dock

- Tabbed real browser
- Address bar
- Localhost default tab
- New/close tabs
- Sandboxed iframe

### Epic 9 — Composer pattern

- Keep DSH message queue behavior
- File/image upload primary
- Drag-drop
- Thumbnail preview
- Add from Assets action
- Natural-language prompt presets
- Command menu moved to Advanced/secondary

### Epic 10 — Tool-call compaction

- Completed tool calls collapse by default
- One-line action summary
- Result stats (files changed, +/−, tokens)
- Expand on click to full detail
- Review button for file edits
- Use DSH `conversation.chat.node` / `tool.call.toolview` slots

### Epic 11 — Advanced gating

- Toggle stored in settings/profile
- Default: off for clients
- On for Muen/dogfood profiles
- Advanced tab hidden when off

---

## Task breakdown

### Epic 1 tasks

- [ ] 1.1 Freeze Mitsu brand mark in EVA Storybook
- [ ] 1.2 Add `sidebar.header` slot and Mitsu header plugin
- [ ] 1.3 Hide pill, keep invisible drag strip
- [ ] 1.4 Full-screen settings panel CSS
- [ ] 1.5 Map Mitsu primary color tokens

### Epic 2 tasks

- [ ] 2.1 Add mode tabs plugin above composer
- [ ] 2.2 Define mode state service
- [ ] 2.3 Wire Code mode browser dock default open
- [ ] 2.4 Wire Write mode docs tree + doc viewer
- [ ] 2.5 Wire Create mode workflow switcher in composer
- [ ] 2.6 Hide DSH preset dropdown behind Advanced

### Epic 3 tasks

- [ ] 3.1 Add `Mitsu Plugins` settings section
- [ ] 3.2 Curate plugin cards with enable/disable
- [ ] 3.3 Add `Advanced` settings section behind toggle
- [ ] 3.4 Move DSH raw plugin config + presets to Advanced

### Epic 4 tasks

- [ ] 4.1 Finalize provider panel Storybook
- [ ] 4.2 Implement Mitsu provider panel plugin
- [ ] 4.3 Wire API key test via DSH LLM discovery
- [ ] 4.4 Wire base URL + model pull
- [ ] 4.5 Add diffusion presets
- [ ] 4.6 Remove DeepSeek onboarding dialog
- [ ] 4.7 Persist provider config through DSH APIs

### Epic 5 tasks

- [ ] 5.1 Add `rightDock` root slot
- [ ] 5.2 Build rail shell plugin
- [ ] 5.3 Add surface registry and separate surface plugins
- [ ] 5.4 Make dock panels resizable and attached to rail
- [ ] 5.5 Hide DSH details pill, keep strip
- [ ] 5.6 Add avatar placeholder

### Epic 6 tasks

- [ ] 6.1 Build assets grid/search UI
- [ ] 6.2 Selection + bulk actions
- [ ] 6.3 Asset detail (later)
- [ ] 6.4 Composer asset picker integration

### Epic 7 tasks

- [ ] 7.1 Document recommended project folder structure
- [ ] 7.2 Create `docs/` workspace mapping in Write mode
- [ ] 7.3 Doc viewer dock
- [ ] 7.4 Exclude `.dsh/` in git

### Epic 8 tasks

- [ ] 8.1 Tabbed browser UI
- [ ] 8.2 Address bar + navigation
- [ ] 8.3 Localhost default tab
- [ ] 8.4 Sandbox/security review

### Epic 9 tasks

- [ ] 9.1 Composer upload button + thumbnail
- [ ] 9.2 Drag-drop
- [ ] 9.3 Add from Assets
- [ ] 9.4 Keep DSH queue behavior
- [ ] 9.5 Move command menu to Advanced

### Epic 10 tasks

- [ ] 10.1 Define compact tool-call summary in Storybook
- [ ] 10.2 Register compact tool-call plugin into DSH slots
- [ ] 10.3 Collapse completed calls by default
- [ ] 10.4 Expand-to-detail behavior
- [ ] 10.5 File-edit summary + Review button

### Epic 11 tasks

- [ ] 11.1 Define Advanced toggle persistence
- [ ] 11.2 Hide Advanced for normal profiles
- [ ] 11.3 Keep Advanced visible for dogfood

---

## Definition of done

- Each Mitsu surface is a plugin
- No client-facing raw DSH config
- Human docs in visible project folders
- All surfaces work on start screen without a session
- Advanced hidden by default for clients
- DSH message queue preserved
- Tool calls compact after completion
- Fork remains upgradeable: plugins/patches/profiles only
