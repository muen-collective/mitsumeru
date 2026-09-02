# Install the Mitsu plugin bundle

This skill packages a script that installs the **curated Mitsu plugin bundle** into a DSH profile
via the standard DSH mechanism (`dsh plugin add` / Settings → Plugins), so plugins are:
- installed by the **market mechanism** (not a fixed bundled set),
- **removable** (they don't come back on restart — the script runs on demand, not on boot),
- **curated per repo** (edit the bundle list in the script).

> **Why not a fixed bundle?** Seeding a fixed plugin set that the app re-adds on restart fights
> the user's curation (a removed plugin reappears). A script you run on demand is the clean
> "curation as convenience" — install the curated set, then let the user remove/adjust via the
> market. (See the "don't bundle a fixed plugin set" principle.)

## Trigger

Run this when the user asks to **set up / install / stand up the Mitsu plugins** — e.g.
"set up mitsu plugins", "install the mitsu bundle", "onboard this client", "get the mitsu plugin
set", "add the mitsu plugins to this profile".

## How

1. **Pick the profile** (default `web`; the user's current profile, or the one named).
2. **Run the bundled script** (it loops the curated `@muen/mitsu-*` bundle and adds each by the
   market mechanism):
   ```bash
   bash skills/install-mitsu-bundle/scripts/install-mitsu-plugins.sh --profile <profile>
   # or, from a checkout:
   bash <skill-dir>/scripts/install-mitsu-plugins.sh --profile <profile>
   ```
   Add `--dry-run` to list what it would add without installing.
3. The script **skips already-installed** plugins (the loader/manifest is the source of truth),
   adds any missing, and reports the final set.
4. **After install, restart the harness/profile** (new bundles compose at startup).

## Notes

- **Source:** the script uses `@muen/<pkg>` from the registry (npm) by default, falling back to
  the `muen-collective/mitsumeru` fork (`github:...`) when not yet published. Set
  `MITSU_PLUGIN_SOURCE` to override.
- **Curate:** the `BUNDLE=(…)` list at the top of the script is the curated set — add/remove to
  match the client/collaborator.
- **Localization:** only add plugins that are localized or acceptably English; localize our own
  before publishing (see the packaging rule). Don't bundle fixed patches for a third-party plugin —
  prefer a localized alternative.
- **Not a fixed bundle:** running this once stands up the set; later removals (via Settings → Plugins)
  stick, because nothing re-adds them on boot.
