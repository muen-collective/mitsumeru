# @muen/mitsu-starter-pack — fork plugin

The **"Creative workflows"** settings section. **Placeholder** — the creative-workflow
runner is designed next, and will tie into the **git JSON workflow versioning** model
(one versioned workflow definition per file; the harness reads, versions, and runs it).

## What it is now

| Half | File | Role |
|---|---|---|
| Host | `lib/index.js` | Provides the `mitsu.pack` service **name** (seam only; no active networking). `ready: false` until the versioned-workflow runner lands. |
| Client | `lib/client.js` | `__ModuleLoader__` bundle registering `settings.section` **`mitsu-pack`** (order 14, "Creative workflows"): a placeholder card that states the surface is coming and leaves the seam in place. |
| Manifest | `package.json` + `cordis.patch.yml` | `dsh.client` declaration + profile bundle patch. |

## Why it's a placeholder

The **fashion starter pack** (RunningHub restore → person-swap → preserve-garment →
variations) is **not** the need. The direction is: publish creative workflows on RunningHub
and run them versioned.

- The **RunningHub adapter** (submit v2/legacy + poll + URL verification) is deferred until
  the versioned-workflow runner is designed.
- **No key, no external API** is read in this host half yet.

## The seam (for the next milestone)

The versioned-workflow process is designed later, but the intended shape:

1. Each workflow is a **versioned JSON definition** in the repo (git = source of truth).
2. The harness reads a workflow, resolves its **runner** (e.g. RunningHub AI app / ComfyUI),
   and exposes run + status.
3. The "Creative workflows" section lists the versioned workflows and runs them.

The `mitsu.pack` service name and the `settings.section` mount are already in place so the
runner slots in without a profile change.

## Design reference (ratified)

The RunningHub integration model is captured in
`/Volumes/External SSD/mitsu/docs/initiatives/runninghub-integration.md`. **No Mitsu
wallet** — each user runs Creative workflows on their own RunningHub account, billed to
their own coins/wallet; Mitsu is the library + launch surface, and the one-time human step
is *copy a workflow ID → open it in your RunningHub workspace.* The git-JSON recipe stays
**concurrency-agnostic** (tier/min-concurrency inferred at run time from the user's own
account).

**Scope held for the design session:** the actual recipe schema, the runner, and any
RunningHub adapter are NOT built here — this stays a placeholder seam until that session.

## Install (survives restarts)

```bash
dsh plugin --profile mitsu add /Volumes/External\ SSD/mitsu-dsh/plugins/mitsu-starter-pack
```

Then restart the harness. Settings → **Creative workflows** shows the placeholder.
