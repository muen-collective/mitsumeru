// @muen/mitsu-open-in-sidebar — browser half.
// Routes chat file mentions (inline-code path tokens, e.g. `docs/foo.md`) into the
// dsh-better-sidebar editor instead of the OS default app.
//
// How it works: DSH's chat renders a file mention by calling the registered
// `ctx.chatFileMentions` provider's `resolve(value)`, which returns an opener
// `{ open, label, title }`. The `open` callable IS the click handler. We provide a
// provider whose `open` calls `ctx.betterSidebar.openFile(scope, value)` — so a
// click opens the file in the better-sidebar. Non-file tokens stay inert (undefined).
//
// Requires the `dsh-better-sidebar` plugin (peer). It is a no-op / fails to activate
// without it — the "build a plugin that works with better-sidebar" pattern.
window.__ModuleLoader__.load({
  id: '@muen/mitsu-open-in-sidebar',
  factory: (require) => {
    // A token looks like a file path we'd want to open in the sidebar: a known
    // extension, or contains a path separator. Heuristic; tune the ext list.
    const looksLikeFile = (value) =>
      /\.(md|mdx|ts|tsx|js|jsx|css|json|yml|yaml|html|svg|txt|png|jpe?g|webp|gif|mp4|mov|pdf|py|sh)$/i.test(value) ||
      /[/\\]/.test(value)

    // Derive the better-sidebar scope (the sidebar of the session the mention came
    // from). The owner carries the closing-Turn identity — best-effort; the service
    // falls back to the current session when scope cannot be resolved. Verify the
    // exact `owner.turn` field at runtime.
    const scopeOf = (owner) => {
      try {
        return owner && owner.turn ? owner.turn.sessionId : undefined
      } catch {
        return undefined
      }
    }

    return {
      inject: ['betterSidebar'],
      apply(ctx) {
        ctx.chatFileMentions = {
          forClosing(owner) {
            return {
              resolve(value) {
                if (!looksLikeFile(value)) return undefined
                const scope = scopeOf(owner)
                return {
                  open: () => (typeof ctx.betterSidebar?.openFile === 'function'
                    ? ctx.betterSidebar.openFile(scope, value)
                    : owner?.openFile?.(value)),
                  label: value,
                  title: value,
                }
              },
            }
          },
        }
      },
    }
  },
})
