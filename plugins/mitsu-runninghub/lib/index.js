/**
 * @muen/mitsu-runninghub — Host half.
 *
 * RunningHub creative-workflow runner via the open API (model-endpoint pattern).
 * Reads RH_API_KEY host-side only (never to the client), submits a task to
 * /openapi/v2/{endpoint}, polls /openapi/v2/query to a terminal status, and
 * writes the resulting outputs (image/video URLs) into the local Assets folder
 * (MITSU_PROJECT/assets) — the durable visible copy, like @muen/mitsu-krea.
 *
 * Contract (verified against the RunningHub API contract):
 *   Base  https://www.runninghub.cn/openapi/v2       (RH_API_BASE_URL to override)
 *   Auth  Authorization: Bearer <RH_API_KEY>
 *   POST  {base}/{endpoint}      { ...params }  → { taskId }  (or task_id)
 *   POST  {base}/query           { taskId }     → { status, results:[{url,outputType}] }
 *   statuses: CREATE|QUEUED|RUNNING|SUCCESS|FAILED|CANCEL  (SUCCESS terminal, urls in results)
 *
 * Routes (loopback-only, like @muen/mitsu-docs):
 *   GET  /mitsu/rh/status     → { ok, keyConfigured, base }
 *   POST /mitsu/rh/run        → { endpoint, ...params } → submit + poll + write into Assets
 *   POST /mitsu/rh/probe      → { endpoint }            → auth/key check (submit + cancel-ish)
 */
const name = 'mitsu-runninghub'
const inject = ['webServer']

const BASE = process.env.RH_API_BASE_URL || 'https://www.runninghub.ai/openapi/v2'
const POLL_INTERVAL_MS = 5000
const POLL_TIMEOUT_MS = 30 * 60 * 1000

function isTrustedRequest(req) {
  const address = req.socket && req.socket.remoteAddress
  const loopback = address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1'
  if (!loopback) return false
  if (req.headers.forwarded || req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.headers['x-forwarded-host']) return false
  return true
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body),
  })
  res.end(body)
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > 1024 * 1024) { req.destroy(); reject(new Error('body too large')); return }
      chunks.push(chunk)
    })
    req.on('end', () => {
      try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}) }
      catch (e) { reject(e) }
    })
    req.on('error', reject)
  })
}

function apiKeyOf() {
  return process.env.RH_API_KEY || ''
}

/** Normalize the submit response to a task id (accepts taskId or task_id). */
function taskIdOf(json) {
  if (!json || typeof json !== 'object') return undefined
  const v = json.taskId ?? json.task_id ?? (json.data && (json.data.taskId ?? json.data.task_id))
  return typeof v === 'string' ? v : undefined
}

function outputsOf(json) {
  if (!json || typeof json !== 'object') return []
  const results = json.results
  if (Array.isArray(results)) {
    return results.map((r) => (typeof r === 'string' ? r : r && (r.url ?? r.outputUrl))).filter(Boolean)
  }
  // Some responses put urls at the top level or nested in data.
  if (json.url) return [json.url]
  if (json.urls && Array.isArray(json.urls)) return json.urls
  if (json.result && json.result.url) return [json.result.url]
  if (json.result && json.result.urls) return json.result.urls
  if (json.data && json.data.url) return [json.data.url]
  if (json.data && json.data.urls) return json.data.urls
  return []
}

/** Extract a human-readable error from a RunningHub error shape, preferring a code. */
function errorOf(json, fallback) {
  if (!json || typeof json !== 'object') return fallback
  const msg = json.message ?? json.msg ?? json.error
  const code = json.code !== undefined && json.code !== 0 ? `[${json.code}] ` : ''
  return code + (typeof msg === 'string' ? msg : fallback)
}

function extFromUrl(url) {
  try {
    const m = new URL(url).pathname.match(/\.(png|jpe?g|webp|gif|avif|mp4|webm|mov)(?:\?|$)/i)
    if (m) return '.' + m[1].toLowerCase().replace('jpeg', 'jpg')
  } catch (e) { /* fall through */ }
  return '.png'
}

function slugify(s) {
  return String(s || 'rh')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'rh'
}

function apply(ctx) {
  const assets = ctx.get('mitsu.assets')

  const service = {
    status() {
      return { ok: true, keyConfigured: apiKeyOf().length > 0, base: BASE }
    },

    /** Submit + poll + write outputs into Assets. Returns the local files. */
    async run(input) {
      const key = apiKeyOf()
      if (!key) return { ok: false, error: 'RH_API_KEY is not set — export it so the host can call RunningHub' }
      const endpoint = input && typeof input.endpoint === 'string' ? input.endpoint : ''
      if (!endpoint.trim()) return { ok: false, error: 'no endpoint provided' }
      const params = { ...(input && input.params ? input.params : {}) }

      let submit
      try {
        submit = await fetch(`${BASE}/${endpoint}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
          body: JSON.stringify(params),
        })
      } catch (e) {
        return { ok: false, error: 'network: ' + String((e && e.message) || e) }
      }
      const submitJson = await submit.json().catch(() => ({}))
      const taskId = taskIdOf(submitJson)
      if (!submit.ok || taskId === undefined) {
        const hint = submit.status === 401 || submit.status === 403 ? ' (check the RH_API_KEY)' :
          submit.status === 429 ? ' (rate limit)' :
            submit.status >= 500 ? ' (RunningHub transient error)' : ''
        return { ok: false, error: `RunningHub ${submit.status}: ${errorOf(submitJson, submitJson.error || 'no taskId')}${hint}` }
      }

      const deadline = Date.now() + POLL_TIMEOUT_MS
      let lastStatus = 'CREATE'
      let terminal
      for (;;) {
        if (Date.now() > deadline) {
          return { ok: false, error: `poll timed out after 30m`, taskId, status: lastStatus }
        }
        let poll
        try {
          poll = await fetch(`${BASE}/query`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
            body: JSON.stringify({ taskId }),
          })
        } catch (e) {
          return { ok: false, error: 'poll network: ' + String((e && e.message) || e), taskId, status: lastStatus }
        }
        const pollJson = await poll.json().catch(() => ({}))
        lastStatus = (pollJson.status ?? pollJson.taskStatus ?? lastStatus).toUpperCase()
        if (lastStatus === 'SUCCESS') { terminal = pollJson; break }
        if (lastStatus === 'FAILED' || lastStatus === 'CANCEL' || lastStatus === 'CANCELLED') {
          return { ok: false, error: errorOf(pollJson, `RunningHub task ${lastStatus}`), taskId, status: lastStatus }
        }
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
      }

      const urls = outputsOf(terminal)
      if (urls.length === 0) {
        return { ok: false, error: 'task succeeded with no output urls', taskId, status: 'SUCCESS' }
      }

      const liveAssets = ctx.get('mitsu.assets') || assets
      const files = []
      const stub = slugify(input.name || endpoint.split('/').pop())
      const stamp = Date.now().toString(36)
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i]
        const name = `${stub}-${stamp}-${i + 1}${extFromUrl(url)}`
        if (liveAssets) {
          const written = await liveAssets.ingest({ url, name })
          files.push(written.ok ? { name: written.path, url: written.url, local: true } : { name, url, local: false, error: written.error })
        } else {
          files.push({ name, url, local: false })
        }
      }
      return { ok: true, files, taskId, status: 'SUCCESS' }
    },

    /** Light auth/key check: submit a probe to the given endpoint; treat a 401/403 as a bad key. */
    async probe(input) {
      const key = apiKeyOf()
      if (!key) return { ok: false, error: 'RH_API_KEY is not set' }
      const endpoint = input && typeof input.endpoint === 'string' ? input.endpoint : ''
      if (!endpoint.trim()) return { ok: false, error: 'no endpoint provided' }
      try {
        const submit = await fetch(`${BASE}/${endpoint}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
          body: JSON.stringify({ prompt: 'probe' }),
        })
        if (submit.status === 401 || submit.status === 403) return { ok: false, error: 'the RunningHub API key was rejected (401/403)' }
        if (submit.status === 200 || submit.status === 2000) return { ok: true, message: 'RunningHub responded; key accepted' }
        return { ok: true, message: `RunningHub responded ${submit.status} (submit succeeded)` }
      } catch (e) {
        return { ok: false, error: 'network: ' + String((e && e.message) || e) }
      }
    },
  }

  ctx.provide('mitsu.runninghub', service)

  ctx.inject(['webServer'], (webCtx) => webCtx.effect(() => {
    const disposeStatus = webCtx.webServer.register({
      kind: 'exact',
      path: '/mitsu/rh/status',
      handler: async (req, res) => {
        if (req.method !== 'GET' || !isTrustedRequest(req)) { sendJson(res, 405, { ok: false, error: 'request rejected' }); return }
        sendJson(res, 200, service.status())
      },
    })
    const disposeProbe = webCtx.webServer.register({
      kind: 'exact',
      path: '/mitsu/rh/probe',
      handler: async (req, res) => {
        if (req.method !== 'POST' || !isTrustedRequest(req)) { sendJson(res, 403, { ok: false, error: 'request rejected' }); return }
        let input
        try { input = await readBody(req) } catch (e) { return sendJson(res, 400, { ok: false, error: 'bad body' }) }
        sendJson(res, 200, await service.probe(input))
      },
    })
    const disposeRun = webCtx.webServer.register({
      kind: 'exact',
      path: '/mitsu/rh/run',
      handler: async (req, res) => {
        if (req.method !== 'POST' || !isTrustedRequest(req)) { sendJson(res, 403, { ok: false, error: 'request rejected' }); return }
        let input
        try { input = await readBody(req) } catch (e) { return sendJson(res, 400, { ok: false, error: 'bad body' }) }
        sendJson(res, 200, await service.run(input))
      },
    })
    return () => { disposeRun(); disposeProbe(); disposeStatus() }
  }, '@muen/mitsu-runninghub: http routes'))
}

export default { name, inject, apply }
