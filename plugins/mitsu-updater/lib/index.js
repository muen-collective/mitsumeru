/**
 * @muen/mitsu-updater — Host half.
 *
 * Checks the muen fork (the git checkout this harness runs from) for new
 * commits on the current branch, and offers to pull them. The browser half
 * renders a toast in `shell.overlay`; the host owns the git work:
 *
 *   GET  /mitsu/update/status     → { phase, version, commitsBehind, message, skipped }
 *   POST /mitsu/update/check      → re-run the git fetch + compare now
 *   POST /mitsu/update/pull       → git pull --ff-only (async; status reflects it)
 *   POST /mitsu/update/skip       → remember "skip this version" in the app home
 *
 * Phases mirror the dsh-desktop updater card: checking → available →
 * pulling → pulled → up-to-date / error. A pulled update needs a restart to
 * take effect; the browser shows "Reload to apply" (the mitsu command boots
 * the same checkout, so a restart picks up the pulled files).
 *
 * All routes are loopback-only, same hygiene as @muen/mitsu-docs. Both the git
 * commands and the skip-file read/write run through the host `subprocess`
 * service (raw child_process, not sandboxed) — the fs service is sandboxed and
 * would deny writes outside the workspace.
 */
const name = 'mitsu-updater'
const inject = ['timer', 'subprocess']

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000   // every 6h
const STARTUP_DELAY_MS = 15 * 1000             // first check after 15s
const STARTUP_JITTER_MS = 15 * 1000            // + 0..15s random

/** Resolve the fork checkout root: MITSU_DIR env (set by the launcher/installer). */
function forkRoot() {
  const p = process.env.MITSU_DIR
  if (p && p.length > 0) return p
  return undefined
}

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
  const fork = forkRoot()
  if (fork === undefined) return
  const timer = ctx.get('timer')
  if (timer === undefined) return
  const subprocess = ctx.get('subprocess')
  if (subprocess === undefined) return

  const home = process.env.DSH_HOME || ''
  const skipPath = home ? `${home}/update-skip.json` : ''
  let skipped = null
  let status = { phase: 'idle', version: null, commitsBehind: 0, message: '', skipped: false }
  let checking = false
  let pulling = false

  /**
   * Run one shell command in the fork, collecting stdout. Everything the host
   * needs to touch is outside the sandboxed fs world, so we go through the raw
   * subprocess seam (same as git).
   */
  function sh(args, cwd) {
    return new Promise((resolve) => {
      let out = ''
      let err = ''
      try {
        const spec = {
          argv: args,
          cwd: cwd || fork,
          stdio: {
            stdin: { data: '' },
            stdout: { maxBytes: 1024 * 1024 },
            stderr: { maxBytes: 1024 * 1024 },
          },
          graceMs: 60000,
        }
        const handle = subprocess.spawn(spec)
        handle.done.then((outcome) => {
          try {
            const so = handle.collected.stdout
            const se = handle.collected.stderr
            if (so) { const r = so.readFrom(0); if (r) out = r.text }
            if (se) { const r = se.readFrom(0); if (r) err = r.text }
          } catch { /* ignore */ }
          resolve({ ok: outcome.exitCode === 0, out, err, exitCode: outcome.exitCode })
        }).catch(() => resolve({ ok: false, out, err: String(err), exitCode: null }))
      } catch (e) {
        resolve({ ok: false, out, err: String(e && e.message || e), exitCode: null })
      }
    })
  }

  const git = (args) => sh(['git', ...args])
  const cat = (path) => sh(['cat', path], '/')
  const writeFile = (path, content) => sh(['sh', '-c', 'mkdir -p "$(dirname "$1")" && printf "%s" "$2" > "$1"', 'sh', path, content], '/')

  /** Read the skipped-version marker (best effort; missing file = no skip). */
  async function loadSkip() {
    try {
      if (!skipPath) return
      const res = await cat(skipPath)
      if (!res.ok || !res.out.trim()) return
      const parsed = JSON.parse(res.out)
      if (parsed && typeof parsed.version === 'string') skipped = parsed.version
    } catch { skipped = null }
  }

  /** Persist the skipped version in the app home. */
  async function saveSkip(version) {
    try {
      if (!skipPath) return
      await writeFile(skipPath, JSON.stringify({ version }, null, 2))
      skipped = version
    } catch { /* best effort */ }
  }

  /** Fetch origin and report how far behind the current branch is. */
  async function checkNow() {
    if (checking || pulling) return status
    checking = true
    status = { ...status, phase: 'checking', message: '', skipped: false }
    try {
      const fetch = await git(['fetch', 'origin'])
      if (!fetch.ok) {
        status = { ...status, phase: 'error', message: (fetch.err || fetch.out || 'git fetch failed').trim().slice(0, 300) }
        return status
      }
      const branchRes = await git(['rev-parse', '--abbrev-ref', 'HEAD'])
      const branch = branchRes.ok ? branchRes.out.trim() : 'HEAD'
      const localRes = await git(['rev-parse', 'HEAD'])
      const remoteRes = await git(['rev-parse', 'origin/' + branch])
      const countRes = await git(['rev-list', '--count', 'HEAD..origin/' + branch])
      const local = localRes.ok ? localRes.out.trim() : ''
      const remote = remoteRes.ok ? remoteRes.out.trim() : ''
      const commitsBehind = countRes.ok ? Number(countRes.out.trim()) || 0 : 0

      if (remote && local && remote !== local && commitsBehind > 0) {
        status = {
          phase: 'available',
          version: remote.slice(0, 12),
          commitsBehind,
          message: `${commitsBehind} new commit${commitsBehind > 1 ? 's' : ''} on ${branch}`,
          skipped: skipped === remote,
        }
      } else {
        status = { ...status, phase: 'up-to-date', version: local.slice(0, 12), commitsBehind: 0, message: '' }
      }
    } catch (e) {
      status = { ...status, phase: 'error', message: String(e && e.message || e).slice(0, 300) }
    } finally {
      checking = false
    }
    return status
  }

  /** git pull --ff-only; phase becomes 'pulled' (restart needed) or 'error'. */
  async function pullNow() {
    if (pulling || checking) return status
    pulling = true
    status = { ...status, phase: 'pulling', message: '' }
    try {
      const res = await git(['pull', '--ff-only', 'origin', 'HEAD'])
      if (res.ok) {
        status = { ...status, phase: 'pulled', message: 'Update pulled — reload mitsu to apply it.' }
      } else {
        status = { ...status, phase: 'error', message: (res.err || res.out || 'git pull failed').trim().slice(0, 300) }
      }
    } catch (e) {
      status = { ...status, phase: 'error', message: String(e && e.message || e).slice(0, 300) }
    } finally {
      pulling = false
    }
    return status
  }

  void loadSkip().then(() => { void checkNow() })

  // Startup check (jittered) + periodic.
  const startupDelay = STARTUP_DELAY_MS + Math.random() * STARTUP_JITTER_MS
  const disposeStartup = timer.timeout(() => { void checkNow() }, startupDelay)
  const disposeInterval = timer.interval(() => { void checkNow() }, CHECK_INTERVAL_MS)

  const disposeRoutes = ctx.inject(['webServer'], (webCtx) => webCtx.effect(() => {
    const disposeStatus = webCtx.webServer.register({
      kind: 'exact',
      path: '/mitsu/update/status',
      handler: async (req, res) => {
        if (req.method !== 'GET' || !isTrustedRequest(req)) {
          sendJson(res, req.method === 'GET' ? 403 : 405, { ok: false, error: 'request rejected' })
          return
        }
        sendJson(res, 200, { ok: true, ...status })
      },
    })
    const disposeCheck = webCtx.webServer.register({
      kind: 'exact',
      path: '/mitsu/update/check',
      handler: async (req, res) => {
        if (req.method !== 'POST' || !isTrustedRequest(req)) {
          sendJson(res, req.method === 'POST' ? 403 : 405, { ok: false, error: 'request rejected' })
          return
        }
        const next = await checkNow()
        sendJson(res, 200, { ok: true, ...next })
      },
    })
    const disposePull = webCtx.webServer.register({
      kind: 'exact',
      path: '/mitsu/update/pull',
      handler: async (req, res) => {
        if (req.method !== 'POST' || !isTrustedRequest(req)) {
          sendJson(res, req.method === 'POST' ? 403 : 405, { ok: false, error: 'request rejected' })
          return
        }
        const next = await pullNow()
        sendJson(res, 200, { ok: true, ...next })
      },
    })
    const disposeSkip = webCtx.webServer.register({
      kind: 'exact',
      path: '/mitsu/update/skip',
      handler: async (req, res) => {
        if (req.method !== 'POST' || !isTrustedRequest(req)) {
          sendJson(res, req.method === 'POST' ? 403 : 405, { ok: false, error: 'request rejected' })
          return
        }
        const body = await readJson(req)
        if (body.version) await saveSkip(body.version)
        status = { ...status, skipped: true }
        sendJson(res, 200, { ok: true, ...status })
      },
    })
    return () => {
      disposeStatus(); disposeCheck(); disposePull(); disposeSkip()
    }
  }, '@muen/mitsu-updater: http routes'))

  return () => {
    disposeStartup()
    disposeInterval()
    disposeRoutes()
  }
}

export default { name, inject, apply }
