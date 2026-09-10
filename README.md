# asuka

Our own Electron shell around a DSH release — **asuka** is the codename; it becomes
`mitsumeru` once the wrap proof is accepted (Epic 86 § Naming).

Proves the Epic 86 thesis: when DSH ships a release, we study it, wrap it in *our* shell,
and ship — without waiting on DSH Desktop, and without forking anything of theirs.

## Layout

```
packages/asuka/          the shell (Electron main + preload + splash renderer)
packages/asuka/README.md bundle strategy: how the harness gets in, how to bump DSH
```

Single package for now. The `packages/*` shape is what a future Mitsu product monorepo
expects, so this folder drops in unchanged.

## Commands

```
pnpm install
pnpm build        # electron-vite build → packages/asuka/out
pnpm start        # electron-vite dev, harness spawned as a child process
pnpm smoke        # run the built app, assert harness booted + UI loaded, quit
```

## Where things are documented

- Epic 86 (this work): `~/.kun/mitsu/product/epics/86-wrap-dsh-release-in-electron.md`
- Task breakdown + measured contract: `~/.kun/mitsu/product/epics/86-task-breakdown.md`
- Release study + harness-artifact decision: `~/.kun/mitsu/product/dsh-releases/v0.1.5-alpha.2.md`
- Wrap process spec: `~/.kun/mitsu/product/electron-wrap-process.md`

## Rules that bind this repo

- **The harness is never forked or vendored as source.** It arrives as a published npm
  package, pinned by version (see `packages/asuka/README.md`).
- **App identity lives in one module** — `packages/asuka/src/shared/identity.ts` plus
  `packages/asuka/package.json`. A rename must stay a one-file change until the first
  public release, after which the identity is frozen.
- **Builds are `-dev` until promoted.** Downloads, release notes and CTAs carry the
  `-dev` suffix; it comes off only when a build is published to real users.
