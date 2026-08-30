# @muen/mitsu-settings — fork plugin (Epic 3)

The **client-safety layer** of the Mitsu product, as a fork plugin beside `mitsu-rail` and
`mitsu-modes`: two additive Settings pages that keep non-coder personas away from raw DSH
configuration. Same raw-JS shape as the other Mitsu surfaces; host half provides the data over
loopback-guarded `webServer` routes that the browser half fetches.

## What it is

| Half | File | Role |
|---|---|---|
| Host | `lib/index.js` | Provides the `mitsu.settings` service (curated catalog + toggle state, raw composed-plugin table via the Cordis `loader`) and registers `/mitsu/settings/list`, `/mitsu/settings/plugins`, `/mitsu/settings/toggle` (loopback-only, no forwarded headers). |
| Client | `lib/client.js` | `__ModuleLoader__` bundle registering two **additive** `settings.section` entries. |
| Manifest | `package.json` + `cordis.patch.yml` | `dsh.client` declaration + profile bundle patch (fork spike shape). |

## The two sections (Epic 3.1–3.4)

| Section (`settings.section` id) | Order | Contents |
|---|---|---|
| `mitsu-plugins` | 12 | **3.1** the Mitsu Plugins section. **3.2** curated plugin cards (name + description) with an enable/disable toggle; a card also reports whether that plugin is actually composed. |
| `mitsu-advanced` | 45 | **3.3** the Advanced section behind a reveal toggle. **3.4** surfaces the raw composed-plugin table (Cordis loader entries) read-only, and points the engineer persona to the shipped raw surfaces (Models, Agent presets, Market, full plugin inventory). |

Both use the `settings.section` **additive** slot (`replaceRisk: none`) — nothing shipped is
shadowed or deleted ("bury, don't delete" from `docs/plans/gap-analysis-dsh-settings.md`).

## Install (survives restarts)

```bash
dsh plugin --profile <profile> add /Volumes/External\ SSD/mitsu-dsh/plugins/mitsu-settings
```

Installed as a link dependency and added to `dsh.profile.bundles`, so the bundle patch composes
on every boot. **Restart the harness after install** — the loader reads the profile bundle list
at boot; the `/mitsu/settings/*` routes 404 until then. Boot gate: open the Settings panel;
**Mitsu Plugins** and **Advanced** appear as sections.

## Verified

Verified live on stock `dsh --profile web --port 3082` (2026-08-30): routes return the curated
catalog / raw loader table, the in-UI toggle round-trips through the host, and both sections
render additively beside the shipped ones. The same seam holds in the fork (identical settings
surface); re-verify after the fork is built and booted with this plugin composed.

## Relationship to the rest of the fork

- **Epic 3** on the Mitsu roadmap: the client-safety layer that unblocks client profiles
  (expose the curated set, bury the raw config).
- Sits beside `mitsu-modes` / `mitsu-rail` as a settings surface; does not touch the rail's
  `window.__MITSU_RAIL__` surface registry — it is a Settings-panel concern.
- This plugin does **not** gate actual Cordis loader enable/disable (the shipped inventory is
  read-only); "enable/disable" here is a Mitsu-curated per-workspace preference.

## Follow-ups (next slices)

1. **Durable toggle persistence.** Toggle state is process-local for this slice; persist it
   through the `settings` service (`register` a `mitsu.plugins` namespace) so it survives restart
   and is per-brand.
2. **Per-brand visibility filter.** Drive which shipped sections (`models`, `agent-presets`,
   `market`, `plugins` inventory) show in the default nav vs. inside Advanced, per brand profile.
3. **Full raw inventory with state.** The Advanced table already carries `enabled`/`phase` per
   entry; surface it (currently read-only) once the loader exposes a write path.
