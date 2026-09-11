import { spawn, type ChildProcess } from 'node:child_process'
import { createWriteStream, existsSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

import { HARNESS_PACKAGE } from '../shared/identity'

export interface HarnessConfig {
  /** Absolute path to the DSH CLI entry (apps/cli/lib/bin.js at the pinned ref). */
  entry: string
  /** Working directory for the child (repo root). */
  cwd: string
  /** Isolated DSH_HOME — all harness user data lands here, never ~/.dsh. */
  stateDir: string
  /** Absolute path for the harness log file (stdout+stderr tee). */
  logPath: string
  /** Milliseconds to wait for the readiness line before failing. */
  readyTimeoutMs?: number
  /** Optional callback for lifecycle events (logged by the shell). */
  onEvent?: (event: string) => void
}

export interface HarnessSession {
  child: ChildProcess
  /** Resolves with the tokenized readiness URL, rejects on timeout/exit. */
  readyUrl: Promise<string>
  /** Send SIGTERM, then SIGKILL after the grace period if still alive. */
  stop: (reason?: string) => void
}

/** Resolve the node binary Electron should spawn the harness with. */
export function resolveNodePath(): string {
  // npm sets npm_node_execpath when launched via npm scripts — best dev default.
  const fromNpm = process.env.npm_node_execpath
  if (fromNpm !== undefined && fromNpm !== '') return fromNpm
  const fromPath = (process.env.PATH ?? '')
    .split(':')
    .map((dir) => join(dir, 'node'))
    .find(existsSync)
  if (fromPath !== undefined) return fromPath
  // Packaged, launched from Finder: PATH is minimal and node is not on it.
  // Electron's own binary runs as plain node with ELECTRON_RUN_AS_NODE=1, so
  // the app carries no second runtime to ship or keep updated.
  return process.execPath
}

/** True when the harness child will run via Electron-as-node (see resolveNodePath). */
export function runsViaElectronNode(nodePath: string): boolean {
  return nodePath === process.execPath
}

// No reservePort(): we pass --port 0 and let the OS pick — the readiness URL
// on stdout carries the actual port, so there is no reserve/use race at all.

/**
 * The harness readiness signal is a stdout line, NOT an HTTP response:
 * GET / (no token) is 401 by design (browser-trust fence). Each boot prints a
 * fresh per-session token. See artifacts/entry.json (T0 contract).
 */
const READY_LINE = /dsh web: (https?:\/\/127\.0\.0\.1:\d+\/\?token=\S+)/

/** Env for the child: isolate state, strip launcher pollution. */
function childEnv(stateDir: string, viaElectron: boolean): NodeJS.ProcessEnv {
  const clean: NodeJS.ProcessEnv = {}
  for (const [name, value] of Object.entries(process.env)) {
    if (
      value === undefined ||
      name === 'NODE_OPTIONS' ||
      name.startsWith('DSH_DESKTOP_') ||
      /^(?:npm|pnpm|corepack)_/u.test(name)
    ) {
      continue
    }
    clean[name] = value
  }
  clean.DSH_HOME = stateDir
  if (viaElectron) clean.ELECTRON_RUN_AS_NODE = '1'
  return clean
}

export function spawnHarness(config: HarnessConfig): HarnessSession {
  const { entry, cwd, stateDir, logPath, readyTimeoutMs = 45_000, onEvent } = config

  mkdirSync(dirname(logPath), { recursive: true })
  mkdirSync(stateDir, { recursive: true })

  let resolveReady: (url: string) => void = () => {}
  let rejectReady: (error: Error) => void = () => {}
  const readyUrl = new Promise<string>((res, rej) => {
    resolveReady = res
    rejectReady = rej
  })

  let settled = false
  let stdoutBuf = ''
  const timer = setTimeout(() => {
    if (!settled) {
      settled = true
      onEvent?.('ready-timeout')
      rejectReady(new Error(`harness not ready within ${readyTimeoutMs}ms (no 'dsh web:' line on stdout)`))
    }
  }, readyTimeoutMs)

  const nodePath = resolveNodePath()
  // `--expose-internals` is required, and only under Electron-as-node. The
  // profile runs `patchReload: live`, so dsh loads cordis-plugin-hmr for the
  // live patch layer, and HMR refuses to construct without the flag
  // (`--expose-internals is required for HMR service`). Measured 2026-09-11,
  // all four combinations: node boots with or without the flag, electron-as-node
  // **dies** without it and survives with it. The flag is inert where it is not
  // needed, so it is passed on both paths — the boot contract must not depend on
  // which node the shell happened to resolve.
  //
  // This is why 0.1.3-dev booted on a dev machine and died on a real install:
  // `pnpm smoke` launches the app as a child of the shell, so PATH has node and
  // resolveNodePath picks it; launched from Finder PATH is minimal, resolveNodePath
  // falls back to Electron-as-node, and the harness crashed before the UI came up.
  // The smoke run does not reproduce the Finder one — `pnpm smoke:finder` does.
  const child = spawn(
    nodePath,
    [
      ...(runsViaElectronNode(nodePath) ? ['--expose-internals'] : []),
      entry,
      'web',
      '--no-open',
      '--host',
      '127.0.0.1',
      '--port',
      '0'
    ],
    {
      cwd,
      env: childEnv(stateDir, runsViaElectronNode(nodePath)),
      stdio: ['ignore', 'pipe', 'pipe']
    }
  )
  onEvent?.(`spawned pid=${String(child.pid)}`)

  const logStream = createWriteStream(logPath, { flags: 'a' })
  const tee = (chunk: Buffer): void => {
    logStream.write(chunk)
    process.stdout.write(chunk)
    stdoutBuf += chunk.toString()
    const match = READY_LINE.exec(stdoutBuf)
    if (match !== null && !settled) {
      settled = true
      clearTimeout(timer)
      resolveReady(match[1])
    }
  }

  child.stdout?.on('data', tee)
  child.stderr?.on('data', tee)
  child.once('error', (error) => {
    onEvent?.(`spawn-error ${error.message}`)
    if (!settled) {
      settled = true
      clearTimeout(timer)
      rejectReady(error)
    }
  })
  child.once('exit', (code, signal) => {
    onEvent?.(`exited code=${String(code)} signal=${String(signal)}`)
    logStream.end()
    if (!settled) {
      settled = true
      clearTimeout(timer)
      rejectReady(new Error(`harness exited before ready (code=${String(code)} signal=${String(signal)})`))
    }
  })

  let stopped = false
  const stop = (reason = 'shutdown'): void => {
    if (stopped) return
    stopped = true
    if (child.exitCode !== null || child.signalCode !== null) {
      onEvent?.(`stop-skipped ${reason} (already exited)`)
      return
    }
    onEvent?.(`stop ${reason} sigterm pid=${String(child.pid)}`)
    child.kill('SIGTERM')
    const killTimer = setTimeout(() => {
      if (child.exitCode === null && child.signalCode === null) {
        onEvent?.(`stop ${reason} sigkill pid=${String(child.pid)}`)
        child.kill('SIGKILL')
      }
    }, 4000)
    child.once('exit', () => clearTimeout(killTimer))
  }

  return { child, readyUrl, stop }
}

/**
 * Where the harness lives: inside our own install, as the published npm
 * closure — `node_modules/@deepseek-ai/dsh/lib/bin.js`. Epic 86 § Harness
 * artifact: no git checkout, no DSH workspace, no build step.
 *
 * `MITSUMERU_DSH_ENTRY` overrides the entry to wrap a different release (or a
 * built checkout) without touching code — the drill seam.
 */
export function harnessPaths(options: { stateDir: string; logDir: string; resourcesPath?: string }): {
  entry: string
  cwd: string
  stateDir: string
  logPath: string
} {
  // Packaged: the tree built by scripts/prepare-harness.sh, next to the app.
  const installed =
    options.resourcesPath === undefined
      ? resolve(__dirname, '..', '..', 'node_modules', HARNESS_PACKAGE, 'lib', 'bin.js')
      : resolve(options.resourcesPath, 'harness', 'node_modules', HARNESS_PACKAGE, 'lib', 'bin.js')
  const entry = process.env.MITSUMERU_DSH_ENTRY ?? installed
  return {
    entry,
    cwd: resolve(entry, '..', '..'), // the @deepseek-ai/dsh package root
    stateDir: options.stateDir,
    logPath: join(options.logDir, `harness-${String(Date.now())}.log`)
  }
}
