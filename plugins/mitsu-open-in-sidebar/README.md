# @muen/mitsu-open-in-sidebar

Open chat **file mentions** (inline-code path tokens, e.g. `` `docs/foo.md` ``) in the
[dsh-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar) editor instead of the OS
default app.

## Why

DSH renders a file mention by calling the registered `ctx.chatFileMentions` provider's
`resolve(value)`, which returns `{ open, label, title }` — and `open` **is the click handler**.
By default the chat routes that open to the OS default app (`shell.openPath` → TextEdit for
`.md`). This plugin provides a `ctx.chatFileMentions` whose `open` calls
`ctx.betterSidebar.openFile(scope, value)` instead — so clicking a file mention opens it in the
better-sidebar, the way other harnesses open MD in their own doc viewer.

## Requirements

- **`dsh-better-sidebar`** (peer). Without it this plugin does not activate — the "build a plugin
  that works with better-sidebar" pattern.

## Behavior

- A token that looks like a file path (known extension, e.g. `.md/.tsx`, or contains `/\`) → opens
  in the better-sidebar.
- Anything else → stays inert code (unchanged).
- Preserves the better-sidebar's editor tab (deduped by path).
