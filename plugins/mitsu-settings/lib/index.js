/**
 * @muen/mitsu-settings — Host half (fork plugin).
 *
 * Epic 3 (Settings / Mitsu Plugins / Advanced) host seam, over the fork's
 * plugin shape (raw JS, lib/index.js + lib/client.js). Unlike the pure-client
 * Mitsu surfaces (rail, modes), Settings needs host data — the composed plugin
 * table and curated toggle state — so this half provides the `mitsu.settings`
 * service plus loopback-guarded webServer routes the browser half fetches:
 *
 *   /mitsu/settings/list       → curated Mitsu plugin catalog + live state
 *   /mitsu/settings/toggle     → set one curated plugin's enabled flag (body)
 *   /mitsu/settings/uninstall  → pnpm-remove one curated plugin (body)
 *   /mitsu/settings/plugins    → raw composed plugin table (Cordis loader)
 *
 * The Mitsu Plugins page lives as a `settings.plugins.tab` (the "Mitsu" tab in
 * the Settings → Plugins section, next to the plugin-market tabs), so it uses
 * the same enable/disable/uninstall semantics as the market's manager UX:
 *
 *   - enable/disable writes a `disabled:` row to the profile's
 *     cordis.patch.yml (patchReload: live → hot reload, same mechanism the
 *     dsh plugin-market manager uses)
 *   - uninstall runs `pnpm remove <pkg>` in the profile dir and reconciles
 *     `dsh.profile.bundles` (the `dsh plugin remove` equivalent)
 */
import { readFile, rename, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

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
 * can report whether the plugin is actually composed); `entry` is the loader
 * row id its bundle patch declares (the id-target the user patch disables).
 */
const CATALOG = [
  { id: '@muen/mitsu-rail', entry: 'mitsu-rail', name: 'Docs rail', description: 'Right-side markdown reader over the workspace.' },
  { id: 'dsh-file-explorer', entry: 'dsh-file-explorer', name: 'File explorer', description: 'Right-side file tree, preview, and editor.' },
  { id: '@muen/mitsu-settings', entry: 'mitsu-settings', name: 'Mitsu settings', description: 'This curated catalog and the Advanced layer.' },
]

/** The profile root as a file URL (the harness mounts bundles from it). */
function profileRoot(ctx) {
  if (ctx.baseUrl === undefined || !ctx.baseUrl.startsWith('file:')) return null
  return fileURLToPath(ctx.baseUrl)
}

/**
 * Line-based cordis.patch.yml editing: set or clear the `disabled:` field of
 * one loader row. Only the target row is touched, so comments and unrelated
 * rows survive byte-for-byte (same approach as the dsh plugin-market manager).
 */
function upsertDisabled(text, entryId, disabled) {
  const value = disabled ? 'true' : 'false'
  const lines = text.split('\n')
  const isIdLine = (line) => {
    const trimmed = line.trim()
    return trimmed === `- id: ${entryId}` || trimmed === `- id: "${entryId}"` || trimmed === `- id: '${entryId}'`
  }
  const idLine = lines.findIndex(isIdLine)
  if (idLine !== -1) {
    const indent = /^([ \t]*)/.exec(lines[idLine])[1]
    for (let i = idLine + 1; i < lines.length; i++) {
      const line = lines[i]
      if (line.length > 0 && !/^[ \t]/.test(line)) break
      if (/^[ \t]*disabled:[ \t]*/.test(line)) {
        lines[i] = `${indent}  disabled: ${value}`
        return lines.join('\n')
      }
    }
    lines.splice(idLine + 1, 0, `${indent}  disabled: ${value}`)
    return lines.join('\n')
  }
  // No row yet — append a complete id-targeted row (JSON is valid YAML).
  const row = `- id: ${JSON.stringify(entryId)}\n  disabled: ${value}`
  const withoutEmptyRoot = text.replace(/^[ \t]*\[\][ \t]*(?:\r?\n|$)/m, '')
  return `${withoutEmptyRoot}${withoutEmptyRoot.length === 0 || withoutEmptyRoot.endsWith('\n') ? '' : '\n'}${row}`
}

/** Read the user patch, treating a fresh profile as an empty list. */
async function readPatch(path) {
  try { return await readFile(path, 'utf8') }
  catch (error) {
    if (error.code === 'ENOENT') return '[]\n'
    throw error
  }
}

/** Atomically replace the user patch file. */
async function writePatch(path, content) {
  const temporary = `${path}.mitsu.tmp`
  await writeFile(temporary, content, 'utf8')
  await rename(temporary, path)
}

/** Run pnpm in the profile directory (uninstall) with a bounded timeout. */
function runPnpm(dir, args) {
  return new Promise((resolve) => {
    const child = spawn('pnpm', args, { cwd: dir, stdio: 'pipe' })
    let output = ''
    child.stdout.on('data', (d) => { output += String(d) })
    child.stderr.on('data', (d) => { output += String(d) })
    const timer = setTimeout(() => child.kill('SIGTERM'), 5 * 60 * 1000)
    child.on('error', (error) => { clearTimeout(timer); resolve({ ok: false, output: String(error.message || error) }) })
    child.on('exit', (code) => { clearTimeout(timer); resolve({ ok: code === 0, output }) })
  })
}

/** Drop a removed package from `dsh.profile.bundles` (the dsh plugin reconcile). */
async function reconcileBundles(dir, packageName) {
  const path = join(dir, 'package.json')
  let manifest
  try { manifest = JSON.parse(await readFile(path, 'utf8')) }
  catch { return }
  const bundles = (manifest.dsh && manifest.dsh.profile && manifest.dsh.profile.bundles) || []
  if (!bundles.includes(packageName)) return
  manifest.dsh.profile.bundles = bundles.filter((b) => b !== packageName)
  await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
}

/** Split a patch text into (lines, index of the `- id:` row for entryId). */
function locateEntry(lines, entryId) {
  const isIdLine = (line) => {
    const trimmed = line.trim()
    return trimmed === `- id: ${entryId}` || trimmed === `- id: "${entryId}"` || trimmed === `- id: '${entryId}'`
  }
  return lines.findIndex(isIdLine)
}

/** Whether the patch currently marks a loader row disabled. */
function patchDisabledAt(lines, entryId) {
  const idLine = locateEntry(lines, entryId)
  if (idLine === -1) return false
  for (let i = idLine + 1; i < lines.length; i++) {
    const line = lines[i]
    if (line.length > 0 && !/^[ \t]/.test(line)) break
    const match = /^[ \t]*disabled:[ \t]*(.*)$/.exec(line)
    if (match) return match[1].trim() === 'true'
  }
  return false
}

function apply(ctx) {
  const loader = ctx.get('loader')
  const clientModules = ctx.get('clientModules')
  const root = profileRoot(ctx)
  const patchFile = root === null ? null : join(root, 'cordis.patch.yml')

  // The raw composed plugin table for the Advanced page (read-only).
  // Prefer the Cordis loader (available in every boot — the same source the
  // shipped plugin-inventory gateway wraps); fall back to the web table when
  // only clientModules is present; null means no table is reachable here.
  const rawEntries = () => {
    if (loader !== undefined) {
      try {
        const entries = []
        for (const entry of loader.entries()) {
          if (!entry || (entry.options && entry.options.group)) continue
          const state = entry.fiber && entry.fiber.state
          entries.push({
            id: entry.id,
            name: entry.options && entry.options.name,
            enabled: !entry.disabled,
            phase: state === undefined ? null : ['pending', 'loading', 'active', 'failed', null, 'unloading'][state] || null,
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

  // Process-local fallback for hosts without a file-based profile patch.
  const enabledState = new Map(CATALOG.map((c) => [c.id, true]))

  const service = {
    // Curated catalog merged with live composition + patch state.
    async list() {
      const raw = rawEntries()
      const composed = raw === null ? null : new Set(raw.map((e) => e.name || e.id))
      let patchText = ''
      if (patchFile !== null) {
        try { patchText = await readPatch(patchFile) } catch (e) { patchText = '' }
      }
      const lines = patchText === '' ? [] : patchText.split('\n')
      return {
        ok: true,
        patchAvailable: patchFile !== null,
        items: CATALOG.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          entry: c.entry,
          enabled: !patchDisabledAt(lines, c.entry),
          installed: composed === null ? null : composed.has(c.id),
          uninstallable: composed === null ? null : composed.has(c.id),
        })),
      }
    },

    // Raw plugin table for the Advanced page (read-only).
    plugins() {
      const raw = rawEntries()
      if (raw === null) return { ok: false, error: 'Raw plugin table unavailable in this profile.' }
      return { ok: true, entries: raw }
    },

    // Set one curated plugin's enabled flag: real patch write (hot-reloads),
    // falling back to process-local state when no profile patch is reachable.
    async toggle(id, enabled) {
      const catalog = CATALOG.find((c) => c.id === id)
      if (catalog === undefined) return { ok: false, error: 'unknown plugin: ' + id }
      if (patchFile === null) {
        enabledState.set(id, !!enabled)
        return service.list()
      }
      try {
        const current = await readPatch(patchFile)
        await writePatch(patchFile, upsertDisabled(current, catalog.entry, !enabled))
        return service.list()
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : String(error) }
      }
    },

    // pnpm-remove one curated plugin from the profile + drop its bundle row.
    async uninstall(id) {
      const catalog = CATALOG.find((c) => c.id === id)
      if (catalog === undefined) return { ok: false, error: 'unknown plugin: ' + id }
      if (root === null) return { ok: false, error: 'No file-based profile root in this host.' }
      const result = await runPnpm(root, ['remove', catalog.id])
      if (!result.ok) return { ok: false, error: `pnpm remove failed (${result.output.slice(-400) || 'no output'})` }
      await reconcileBundles(root, catalog.id)
      return service.list()
    },
  }

  ctx.provide('mitsu.settings', service)

  // Browser reachability — loopback-guarded routes over the same service.
  ctx.inject(['webServer'], (webCtx) => webCtx.effect(() => {
    const handlers = {
      list: async (req, res) => {
        if (req.method !== 'GET' || !isTrustedRequest(req)) {
          sendJson(res, req.method === 'GET' ? 403 : 405, { ok: false, error: 'request rejected' })
          return
        }
        sendJson(res, 200, await service.list())
      },
      plugins: async (req, res) => {
        if (req.method !== 'GET' || !isTrustedRequest(req)) {
          sendJson(res, req.method === 'GET' ? 403 : 405, { ok: false, error: 'request rejected' })
          return
        }
        sendJson(res, 200, service.plugins())
      },
      toggle: async (req, res) => {
        if (req.method !== 'POST' || !isTrustedRequest(req)) {
          sendJson(res, req.method === 'POST' ? 403 : 405, { ok: false, error: 'request rejected' })
          return
        }
        let body
        try { body = await readBody(req) } catch (e) { return sendJson(res, 400, { ok: false, error: 'bad body' }) }
        sendJson(res, 200, await service.toggle(body && body.id, body && body.enabled))
      },
      uninstall: async (req, res) => {
        if (req.method !== 'POST' || !isTrustedRequest(req)) {
          sendJson(res, req.method === 'POST' ? 403 : 405, { ok: false, error: 'request rejected' })
          return
        }
        let body
        try { body = await readBody(req) } catch (e) { return sendJson(res, 400, { ok: false, error: 'bad body' }) }
        sendJson(res, 200, await service.uninstall(body && body.id))
      },
    }
    const disposeList = webCtx.webServer.register({ kind: 'exact', path: '/mitsu/settings/list', handler: handlers.list })
    const disposePlugins = webCtx.webServer.register({ kind: 'exact', path: '/mitsu/settings/plugins', handler: handlers.plugins })
    const disposeToggle = webCtx.webServer.register({ kind: 'exact', path: '/mitsu/settings/toggle', handler: handlers.toggle })
    const disposeUninstall = webCtx.webServer.register({ kind: 'exact', path: '/mitsu/settings/uninstall', handler: handlers.uninstall })
    return () => {
      disposeUninstall()
      disposeToggle()
      disposePlugins()
      disposeList()
    }
  }, '@muen/mitsu-settings: http routes'))
}

export default { name, inject, apply }
