/**
 * @muen/mitsu-krea — Host half.
 *
 * Image generation via Krea's hosted REST API (Path B): a Mitsu plugin that
 * reads KREA_API_KEY (or KREA_API_TOKEN) from the environment — never sent to
 * the client — submits a Krea 2 job, polls it to completion, and writes the
 * resulting image(s) into the local Assets folder (MITSU_PROJECT/assets, the
 * durable visible copy, exactly like @muen/mitsu-assets).
 *
 * Contract (verified against Krea's OpenAPI + the founder's raw REST example):
 *   POST https://api.krea.ai/generate/image/krea/krea-2/<size>
 *        { prompt, aspect_ratio?, resolution? }  → { job_id, status }
 *   GET  https://api.krea.ai/jobs/{id}           → { status, result:{ urls:[...] } }
 *   auth: Authorization: Bearer <KREA_API_KEY>
 *
 * Routes (loopback-only, same hygiene as @muen/mitsu-docs):
 *   POST /mitsu/krea/generate  → { model, prompt, aspect_ratio?, resolution? }
 *        returns { ok, files:[{name,url,local}], jobId }
 *   GET  /mitsu/krea/models    → the supported Krea 2 model set
 *   GET  /mitsu/krea/status    → { ok, keyConfigured, assetRoot }
 *
 * The key is read host-side only. No key and no secret ever crosses to the
 * browser; an absent key returns a clear "set KREA_API_KEY" error.
 */
const name = 'mitsu-krea'
const inject = ['webServer']

/** Krea 2 model id → REST path segment, matching the Krea 2 family. */
const KREA_2_MODELS = {
  'krea-2-medium': 'krea-2/medium',
  'krea-2-large': 'krea-2/large',
  'krea-2-medium-turbo': 'krea-2/medium-turbo',
  'krea-2-large-turbo': 'krea-2/large-turbo',
}

const BASE = 'https://api.krea.ai'
const POLL_INTERVAL_MS = 3000
const POLL_TIMEOUT_MS = 5 * 60 * 1000

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
  return process.env.KREA_API_KEY || process.env.KREA_API_TOKEN || ''
}

/** Slug a prompt into a filesystem-safe base name. */
function slugify(prompt) {
  return String(prompt || 'krea')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'krea'
}

function extFromUrl(url) {
  try {
    const m = new URL(url).pathname.match(/\.(png|jpe?g|webp|gif|avif)(?:\?|$)/i)
    if (m) return '.' + m[1].toLowerCase().replace('jpeg', 'jpg')
  } catch (e) { /* fall through */ }
  return '.png'
}

function apply(ctx) {
  const assets = ctx.get('mitsu.assets')

  const service = {
    models() {
      return { ok: true, models: Object.keys(KREA_2_MODELS) }
    },
    status() {
      return { ok: true, keyConfigured: apiKeyOf().length > 0, assetRoot: assets ? assets.assetRoot : undefined }
    },
    async generate(input) {
      const key = apiKeyOf()
      if (!key) {
        return { ok: false, error: 'KREA_API_KEY is not set — export it so the host can call Krea' }
      }
      const model = input && typeof input.model === 'string' ? input.model : 'krea-2-medium'
      const path = KREA_2_MODELS[model]
      if (!path) return { ok: false, error: `unknown Krea 2 model "${model}"` }
      const prompt = input && typeof input.prompt === 'string' ? input.prompt : ''
      if (!prompt.trim()) return { ok: false, error: 'no prompt provided' }

      const body = { prompt }
      if (input.aspect_ratio) body.aspect_ratio = input.aspect_ratio
      if (input.resolution) body.resolution = input.resolution
      if (input.seed !== undefined) body.seed = input.seed

      let submit
      try {
        submit = await fetch(`${BASE}/generate/image/krea/${path}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
          body: JSON.stringify(body),
        })
      } catch (e) {
        return { ok: false, error: 'network: ' + String((e && e.message) || e) }
      }
      const submitJson = await submit.json().catch(() => ({}))
      if (!submit.ok || !submitJson.job_id) {
        const msg = submitJson.error || (submitJson.message ? submitJson.message : `HTTP ${submit.status}`)
        const hint = submit.status === 401 || submit.status === 403 ? ' (check the Krea API key)' :
          submit.status === 402 ? ' (out of Krea credits)' :
            submit.status === 429 ? ' (concurrent job limit reached)' : ''
        return { ok: false, error: `Krea ${submit.status}: ${msg || 'no job_id'}${hint}` }
      }
      const jobId = submitJson.job_id

      // Poll the job until terminal or timeout.
      const deadline = Date.now() + POLL_TIMEOUT_MS
      let resultState
      let lastStatus = submitJson.status || 'queued'
      for (;;) {
        if (Date.now() > deadline) {
          return { ok: false, error: 'poll timed out', jobId, status: lastStatus }
        }
        let poll
        try {
          poll = await fetch(`${BASE}/jobs/${jobId}`, {
            headers: { authorization: `Bearer ${key}` },
          })
        } catch (e) {
          return { ok: false, error: 'poll network: ' + String((e && e.message) || e), jobId }
        }
        const pollJson = await poll.json().catch(() => ({}))
        lastStatus = pollJson.status || lastStatus
        if (pollJson.status === 'completed') { resultState = pollJson; break }
        if (pollJson.status === 'failed' || pollJson.status === 'cancelled') {
          const reason = pollJson.error || (pollJson.result && pollJson.result.error) || lastStatus
          return { ok: false, error: `Krea job ${lastStatus}: ${reason}`, jobId, status: lastStatus }
        }
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
      }

      const urls = (resultState.result && resultState.result.urls) || []
      if (urls.length === 0) {
        return { ok: false, error: 'job completed with no image urls', jobId, status: 'completed' }
      }

      // Write each image into the local Assets folder. Read the service lazily:
      // the plugin doesn't declare it as a hard dependency, so capture-on-apply
      // can race the Assets mount. A live read always sees it.
      const liveAssets = ctx.get('mitsu.assets') || assets
      const files = []
      const stub = slugify(prompt)
      const stamp = Date.now().toString(36)
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i]
        const name = `${stub}-${stamp}-${i + 1}${extFromUrl(url)}`
        if (liveAssets) {
          const written = await liveAssets.ingest({ url, name })
          if (written.ok) {
            files.push({ name: written.path, url: written.url, local: true })
          } else {
            files.push({ name, url, local: false, error: written.error })
          }
        } else {
          // No Assets service mounted — return the remote URL.
          files.push({ name, url, local: false })
        }
      }
      return { ok: true, files, jobId, status: 'completed' }
    },
  }

  ctx.provide('mitsu.krea', service)

  ctx.inject(['webServer'], (webCtx) => webCtx.effect(() => {
    const disposeModels = webCtx.webServer.register({
      kind: 'exact',
      path: '/mitsu/krea/models',
      handler: async (req, res) => {
        if (req.method !== 'GET' || !isTrustedRequest(req)) { sendJson(res, 405, { ok: false, error: 'request rejected' }); return }
        sendJson(res, 200, service.models())
      },
    })
    const disposeStatus = webCtx.webServer.register({
      kind: 'exact',
      path: '/mitsu/krea/status',
      handler: async (req, res) => {
        if (req.method !== 'GET' || !isTrustedRequest(req)) { sendJson(res, 405, { ok: false, error: 'request rejected' }); return }
        sendJson(res, 200, service.status())
      },
    })
    const disposeGenerate = webCtx.webServer.register({
      kind: 'exact',
      path: '/mitsu/krea/generate',
      handler: async (req, res) => {
        if (req.method !== 'POST' || !isTrustedRequest(req)) { sendJson(res, 403, { ok: false, error: 'request rejected' }); return }
        let input
        try { input = await readBody(req) } catch (e) { return sendJson(res, 400, { ok: false, error: 'bad body' }) }
        sendJson(res, 200, await service.generate(input))
      },
    })
    return () => { disposeGenerate(); disposeStatus(); disposeModels() }
  }, '@muen/mitsu-krea: http routes'))
}

export default { name, inject, apply }
