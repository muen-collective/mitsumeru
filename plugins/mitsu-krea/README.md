# @muen/mitsu-krea — fork plugin

Image generation via **Krea 2**, Path B: a Mitsu plugin whose host half calls
Krea's hosted REST API directly and writes the resulting image(s) into the
**local Assets folder** (`MITSU_PROJECT/assets`, default `~/Mitsu/assets`) — the
visible, durable copy. No Cloudinary; the local file is the source of truth.

## What it is

| Half | File | Role |
|---|---|---|
| Host | `lib/index.js` | Reads `KREA_API_KEY` (or `KREA_API_TOKEN`) **from env only — never sent to the client**. Exposes `mitsu.krea` service + `/mitsu/krea/*` routes: submit → poll → write into Assets. |
| Client | `lib/client.js` | `__MITSU_RAIL__` surface **`krea`** ("Krea"): prompt form + model/aspect/resolution pickers + result grid. The image lands in `~/Mitsu/assets`, so the Assets surface shows it too. |
| Manifest | `package.json` + `cordis.patch.yml` | `dsh.client` declaration + profile bundle patch. |

## Host contract (verified against Krea's OpenAPI)

```
POST https://api.krea.ai/generate/image/krea/krea-2/<size>
     { prompt, aspect_ratio?, resolution?, seed? }   → { job_id, status }
GET  https://api.krea.ai/jobs/{id}                   → { status, result:{ urls:[...] } }
auth: Authorization: Bearer <KREA_API_KEY>
```

Models: `krea-2-medium`, `krea-2-large`, `krea-2-medium-turbo`, `krea-2-large-turbo`.
Statuses: `backlogged|queued|scheduled|processing|sampling|intermediate-complete|completed|failed|cancelled`.

## Routes (loopback-only, same hygiene as mitsu-docs)

| Route | Method | Purpose |
|---|---|---|
| `/mitsu/krea/generate` | POST | `{ model, prompt, aspect_ratio?, resolution? }` → polls → writes to Assets → returns `{ ok, files, jobId }`. |
| `/mitsu/krea/models` | GET | the supported Krea 2 model set. |
| `/mitsu/krea/status` | GET | `{ ok, keyConfigured, assetRoot }`. |

## Secret handling

`KREA_API_KEY` is read host-side only (`process.env`). It never reaches the
browser; an absent key returns a clear "set KREA_API_KEY" error from both the
status route and the generate route.

## Install (survives restarts)

```bash
dsh plugin --profile mitsu add /Volumes/External\ SSD/mitsu-dsh/plugins/mitsu-krea
```

Then restart the harness and export the key, e.g.:

```bash
export KREA_API_KEY=sk-...
```

Settings → the right dock **Krea** surface shows the generator.
