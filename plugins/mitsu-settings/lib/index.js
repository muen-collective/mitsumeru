/**
 * @muen/mitsu-settings — Host half (fork plugin).
 *
 * Epic 3 (Settings / Mitsu Plugins / Advanced) host seam, over the fork's
 * plugin shape (raw JS, lib/index.js + lib/client.js). Unlike the pure-client
 * Mitsu surfaces (rail, modes), Settings needs host data — the composed plugin
 * table and curated toggle state — so this half provides the `mitsu.settings`
 * service plus loopback-guarded webServer routes the browser half fetches:
 *
 *   /mitsu/settings/list     → curated Mitsu plugin catalog + toggle state
 *   /mitsu/settings/toggle   → set one curated plugin's enabled flag (body)
 *   /mitsu/settings/plugins  → raw composed plugin table (Cordis loader)
 *
 * Both Settings sections are additive (`settings.section` is a
 * `replaceRisk: none` list slot) — nothing shipped is shadowed.
 *
 * Toggle state is process-local for this slice (see README follow-ups).
 */
const name = 'mitsu-settings'
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
      if (size > 64 * 1024) { req.destroy(); reject(new Error('body too large')); return }
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
 * The curated Mitsu plugin catalog — the friendly subset a client persona
 * sees. `id` is the package name (matches the loader entry name so the card
 * can report whether the plugin is actually composed). Add entries here to
 * curate more surfaces; each gets a card + toggle in the Mitsu Plugins page.
 */
const CATALOG = [
  { id: '@muen/mitsu-rail', name: 'Docs rail', description: 'Right-side markdown reader over the workspace.' },
  { id: 'dsh-file-explorer', name: 'File explorer', description: 'Right-side file tree, preview, and editor.' },
  { id: '@muen/mitsu-settings', name: 'Mitsu settings', description: 'This curated catalog and the Advanced layer.' },
]

/** Toggle state, process-local for this plugin's lifetime. */
const enabledState = new Map(CATALOG.map((c) => [c.id, true]))

function apply(ctx) {
  const loader = ctx.get('loader')
  const clientModules = ctx.get('clientModules')

  // The raw composed plugin table for the Advanced page (read-only).
  // Prefer the Cordis loader (available in every boot — the same source the
  // shipped plugin-inventory gateway wraps); fall back to the web table when
  // only clientModules is present; null means no table is reachable here.
  const rawEntries = () => {
    if (loader !== undefined) {
      try {
        const entries = []
        for (const entry of loader.entries()) {
          if (!entry || entry.options && entry.options.group) continue
          const state = entry.fiber && entry.fiber.state
          entries.push({
            id: entry.id,
            name: entry.options && entry.options.name,
            enabled: !entry.disabled,
            phase: state === undefined ? null : [ 'pending', 'loading', 'active', 'failed', null, 'unloading' ][state] || null,
          })
        }
        return entries
      } catch (e) { /* fall through */ }
    }
    if (clientModules !== undefined) {
      try {
        const graph = clientModules.graph()
        return ((graph && graph.entries) || []).map((e) => ({ id: e.id, name: e.id, enabled: true, phase: null }))
      } catch (e) { /* fall through */ }
    }
    return null
  }

  const service = {
    // Curated catalog merged with the live toggle state and composition.
    list() {
      const raw = rawEntries()
      const composed = raw === null ? null : new Set(raw.map((e) => e.name || e.id))
      return {
        ok: true,
        items: CATALOG.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          enabled: enabledState.get(c.id) !== false,
          installed: composed === null ? null : composed.has(c.id),
        })),
      }
    },

    // Raw plugin table for the Advanced page (read-only).
    plugins() {
      const raw = rawEntries()
      if (raw === null) return { ok: false, error: 'Raw plugin table unavailable in this profile.' }
      return { ok: true, entries: raw }
    },

    // Set one curated plugin's enabled flag.
    toggle(id, enabled) {
      if (!CATALOG.some((c) => c.id === id)) return { ok: false, error: 'unknown plugin: ' + id }
      enabledState.set(id, !!enabled)
      return service.list()
    },
  }

  ctx.provide('mitsu.settings', service)

  // Browser reachability — loopback-guarded routes over the same service.
  ctx.inject(['webServer'], (webCtx) => webCtx.effect(() => {
    const disposeList = webCtx.webServer.register({
      kind: 'exact',
      path: '/mitsu/settings/list',
      handler: async (req, res) => {
        if (req.method !== 'GET' || !isTrustedRequest(req)) {
          sendJson(res, req.method === 'GET' ? 403 : 405, { ok: false, error: 'request rejected' })
          return
        }
        sendJson(res, 200, service.list())
      },
    })
    const disposePlugins = webCtx.webServer.register({
      kind: 'exact',
      path: '/mitsu/settings/plugins',
      handler: async (req, res) => {
        if (req.method !== 'GET' || !isTrustedRequest(req)) {
          sendJson(res, req.method === 'GET' ? 403 : 405, { ok: false, error: 'request rejected' })
          return
        }
        sendJson(res, 200, service.plugins())
      },
    })
    const disposeToggle = webCtx.webServer.register({
      kind: 'exact',
      path: '/mitsu/settings/toggle',
      handler: async (req, res) => {
        if (req.method !== 'POST' || !isTrustedRequest(req)) {
          sendJson(res, req.method === 'POST' ? 403 : 405, { ok: false, error: 'request rejected' })
          return
        }
        let body
        try { body = await readBody(req) } catch (e) { return sendJson(res, 400, { ok: false, error: 'bad body' }) }
        sendJson(res, 200, service.toggle(body && body.id, body && body.enabled))
      },
    })
    return () => {
      disposeToggle()
      disposePlugins()
      disposeList()
    }
  }, '@muen/mitsu-settings: http routes'))
}

export default { name, inject, apply }
