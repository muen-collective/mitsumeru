# asuka — the shell

Electron main process that spawns a DSH harness as a child, waits for its readiness line,
then loads it into a locked-down window. Nothing of the harness is imported into this
process; the contract is process-to-process (Epic 86, measured in `artifacts/entry.json`
of the pilot).

```
src/main/index.ts       window, lifecycle, single-instance lock, lockdown, link policy, probes
src/main/harness.ts     spawn / readiness / shutdown of the harness child
src/preload/index.ts    trusted-click → external-link IPC (the only browser-opening path)
src/shared/identity.ts  app identity — the one place the name lives
```

## Bundle strategy — the harness arrives as a published npm closure

**Decision (Epic 86 § Harness artifact, measured 2026-09-10):** the harness is a normal
dependency, pinned in `package.json`, and spawned from `node_modules`:

```
node node_modules/@deepseek-ai/dsh/lib/bin.js web --no-open --host 127.0.0.1 --port 0
```

```json
"dependencies": { "@deepseek-ai/dsh": "0.1.5-alpha.2" }
```

Why not the alternatives:

| Alternative | Why it fails |
|---|---|
| Copy `apps/cli/lib/` from a checkout | 248 KB of launcher that keeps bare imports of ~230 sibling packages — unrunnable alone |
| `"dsh": "file:../dsh/apps/cli"` | Its dependencies are `workspace:^` and the DSH root pins `link:vendor/*` overrides; neither resolves outside DSH's own workspace |
| Point at a built checkout | Works, but 1.7 GB and needs `pnpm install` + `build:lib` + `build:web` per release |

Measured on the npm path: `pnpm add @deepseek-ai/dsh@0.1.5-alpha.2` → 8 s, 276 MB, and the
harness boots byte-for-byte the same readiness contract as the built checkout.

### Bumping to a new DSH release

```
pnpm view @deepseek-ai/dsh dist-tags        # alpha / next / latest
pnpm --filter asuka add @deepseek-ai/dsh@<version>
pnpm build && pnpm smoke
```

The version is data, not code — no shell edit is needed to wrap a different release. For a
tag that never reaches npm, fall back to a checkout:

```
pnpm --filter dsh-python-runtime-closure deploy --prod /tmp/harness
ASUKA_DSH_ENTRY=/tmp/harness/.../lib/bin.js pnpm start
```

### Environment knobs

| Variable | Purpose |
|---|---|
| `ASUKA_DSH_ENTRY` | Spawn a different harness entry (drill seam) |
| `ASUKA_DSH_HOME` | Harness state dir; defaults to `<userData>/harness` |
| `ASUKA_LOG_DIR` | Harness log dir; defaults to `<userData>/logs` |
| `ASUKA_SMOKE=1` | Quit once the harness UI reports loaded (used by `pnpm smoke`) |
| `ASUKA_SCREENSHOT=1` | With smoke: capture a screenshot to `artifacts/` before quitting |

State lives under Electron's `userData` (Epic 86 T8: `<userData>/harness` — picked once,
never renamed). `~/.dsh` is never touched.

### Open items (recorded, not yet resolved)

- **Native postinstall scripts.** pnpm denies `node-pty`, `koffi`,
  `@deepseek-ai/dsh-subprocess-local`, `@google/genai`, `protobufjs` by default
  (`pnpm-workspace.yaml → allowBuilds`). The stock `web` profile boots without them;
  terminal/subprocess features may need them built, and `node-pty` needs a per-arch,
  per-Electron-ABI build. Verify before packaging (T9).
- **Branding title.** The published tarball serves `<title>DeepSeek Harness</title>`; a
  frontend built from a checkout says `<title>DSH Local Build</title>`. Both are accepted
  by `HARNESS_TITLES` — confirm which surface the brand swap targets (Epic 80/85).
