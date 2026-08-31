# @muen/mitsu-runninghub — fork plugin

Creative-workflow **runner** via RunningHub's open API (model-endpoint pattern).
Host reads `RH_API_KEY` **from env only — never to the client**, submits a task to
`/openapi/v2/{endpoint}`, polls `/openapi/v2/query`, and writes the output URLs into the
**local Assets folder** (`MITSU_PROJECT/assets`, default `~/Mitsu/assets`).

## What it is

| Half | File | Role |
|---|---|---|
| Host | `lib/index.js` | `mitsu.runninghub` service + `/mitsu/rh/*` routes. Reads `RH_API_KEY` / `RH_API_BASE_URL` from env. Submit → poll → write into Assets. |
| Client | `lib/client.js` | `__MITSU_RAIL__` surface **`runninghub`** ("RunningHub"): endpoint + params (JSON) + key check + result grid. |
| Manifest | `package.json` + `cordis.patch.yml` | `dsh.client` declaration + profile bundle patch. |

## Host contract (verified against the RunningHub API contract)

```
Base  https://www.runninghub.cn/openapi/v2     (RH_API_BASE_URL to override)
Auth  Authorization: Bearer <RH_API_KEY>
POST  {base}/{endpoint}    { ...params }  → { taskId }        (or task_id)
POST  {base}/query         { taskId }     → { status, results:[{url,outputType}] }
statuses: CREATE|QUEUED|RUNNING|SUCCESS|FAILED|CANCEL   (SUCCESS → urls in results)
```

## Routes (loopback-only)

| Route | Method | Purpose |
|---|---|---|
| `/mitsu/rh/status` | GET | `{ ok, keyConfigured, base }`. |
| `/mitsu/rh/run` | POST | `{ endpoint, params }` → submit + poll + write to Assets → `{ ok, files, taskId }`. |
| `/mitsu/rh/probe` | POST | `{ endpoint }` → key/auth check (reports 401/403 as a bad key). |

## Secret handling

`RH_API_KEY` is read host-side only (`process.env`). Never reaches the browser; an absent
key returns a clear error. `RH_API_BASE_URL` overrides the base URL (useful for a custom
gateway).

## Install (survives restarts)

```bash
dsh plugin --profile mitsu add /Volumes/External\ SSD/mitsu-dsh/plugins/mitsu-runninghub
export RH_API_KEY=sk-...    # env-only; the host reads this
```

Restart the harness → right-dock **RunningHub** surface.
