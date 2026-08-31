/**
 * @muen/mitsu-providers — host half.
 *
 * The browser half renders the Mitsu Providers panel. It calls this host route
 * to do the REAL provider probe, because a browser-side fetch to the provider's
 * endpoint would hit CORS and because the api key should never be shipped into
 * the browser's own request headers.
 *
 *   POST /mitsu/providers/probe
 *     body: { provider, baseURL, format, apiKey }
 *     → { ok, endpoint, status, list: [{id,name}], error? }
 *
 * The probe fetches `<baseURL>/models` with a Bearer key (OpenAI-compat) that
 * most MiMo-format providers support. A 2xx returns the advertised model ids;
 * 401/403 reports a bad key; a network failure reports the reachability error.
 * Loopback-only, same hygiene as @muen/mitsu-docs.
 */
const name = 'mitsu-providers'

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
  })
  res.end(body)
}

function readJson(req) {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', (chunk) => { data += chunk })
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')) } catch { resolve({}) }
    })
  })
}

function apply(ctx) {
  const disposeRoutes = ctx.inject(['webServer'], (webCtx) => webCtx.effect(() => {
    const disposeProbe = webCtx.webServer.register({
      kind: 'exact',
      path: '/mitsu/providers/probe',
      handler: async (req, res) => {
        if (req.method !== 'POST' || !isTrustedRequest(req)) {
          sendJson(res, req.method === 'POST' ? 403 : 405, { ok: false, error: 'request rejected' })
          return
        }
        const body = await readJson(req)
        const baseURL = typeof body.baseURL === 'string' ? body.baseURL.replace(/\/+$/, '') : ''
        const apiKey = typeof body.apiKey === 'string' ? body.apiKey : ''
        const provider = typeof body.provider === 'string' ? body.provider : ''
        if (!baseURL || !apiKey) {
          sendJson(res, 200, { ok: false, error: 'endpoint and api key are required' })
          return
        }

        // Normalize to the OpenAI-compat models listing. Xiaomi uses
        // GET /v1/models with a Bearer key; most OpenAI-format providers do too.
        const url = baseURL.includes('/models') ? baseURL : `${baseURL}/models`
        let response
        try {
          response = await fetch(url, {
            method: 'GET',
            headers: {
              accept: 'application/json',
              authorization: `Bearer ${apiKey}`,
            },
          })
        } catch (error) {
          sendJson(res, 200, {
            ok: false,
            endpoint: url,
            error: `could not reach ${url}: ${String(error && error.message || error)}`,
          })
          return
        }

        if (response.status === 401 || response.status === 403) {
          sendJson(res, 200, { ok: false, endpoint: url, status: response.status, error: 'the API key was rejected (401/403) — check the key' })
          return
        }
        if (!response.ok) {
          sendJson(res, 200, { ok: false, endpoint: url, status: response.status, error: `endpoint answered ${response.status}` })
          return
        }

        let data
        try {
          data = await response.json()
        } catch {
          sendJson(res, 200, { ok: false, endpoint: url, status: response.status, error: 'endpoint did not answer with JSON' })
          return
        }

        // The OpenAI /models listing is { data: [{ id, ... }] }.
        const arr = Array.isArray(data) ? data : (data && Array.isArray(data.data) ? data.data : [])
        const list = arr
          .map((m) => ({ id: typeof m === 'string' ? m : m.id, name: (typeof m === 'object' && m) ? m.name : undefined }))
          .filter((m) => typeof m.id === 'string' && m.id.length > 0)

        sendJson(res, 200, { ok: true, endpoint: url, status: response.status, list })
      },
    })
    return () => { disposeProbe() }
  }, '@muen/mitsu-providers: probe route'))

  return () => { disposeRoutes() }
}

export default { name, inject: ['webServer'], apply }
