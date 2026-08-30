/**
 * @muen/mitsu-docs — Host half (real DocViewer).
 *
 * Provides the `mitsu.docs` service — recursive .md listing + contained file
 * reads over the workspace roots (live session cwds, then the deployment
 * fallback) — plus loopback-guarded webServer routes the browser half fetches:
 *
 *   GET /mitsu/docs/list       → { ok, root, files: [{path,name,size}] }
 *   GET /mitsu/docs/read?path= → { ok, path, root, content }
 *
 * Same seam as @muen/mitsu-settings and the rail: a Cordis host service over
 * loopback-only routes. Replaces the previous mock panel with real data.
 */
const name = 'mitsu-docs'
const inject = ['fs', 'sessions', 'sandboxPolicy']

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

function apply(ctx) {
  const fs = ctx.get('fs')
  if (fs === undefined) return
  const sessions = ctx.get('sessions')
  const sandboxPolicy = ctx.get('sandboxPolicy')

  // Collect every candidate workspace root: live session cwds first (the
  // Desktop app runs several workspaces), then the deployment fallback.
  const candidateRoots = () => {
    const roots = []
    const seen = new Set()
    const push = (r) => { if (typeof r === 'string' && r && !seen.has(r)) { seen.add(r); roots.push(r) } }
    try {
      if (sessions !== undefined) {
        for (const s of sessions.list()) {
          const cwd = s && s.header && s.header.cwd
          if (typeof cwd === 'string' && cwd) push(cwd)
        }
      }
    } catch (e) { /* ignore */ }
    try {
      if (sandboxPolicy !== undefined && sandboxPolicy.workspaceRoot) push(sandboxPolicy.workspaceRoot)
    } catch (e) { /* ignore */ }
    return roots
  }

  const service = {
    // List .md files under root (default: first candidate that lists).
    async list(rootOverride) {
      const roots = typeof rootOverride === 'string' && rootOverride ? [rootOverride] : candidateRoots()
      let lastErr = 'no workspace root available'
      for (const root of roots) {
        try {
          const rootTarget = await fs.resolve(root)
          const files = []
          let count = 0
          const walk = async (dirTarget, rel, depth) => {
            if (depth > 6 || count > 800) return
            const entries = await fs.listDir(dirTarget)
            for (const entry of entries) {
              if (entry.type === 'directory') {
                if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
                await walk(entry.target, rel ? rel + '/' + entry.name : entry.name, depth + 1)
              } else if (entry.type === 'file' && entry.name.toLowerCase().endsWith('.md')) {
                let size
                try {
                  const info = await fs.stat(entry.target)
                  size = info && info.size
                } catch (e) { /* keep undefined */ }
                files.push({ path: rel ? rel + '/' + entry.name : entry.name, name: entry.name, size })
                count++
              }
            }
          }
          await walk(rootTarget, '', 0)
          files.sort((a, b) => a.path.localeCompare(b.path))
          return { ok: true, root, files }
        } catch (err) {
          lastErr = String((err && err.message) || err)
        }
      }
      return { ok: false, error: lastErr }
    },

    // Read one .md file; try each candidate root until one resolves a
    // contained, existing file.
    async read(path, rootOverride) {
      if (!path) return { ok: false, error: 'no path' }
      const roots = typeof rootOverride === 'string' && rootOverride ? [rootOverride] : candidateRoots()
      let lastErr = 'no workspace root available'
      const absolute = path.startsWith('/')
      for (const root of roots) {
        try {
          const rootTarget = root ? await fs.resolve(root) : undefined
          const target = absolute ? await fs.resolve(path) : await fs.resolve(path, { cwd: root })
          if (rootTarget && !fs.contains(rootTarget, target)) continue
          const content = await fs.readText(target)
          if (content.length > 4 * 1024 * 1024) return { ok: false, error: 'file too large' }
          return { ok: true, path, root: root || '', content }
        } catch (err) {
          lastErr = String((err && err.message) || err)
        }
      }
      return { ok: false, error: lastErr }
    },
  }

  ctx.provide('mitsu.docs', service)

  // Browser reachability — loopback-guarded routes over the same service.
  ctx.inject(['webServer'], (webCtx) => webCtx.effect(() => {
    const disposeList = webCtx.webServer.register({
      kind: 'exact',
      path: '/mitsu/docs/list',
      handler: async (req, res) => {
        if (req.method !== 'GET' || !isTrustedRequest(req)) {
          sendJson(res, req.method === 'GET' ? 403 : 405, { ok: false, error: 'request rejected' })
          return
        }
        sendJson(res, 200, await service.list())
      },
    })
    const disposeRead = webCtx.webServer.register({
      kind: 'exact',
      path: '/mitsu/docs/read',
      handler: async (req, res) => {
        if (req.method !== 'GET' || !isTrustedRequest(req)) {
          sendJson(res, req.method === 'GET' ? 403 : 405, { ok: false, error: 'request rejected' })
          return
        }
        const url = new URL(req.url || '', 'http://localhost')
        const path = url.searchParams.get('path')
        sendJson(res, 200, await service.read(path || undefined))
      },
    })
    return () => {
      disposeRead()
      disposeList()
    }
  }, '@muen/mitsu-docs: http routes'))
}

export default { name, inject, apply }
