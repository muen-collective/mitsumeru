# @muen/mitsu-starter-pack — fork plugin

The **RunningHub adapter for the Fashion Starter Pack**: a curated set of RunningHub workflow
steps (`restore → person-swap → preserve-garment → variations`) with role-keyed inputs,
submitted and polled through RunningHub's open API, surfaced as an additive Settings section.

## What it is

| Half | File | Role |
|---|---|---|
| Host | `lib/index.js` | `mitsu.pack` service + the **PACK manifest** (the edit-me list of workflow steps and their RunningHub app IDs) + loopback routes `/mitsu/pack/list`, `/mitsu/pack/run`, `/mitsu/pack/status`. The RunningHub client is the same proven contract as `product/strategy/rh-run.mjs` (submit v2/legacy + poll + URL verification). |
| Client | `lib/client.js` | `__ModuleLoader__` bundle registering `settings.section` **`mitsu-pack`** (order 14, "Starter Pack"): per-step input URL fields, Run button, polling status, output image(s). |
| Manifest | `package.json` + `cordis.patch.yml` | `dsh.client` declaration + profile bundle patch. |

## Configure

1. **Set the key** in the harness environment (never in the repo, never returned to the client):

   ```bash
   export RH_API_KEY=your_runninghub_api_key
   ```

2. **Paste the RunningHub app IDs** into the `PACK` manifest at the top of `lib/index.js` —
   each step has an `appId` (and optional `api: 'v2' | 'legacy'`, `revision` pin). Until an
   appId is set, the step shows "appId not set" and the run returns a clear error instead of
   failing silently.

## Install (survives restarts)

```bash
dsh plugin --profile mitsu add /Volumes/External\ SSD/mitsu-dsh/plugins/mitsu-starter-pack
```

Then restart the harness. Settings → **Starter Pack**: pick a step, paste the input URLs
(`source_garment`, `identity_reference`, …), **Run** → the host verifies the URLs (HEAD-check —
expired signed URLs are the #1 batch killer), submits, and the client polls to completion and
shows the output image.

## Relationship to the rest of Mitsu

- The adapter is the executable form of the versioned-workflow model (`docs/product/06`) and the
  RunningHub lane of the HMU pipeline spec (`docs/plans/23`): inputs are role-keyed, revisions
  pinned, runs polled to a terminal state.
- It sits beside `mitsu-providers` (BYOK keys) — the pack is the *workflows* surface, providers
  is the *key/catalog* surface.
- The manifest + client are the "run buttons" Block R4 of the gap analysis
  (`docs/plans/gap-analysis-dsh-settings.md`).

## Follow-ups

1. **Known-good pins + wallet**: persist per-step revision pins and report RH task cost
   (`costTimeS`) to the wallet meter.
2. **Run manifests**: write `/mitsu/pack/run` through the `runninghub-manifest.ts` wrapper so
   every run lands in `product/strategy/data/runs/` (batch-diff debugging).
3. **Per-step params**: expose `seed`/`denoise` fields in the section instead of fixed defaults.
