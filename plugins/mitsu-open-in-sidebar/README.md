# @muen/mitsu-open-in-sidebar

Open chat **file mentions** (inline-code path tokens, e.g. `` `docs/plan.md` ``, `` `email.html` ``)
in the [dsh-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar) editor instead of the
OS default app — the **Codex pattern** (click a file path → it displays in the sidebar).

## Why

DSH renders a file mention by calling the registered `ctx.chatFileMentions` provider's
`resolve(value)`, which returns `{ open, label, title }` — and `open` **is the click handler**.
By default the chat routes that open to the OS default app (`shell.openPath` → TextEdit for
`.md`). This plugin provides a `ctx.chatFileMentions` whose `open` calls
`ctx.betterSidebar.openFile(scope, value)` instead — so clicking a file mention opens it in the
better-sidebar. That's the behavior you see in Codex: click → display in the sidebar.

## Requirements

- **`dsh-better-sidebar`** (peer). Without it this plugin does not activate — the "build a plugin
  that works with better-sidebar" pattern.

## Behavior

- A token that looks like a file path (`.md`, `.html`, `.tsx`, images, etc., or contains `/\`)
  → opens in the better-sidebar (the right viewer is chosen by extension: markdown viewer for
  `.md`, sandboxed HTML viewer for `.html` — the formatted-HTML-email case — image viewer for
  images, editor otherwise).
- Anything else → stays inert code (unchanged).
- Deduped (the better-sidebar editor tab reuses the same path).

## Test

- `` `docs/plan.md` `` → opens the markdown in the sidebar editor.
- `` `email.html` `` → renders the formatted HTML in the sidebar (sandboxed HTML viewer).
