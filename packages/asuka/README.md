# asuka — the shell

Electron main process that spawns a DSH harness as a child, waits for its readiness line,
then loads it into a locked-down window. Nothing of the harness is imported into this
process; the contract is process-to-process (Epic 86, measured in `artifacts/entry.json`
of the pilot).

```
src/main/index.ts       window, lifecycle, single-instance lock, lockdown, link policy, probes
src/main/harness.ts     spawn / readiness / shutdown of the harness child
src/main/updater.ts     update client — schedule, feed, archive, IPC (T12)
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

### Packaging (macOS)

```
pnpm package:dir     # release/mac-arm64/Asuka.app — runnable in place
pnpm package:mac     # release/*.dmg + *.zip
```

Four things make the packaged app different from `pnpm start`:

- **`asar: false`.** The harness is executed by node as a child process, so its files
  cannot live inside an asar archive. electron-builder warns about this; the warning is
  the design.
- **The harness travels as a resource, not as app dependencies.** `scripts/prepare-harness.sh`
  materializes the published closure into `Resources/harness/node_modules/` — a real-file,
  symlink-free tree (hoisted linker), because electron-builder copies resources as plain
  files and pnpm's workspace layout is a symlink farm. The script then compares the tree
  against the closure this workspace already resolved: a re-resolution that drifts fails
  the build instead of shipping. `src/main/harness.ts` looks there when `app.isPackaged`.
- **The stage install runs outside the repo.** `pnpm install` from anywhere inside a
  workspace member operates on the whole workspace; staged inside the package, a `--prod`
  install strips that package's own devDependencies.
- **No `node` on `PATH`.** Launched from Finder the PATH is minimal, so the shell falls
  back to Electron-as-node (`ELECTRON_RUN_AS_NODE=1` + `process.execPath`) rather than
  shipping a second runtime. In dev it still uses the node that launched it.

Identity is checked, not assumed: `pnpm check:identity` asserts that `electron-builder.yml`
and `package.json` still agree with `src/shared/identity.ts` — a half-finished rename fails
the build. It also asserts the update feed in the builder config is the feed in the module,
and that no upstream feed (dshdesktop.com) is configured anywhere.

### Signing + notarization (macOS, T10)

```
pnpm package:mac                    # signed build; dmg + zip in release/
pnpm verify:release                 # codesign --verify --deep --strict, spctl, stapler
NOTARY_PROFILE=asuka-notary pnpm notarize   # notarytool submit + staple, then repackage
```

The `asuka-notary` profile is stored once, by notarytool — never in the repo:

```
pnpm store:credentials               # asks for your Apple ID, then the password
```

That wrapper exists because the raw `notarytool store-credentials` one-liner is hostile to
paste: its `<apple id>` placeholders are redirection operators in zsh, so a verbatim paste
dies with a parse error before notarytool is ever reached — a shell error that reads like a
credential error. The wrapper asks for the email address only, reads the team ID back out of
the signed app, and lets notarytool prompt for the app-specific password with hidden input,
so the secret never enters shell history, `ps`, or any argv. `store-credentials` validates
before saving by default, so a wrong password fails there rather than 40 minutes into a
submission. A working profile is proved by an authenticated call
(`xcrun notarytool history --keychain-profile asuka-notary`), not by `security
find-generic-password` — that lookup reports "item could not be found" for this profile
even while notarization works (verified 2026-09-10).

The signing identity is never written into the config: electron-builder takes it from the
environment or the login keychain (`CSC_NAME`, `CSC_LINK`, `CSC_KEY_PASSWORD`) and fails
when neither has one. What matters afterwards is *who actually signed*, so
`pnpm verify:release` reads it back out of the artifact.

Measured 2026-09-10, and the reason there is no dev-only signing shortcut left: a full
`--dir` build with real timestamps and **nothing skipped** takes 1 m 51 s. The harness tree
is 24 445 files but only **10 are Mach-O** — the rest are data, sealed by the outer bundle
signature. All 10 come out signed by the Developer ID with a secure timestamp. An earlier
profile skipped the harness (`signIgnore`) and dropped timestamps (`timestamp: none`) to
avoid a 40-minute build; that measurement did not reproduce, and both settings are gone.

`pnpm notarize` is a separate step on purpose. Order: notarize + staple the app, then
repackage dmg + zip **from the stapled app**, then notarize + staple the dmg. A zip cannot
be stapled afterwards, and regenerating it would invalidate the checksum recorded in
`latest-mac.yml` — so the ticket has to be inside the archive before the archive exists.
Without credentials the step exits 2 with instructions; it never silently skips, and a
signed-but-unnotarized build is reported as exactly that (`spctl`: `Unnotarized Developer ID`).

### Release labeling (T11)

Internal builds carry `-dev` in the version, and the suffix travels with them everywhere:
artifact filenames (`Asuka-0.1.0-dev-arm64.dmg`), the About panel, the startup log, the
update channel (`dev-mac.yml`), and any download link or release note that points at them.
It comes off only when a build is promoted to production/public users.

```
pnpm check:label                # internal build: -dev must be present and match the artifacts
PROMOTE=1 pnpm check:label      # release: the suffix must be gone
```

The version lives in `package.json`; the About panel reads it at runtime through
`app.getVersion()` (never a hardcoded string in the preload), so a running app cannot claim
a version its artifact does not carry. The same suffix drives the update channel: with
`0.1.0-dev` the package step writes `release/dev-mac.yml` and the app-embedded
`app-update.yml` says `channel: dev`; a promoted `0.1.0` build writes and asks for
`latest-mac.yml`.

### Updates (T12)

`electron-updater` against **our** feed (`UPDATE_FEED_URL`), packed by electron-builder into
`Contents/Resources/app-update.yml` (`provider: generic`; `channel: dev` for a `-dev` build,
so the feed publishes `<url>/dev-mac.yml` and the artifact it names). Client behaviour:

| | |
|---|---|
| Startup check | 15 s + 0–5 s jitter — a fleet does not stampede the feed |
| Cadence | every 6 h while the app stays open |
| After a failure | 30 min retry (offline launch retries instead of waiting half a day) |
| After sleep | check again 5 s after resume |
| On demand | `asuka:update-check` IPC + `Check for Updates…` menu item |
| Install | on quit, never mid-session — the harness holds the user's work |
| Rollback | every downloaded version is archived to `<userData>/updates/<version>/`, and `allowDowngrade` lets an older archive be installed over a newer one |

An unreachable feed is a logged line, never a crash and never a blocked startup: the harness
boots offline. `pnpm smoke:updater` runs the packaged app against a stand-in feed and asserts
the request, the jittered delay, the parse, the 6 h cadence, and the offline path.

### Environment knobs

| Variable | Purpose |
|---|---|
| `ASUKA_DSH_ENTRY` | Spawn a different harness entry (drill seam) |
| `ASUKA_DSH_HOME` | Harness state dir; defaults to `<userData>/mitsu-dsh` |
| `ASUKA_LOG_DIR` | Harness log dir; defaults to `<userData>/logs` |
| `ASUKA_UPDATE_FEED` | Point the updater at a different feed (test seam; the packaged `app-update.yml` is authoritative) |
| `ASUKA_UPDATE_DISABLE=1` | Start with no updater at all |
| `ASUKA_SMOKE=1` | Quit once the harness UI reports loaded (used by `pnpm smoke`) |
| `ASUKA_SCREENSHOT=1` | With smoke: capture a screenshot to `artifacts/` before quitting |

State lives under Electron's `userData` (Epic 86 T8: `<userData>/mitsu-dsh` — picked once,
never renamed), and `userData` itself is pinned by name (`app.setPath('userData',
join(app.getPath('appData'), 'Asuka'))`) so a display-name change cannot strand state or
land on the shipped Mitsumeru app's profile. `~/.dsh` is never touched.

### Open items (recorded, not yet resolved)

- **Native postinstall scripts.** pnpm denies `node-pty`, `koffi`,
  `@deepseek-ai/dsh-subprocess-local`, `@google/genai`, `protobufjs` by default
  (`pnpm-workspace.yaml → allowBuilds`). The stock `web` profile boots without them;
  terminal/subprocess features may need them built, and `node-pty` needs a per-arch,
  per-Electron-ABI build. Verify before packaging (T9).
- **Branding title.** The published tarball serves `<title>DeepSeek Harness</title>`; a
  frontend built from a checkout says `<title>DSH Local Build</title>`. Both are accepted
  by `HARNESS_TITLES` — confirm which surface the brand swap targets (Epic 80/85).
- **Signing cost — resolved 2026-09-10 (T10).** The 40-minute build did not reproduce: a
  full `--dir` build with timestamps on and nothing skipped is 1 m 51 s, and the harness's
  10 Mach-O files come out signed and stamped. `signIgnore` and `timestamp: none` are gone;
  see README § Signing + notarization.
