/**
 * @muen/mitsu-starter-pack — Host half.
 *
 * The RunningHub adapter for the Fashion Starter Pack: a curated set of RH
 * workflow steps (restore → person-swap → preserve-garment → variations) with
 * role-keyed inputs, submitted and polled through RunningHub's open API.
 *
 * The adapter is the same proven contract as product/strategy/rh-run.mjs
 * (submit v2/legacy + poll + URL verification), surfaced as a Cordis host
 * service over loopback-guarded webServer routes:
 *
 *   GET  /mitsu/pack/list           → the pack catalog + whether a key is set
 *   POST /mitsu/pack/run            → verify inputs, submit, return taskId
 *   GET  /mitsu/pack/status?taskId= → poll one task to completion
 *
 * Key hygiene: RH_API_KEY is read from the harness environment only; it never
 * leaves the host and is never returned to the client. The pack manifest below
 * is the single place to paste RunningHub app IDs (see README.md).
 */
const name = 'mitsu-starter-pack'
const inject = ['webServer']

/** Loopback-only, no forwarded headers — same hygiene the desktop installer uses. */
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
      if (size > 256 * 1024) { req.destroy(); reject(new Error('body too large')); return }
      chunks.push(chunk)
    })
    req.on('end', () => {
      try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}) }
      catch (e) { reject(e) }
    })
    req.on('error', reject)
  })
}

/**
 * The Fashion Starter Pack manifest — the edit-me surface.
 * `api` is 'v2' (Bearer, /openapi/v2/run/ai-app/<appId>) or 'legacy'
 * (/task/openapi/ai-app/run with webappId). Paste each step's RunningHub app ID
 * into `appId`; leave '' and the run returns a clear "app not configured" error.
 * Inputs are role-keyed per the HMU pipeline contract (docs/plans/23).
 */
const PACK = [
  {
    id: 'restore',
    label: 'Restore / clean',
    description: 'Clean a raw or heritage garment image.',
    appId: '',
    api: 'legacy',
    revision: '',
    inputs: [
      { field: 'source_garment', label: 'Garment image URL', role: 'raw/heritage image' },
    ],
    params: { seed: 381227 },
  },
  {
    id: 'person-swap',
    label: 'Person swap',
    description: 'Put the branded AI person in the garment.',
    appId: '',
    api: 'legacy',
    revision: '',
    inputs: [
      { field: 'source_garment', label: 'Garment image URL', role: 'source garment' },
      { field: 'identity_reference', label: 'Identity reference URL', role: 'branded AI person' },
    ],
    params: { seed: 381227 },
  },
  {
    id: 'preserve-garment',
    label: 'Preserve garment',
    description: 'Keep the garment exactly while restyling the wearer.',
    appId: '',
    api: 'legacy',
    revision: '',
    inputs: [
      { field: 'source_garment', label: 'Garment image URL', role: 'source garment' },
      { field: 'identity_reference', label: 'Identity reference URL', role: 'branded AI person' },
      { field: 'restored_source', label: 'Restored image URL (optional)', role: 'restored_source' },
    ],
    params: { seed: 381227 },
  },
  {
    id: 'variations',
    label: 'Variations',
    description: 'Produce brand-consistent variations of the look.',
    appId: '',
    api: 'legacy',
    revision: '',
    inputs: [
      { field: 'source_garment', label: 'Garment image URL', role: 'source garment' },
      { field: 'identity_reference', label: 'Identity reference URL', role: 'branded AI person' },
      { field: 'brand_dna', label: 'Brand DNA prompt (optional)', role: 'brand_dna' },
    ],
    params: { seed: 381227 },
  },
]

const RH_BASE = process.env.RH_BASE || 'https://www.runninghub.ai'

/** HEAD-check every input URL before submit — the #1 batch killer is an expired signed URL. */
async function verifyUrls(inputs) {
  const checks = []
  for (const [key, value] of Object.entries(inputs)) {
    if (typeof value !== 'string' || !/^https?:\/\//.test(value)) { checks.push({ key, ok: true, note: 'non-URL value' }); continue }
    try {
      let res = await fetch(value, { method: 'HEAD' })
      if (res.status === 405) res = await fetch(value, { headers: { Range: 'bytes=0-0' } })
      checks.push({ key, ok: res.ok, status: res.status })
    } catch (e) {
      checks.push({ key, ok: false, status: 0, note: String((e && e.message) || e) })
    }
  }
  const bad = checks.filter((c) => !c.ok)
  return { ok: bad.length === 0, checks, bad }
}

/** Submit one run through the RH open API (v2 Bearer or legacy). */
async function submitTask(apiKey, appId, api, inputs, params) {
  const nodeInfoList = Object.entries(inputs).map(([fieldName, fieldValue]) => ({
    nodeId: '',
    fieldName,
    fieldValue: String(fieldValue),
  }))
  const headers = { 'Content-Type': 'application/json' }
  let url
  let body
  if (api === 'v2') {
    url = `${RH_BASE}/openapi/v2/run/ai-app/${encodeURIComponent(appId)}`
    headers.Authorization = `Bearer ${apiKey}`
    body = { nodeInfoList, instanceType: 'default', usePersonalQueue: 'false' }
  } else {
    url = `${RH_BASE}/task/openapi/ai-app/run`
    body = { webappId: appId, apiKey, nodeInfoList }
  }
  if (params) body.params = params
  let res
  try {
    res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
  } catch (e) {
    return { ok: false, error: 'network: ' + String((e && e.message) || e) }
  }
  let data
  try { data = await res.json() } catch (e) { data = {} }
  if (!res.ok) return { ok: false, error: `HTTP ${res.status}: ${res.statusText}` }
  const taskId = data.taskId || (data.data && data.data.taskId)
  if (!taskId || data.errorCode || (data.code !== undefined && data.code !== 0)) {
    return { ok: false, error: data.errorMessage || data.msg || JSON.stringify(data).slice(0, 300) }
  }
  return { ok: true, taskId }
}

/** Poll one task to completion (single call; the client re-polls). */
async function pollTask(apiKey, taskId) {
  let res
  try {
    res = await fetch(`${RH_BASE}/task/openapi/outputs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, taskId }),
    })
  } catch (e) {
    return { ok: false, error: 'network: ' + String((e && e.message) || e) }
  }
  let data
  try { data = await res.json() } catch (e) { data = {} }
  if (!res.ok) return { ok: false, error: `HTTP ${res.status}: ${res.statusText}` }
  // New AI App shape
  if (data.status === 'SUCCESS' && data.results && data.results.length > 0) {
    return { ok: true, status: 'completed', resultUrls: data.results.map((r) => r.url), costTimeS: Number(data.usage && data.usage.taskCostTime || 0) }
  }
  if (data.status === 'FAILED') return { ok: true, status: 'failed', error: data.errorMessage || (data.failedReason && data.failedReason.exception_message) || 'Task failed' }
  if (data.status === 'RUNNING' || data.status === 'QUEUED' || data.code === 804 || data.code === 813) return { ok: true, status: 'running' }
  // Legacy shape
  if (data.code === 0 && data.data && data.data[0]) {
    return { ok: true, status: 'completed', resultUrls: data.data.map((d) => d.fileUrl), costTimeS: Number(data.data[0].taskCostTime || 0) }
  }
  if (data.code === 805) return { ok: true, status: 'failed', error: (data.data && data.data.failedReason && data.data.failedReason.exception_message) || 'Task failed' }
  return { ok: true, status: 'unknown', error: JSON.stringify(data).slice(0, 200) }
}

function apply(ctx) {
  const service = {
    // The pack catalog. keySet is a boolean — the key itself never leaves the host.
    list() {
      return {
        ok: true,
        keySet: typeof process.env.RH_API_KEY === 'string' && process.env.RH_API_KEY.length > 0,
        base: RH_BASE,
        steps: PACK.map((s) => ({
          id: s.id,
          label: s.label,
          description: s.description,
          appConfigured: s.appId.length > 0,
          revision: s.revision,
          inputs: s.inputs,
        })),
      }
    },

    // Verify inputs, then submit one step's run.
    async run(stepId, inputs, params) {
      const step = PACK.find((s) => s.id === stepId)
      if (step === undefined) return { ok: false, error: 'unknown step: ' + stepId }
      const apiKey = process.env.RH_API_KEY
      if (typeof apiKey !== 'string' || apiKey.length === 0) return { ok: false, error: 'RH_API_KEY not set in the harness environment' }
      if (step.appId.length === 0) return { ok: false, error: `RunningHub app not configured for "${step.label}" — paste its appId into plugins/mitsu-starter-pack/lib/index.js` }
      if (!inputs || typeof inputs !== 'object') return { ok: false, error: 'no inputs' }
      const verified = await verifyUrls(inputs)
      if (!verified.ok) return { ok: false, error: 'input URL check failed — expired or unreachable URL', checks: verified.checks }
      const merged = { ...(step.params || {}), ...(params || {}) }
      const submitted = await submitTask(apiKey, step.appId, step.api, inputs, merged)
      if (!submitted.ok) return { ok: false, error: submitted.error }
      return { ok: true, taskId: submitted.taskId, stepId: step.id }
    },

    // Poll one task (client re-polls until terminal).
    async status(taskId) {
      if (!taskId) return { ok: false, error: 'no taskId' }
      const apiKey = process.env.RH_API_KEY
      if (typeof apiKey !== 'string' || apiKey.length === 0) return { ok: false, error: 'RH_API_KEY not set in the harness environment' }
      return await pollTask(apiKey, taskId)
    },
  }

  ctx.provide('mitsu.pack', service)

  // Browser reachability — loopback-guarded routes over the same service.
  ctx.inject(['webServer'], (webCtx) => webCtx.effect(() => {
    const disposeList = webCtx.webServer.register({
      kind: 'exact',
      path: '/mitsu/pack/list',
      handler: async (req, res) => {
        if (req.method !== 'GET' || !isTrustedRequest(req)) {
          sendJson(res, req.method === 'GET' ? 403 : 405, { ok: false, error: 'request rejected' })
          return
        }
        sendJson(res, 200, service.list())
      },
    })
    const disposeRun = webCtx.webServer.register({
      kind: 'exact',
      path: '/mitsu/pack/run',
      handler: async (req, res) => {
        if (req.method !== 'POST' || !isTrustedRequest(req)) {
          sendJson(res, req.method === 'POST' ? 403 : 405, { ok: false, error: 'request rejected' })
          return
        }
        let body
        try { body = await readBody(req) } catch (e) { return sendJson(res, 400, { ok: false, error: 'bad body' }) }
        sendJson(res, 200, await service.run(body && body.stepId, body && body.inputs, body && body.params))
      },
    })
    const disposeStatus = webCtx.webServer.register({
      kind: 'exact',
      path: '/mitsu/pack/status',
      handler: async (req, res) => {
        if (req.method !== 'GET' || !isTrustedRequest(req)) {
          sendJson(res, req.method === 'GET' ? 403 : 405, { ok: false, error: 'request rejected' })
          return
        }
        const url = new URL(req.url || '', 'http://localhost')
        sendJson(res, 200, await service.status(url.searchParams.get('taskId') || undefined))
      },
    })
    return () => {
      disposeStatus()
      disposeRun()
      disposeList()
    }
  }, '@muen/mitsu-starter-pack: http routes'))
}

export default { name, inject, apply }
