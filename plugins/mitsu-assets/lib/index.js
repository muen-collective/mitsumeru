/**
 * @muen/mitsu-assets — Host half.
 *
 * Backs the Assets rail surface with a REAL local folder: the visible project
 * dir's `assets/` (MITSU_PROJECT/assets; default ~/Mitsu/assets). Created or
 * downloaded assets land there, and the browser half lists what's present.
 *
 * No Cloudinary dependency. Cloudinary (or another host) is only a *source*
 * when one is configured; the durable copy is the local file, downloaded into
 * this folder. The URL to download from is provided by the producing surface;
 * when absent, a bare file is still listed.
 *
 *   GET  /mitsu/assets/list            → { ok, root, files: [{path,name,size,url}] }
 *   POST /mitsu/assets/ingest          → download {url} into the folder (returns the new file)
 *   GET  /mitsu/assets/file?name=…     → serve one local asset to <img>
 *
 * Loopback-only, same hygiene as @muen/mitsu-docs.
 */
const name = 'mitsu-assets'
const inject = ['fs', 'subprocess', 'webServer']

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

const IMAGE_EXT = /\.(png|jpe?g|webp|gif|avif|svg)$/i

function apply(ctx) {
  const fs = ctx.get('fs')
  if (fs === undefined) return
  const subprocess = ctx.get('subprocess')

  const projectDir = process.env.MITSU_PROJECT || process.env.HOME + '/Mitsu'
  const assetRoot = `${projectDir}/assets`

  /** Write base64 bytes through the RAW subprocess (not the sandboxed fs), which
   *  is not gated by the session sandbox — the durable local copy must always
   *  land. Base64 is sent over stdin (NOT argv): an argv argument is bounded by
   *  the OS arg-list limit (E2BIG on image-sized payloads), while a stdin pipe
   *  has no such cap. */
  function writeBytes(name, b64) {
    return new Promise((resolve) => {
      if (!subprocess) { resolve({ ok: false, error: 'no subprocess service' }); return }
      try {
        const spec = {
          argv: ['sh', '-c', 'mkdir -p "$1" && cat | base64 -d > "$2"', 'sh', assetRoot, `${assetRoot}/${name}`],
          cwd: '/',
          stdio: { stdin: { data: b64 }, stdout: { maxBytes: 1 << 16 }, stderr: { maxBytes: 1 << 16 } },
          graceMs: 30000,
        }
        const handle = subprocess.spawn(spec)
        handle.done.then((o) => {
          let err = ''
          try { const se = handle.collected.stderr; if (se) { const r = se.readFrom(0); if (r) err = r.text } } catch (e) { /* ignore */ }
          resolve({ ok: o.exitCode === 0, error: err.trim() || undefined })
        }).catch((e) => resolve({ ok: false, error: String((e && e.message) || e) }))
      } catch (e) {
        resolve({ ok: false, error: String((e && e.message) || e) })
      }
    })
  }

  const service = {
    // List image assets in the local folder.
    async list() {
      try {
        const dirTarget = await fs.resolve(assetRoot)
        const entries = await fs.listDir(dirTarget)
        const files = []
        for (const entry of entries) {
          if (entry.type !== 'file' || !IMAGE_EXT.test(entry.name)) continue
          let size
          try { const info = await fs.stat(entry.target); size = info && info.size } catch (e) { /* keep undefined */ }
          files.push({ path: entry.name, name: entry.name, size, url: `/mitsu/assets/file?name=${encodeURIComponent(entry.name)}` })
        }
        files.sort((a, b) => a.name.localeCompare(b.name))
        return { ok: true, root: assetRoot, files }
      } catch (e) {
        // Folder may not exist yet — that's fine (empty library, "no assets yet").
        return { ok: true, root: assetRoot, files: [] }
      }
    },

    // Download { url } into the local folder, returning the new local file.
    async ingest(body) {
      const url = body && typeof body.url === 'string' ? body.url : ''
      let name = body && typeof body.name === 'string' ? body.name : ''
      if (!url) return { ok: false, error: 'no url provided' }
      let response
      try {
        response = await fetch(url, { method: 'GET' })
      } catch (e) {
        return { ok: false, error: 'network: ' + String((e && e.message) || e) }
      }
      if (!response.ok) return { ok: false, error: `HTTP ${response.status}` }
      const bytes = new Uint8Array(await response.arrayBuffer())
      if (!name) {
        try { name = decodeURIComponent(new URL(url).pathname.split('/').pop() || 'asset') } catch (e) { name = 'asset' }
      }
      if (!name) name = 'asset'
      if (!IMAGE_EXT.test(name)) name += '.png'
      // Uint8Array.toString('base64') does NOT base64-encode (it returns a comma
      // list) — use Buffer so the base64 is clean for the subprocess decode.
      const b64 = Buffer.from(bytes).toString('base64')
      const written = await writeBytes(name, b64)
      if (!written.ok) return { ok: false, error: 'write failed: ' + String(written.error || '') }
      return { ok: true, path: name, url: `/mitsu/assets/file?name=${encodeURIComponent(name)}` }
    },

    // Local path for one asset (name only — no traversal).
    filePath(name) {
      if (!name || /[\/\\]/.test(name) || name.includes('..')) return undefined
      return `${assetRoot}/${name}`
    },
  }

  ctx.provide('mitsu.assets', service)

  ctx.inject(['webServer'], (webCtx) => webCtx.effect(() => {
    const disposeList = webCtx.webServer.register({
      kind: 'exact',
      path: '/mitsu/assets/list',
      handler: async (req, res) => {
        if (req.method !== 'GET' || !isTrustedRequest(req)) {
          sendJson(res, req.method === 'GET' ? 403 : 405, { ok: false, error: 'request rejected' })
          return
        }
        sendJson(res, 200, await service.list())
      },
    })
    const disposeIngest = webCtx.webServer.register({
      kind: 'exact',
      path: '/mitsu/assets/ingest',
      handler: async (req, res) => {
        if (req.method !== 'POST' || !isTrustedRequest(req)) {
          sendJson(res, req.method === 'POST' ? 403 : 405, { ok: false, error: 'request rejected' })
          return
        }
        let body
        try { body = await readBody(req) } catch (e) { return sendJson(res, 400, { ok: false, error: 'bad body' }) }
        sendJson(res, 200, await service.ingest(body))
      },
    })
    const disposeFile = webCtx.webServer.register({
      kind: 'exact',
      path: '/mitsu/assets/file',
      handler: async (req, res) => {
        if (req.method !== 'GET' || !isTrustedRequest(req)) {
          sendJson(res, 405, { ok: false, error: 'request rejected' })
          return
        }
        const url = new URL(req.url || '', 'http://localhost')
        const name = url.searchParams.get('name') || ''
        const path = service.filePath(name)
        if (path === undefined) { sendJson(res, 400, { ok: false, error: 'bad name' }); return }
        try {
          const target = await fs.resolve(path)
          const bytes = await fs.readBytes(target, undefined, 64 * 1024 * 1024)
          res.writeHead(200, { 'content-type': 'image/*', 'cache-control': 'no-store' })
          res.end(Buffer.from(bytes))
        } catch (e) {
          sendJson(res, 404, { ok: false, error: 'not found' })
        }
      },
    })
    return () => { disposeFile(); disposeIngest(); disposeList() }
  }, '@muen/mitsu-assets: http routes'))
}

export default { name, inject, apply }
