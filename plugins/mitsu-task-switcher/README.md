# @muen/mitsu-task-switcher — fork plugin

Persistent **workspace/session switcher** in the ACTIVE chat header.

## Why

DSH's built-in workspace picker (the "task switcher") lives only in the **blank-session
Hero** (`conversation.hero.workspace` slot). Once a chat session starts, `hero` flips to
`false`, `HeroShell` unmounts, and the switcher disappears. This plugin re-registers a small
switcher into **`conversation.session.header.utilities`** — a slot that renders in the active
session header — so you can switch tasks without returning to the empty hero.

## What it is

| Half | File | Role |
|---|---|---|
| Client | `lib/client.js` | Raw-loader plugin; registers a "Tasks" button into `conversation.session.header.utilities`. Uses the slot-injected `sessionId`, `useSessions`, `useWorkspaces`, and `open(id)` (header inject face) to list workspaces → sessions and navigate. |
| Host | `lib/index.js` | Empty (client-only plugin). |
| Manifest | `package.json` + `cordis.patch.yml` | `dsh.client` declaration + profile bundle patch. |

## How it works

- **Uses the global + session hook face** the slot system provides (same as `ui-jobs`): the
  entry receives `sessionId`, `useSessions`, `useWorkspaces`, `t`, and the header inject face
  `open(id)` (`sessions.open`).
- Groups the workspace list, flattens each workspace's `sessionIds`, marks the current
  session/workspace, and navigates via `open(sessionId)`.

## Install (survives restarts)

```bash
dsh plugin --profile mitsu add /Volumes/External\ SSD/mitsu-dsh/plugins/mitsu-task-switcher
```

Restart the harness → in an active chat, the header shows a "Tasks" switcher.
