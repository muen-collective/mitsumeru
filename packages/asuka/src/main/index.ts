import { app, BrowserWindow, dialog, ipcMain, session, shell } from 'electron'
import { join } from 'node:path'
import { mkdirSync, writeFileSync } from 'node:fs'
import { spawnHarness, harnessPaths, type HarnessSession } from './harness'
import { APP_NAME, HARNESS_TITLES } from '../shared/identity'

/**
 * asuka — our own Electron shell around a DSH release (Epic 86 Track B).
 * - spawn + poll + load (the harness is a child process; never imported here)
 * - single instance lock
 * - shutdown — SIGTERM with 4s grace → SIGKILL, tracked + logged
 * - window lockdown — sandbox, origin-restricted navigation, deny handlers
 */

const log = (message: string): void => {
  console.log(`[${APP_NAME}] ${message}`)
}

const smoke = process.env.ASUKA_SMOKE === '1'
// v5 lockdown scripted attempts: when set, the loaded UI fires intentional
// violations so the deny log can be asserted (expected denies == 1).
const lockdownProbe = process.env.ASUKA_LOCKDOWN_PROBE === '1'
// File-action probe: injects a real path (+ a backticked one and a missing one)
// and drives trusted clicks so reveal/miss can be asserted from the log.
// Click probe: drives a trusted click on an injected external link.
const clickProbe = process.env.ASUKA_CLICK_PROBE === '1'

let mainWindow: BrowserWindow | null = null
let session_harness: HarnessSession | null = null
let harnessLogPath = ''
let harnessOrigin = '' // set once the readiness URL is known; navigation fence
let harnessUiLoaded = false
let gotSingleInstanceLock = false

// ---- T3: single instance lock ---------------------------------------------

gotSingleInstanceLock = app.requestSingleInstanceLock()
if (!gotSingleInstanceLock) {
  // A first instance already owns the lock. Never spawn a second harness:
  // quit before whenReady/startup runs.
  log('single-instance-denied quit')
  app.quit()
} else {
  app.on('second-instance', (_event, argv, workingDirectory) => {
    log(`second-instance argv=${JSON.stringify(argv.slice(1))} cwd=${workingDirectory}`)
    if (mainWindow !== null) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
      log('second-instance-focused-existing-window')
    }
  })
}

// ---- window + lockdown (T5) ------------------------------------------------

function isHarnessNavigation(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false
    if (harnessOrigin === '') return true // before any harness URL is known
    return parsed.origin === harnessOrigin
  } catch {
    return false
  }
}

function createSplashWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: APP_NAME,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    }
  })

  win.once('ready-to-show', () => {
    win.show()
    log('window-shown')
  })

  win.webContents.on('did-finish-load', () => {
    log(`window-title ${win.webContents.getTitle()}`)
    if (HARNESS_TITLES.includes(win.webContents.getTitle())) {
      harnessUiLoaded = true
      log('harness-ui-loaded')
    }
  })

  // T5: navigation fence — renderer/user navigation may only stay on the
  // harness origin. (webContents.loadURL from main is not affected.)
  win.webContents.on('will-navigate', (event, url) => {
    if (!isHarnessNavigation(url)) {
      event.preventDefault()
      log(`[lockdown] deny navigate ${url}`)
    }
  })

  // T5 + external-link policy: window.open / target=_blank is denied outright.
  // A browser launch is only ever driven by a real click, which arrives through
  // the 'asuka:open-external' IPC below. Scripted opens therefore open
  // nothing at all — no iframe, no stray browser tab.
  win.webContents.setWindowOpenHandler(({ url }) => {
    log(`[lockdown] deny window-open ${url}`)
    return { action: 'deny' }
  })

  // T5: no webviews attach to this window, ever.
  win.webContents.on('will-attach-webview', (event) => {
    event.preventDefault()
    log('[lockdown] deny webview-attach')
  })

  return win
}

// T5: permission requests (notifications, geolocation, media, …) → deny all.
// The wrapped harness UI needs none of them; revisit per-feature if that
// ever changes instead of opening the gate. Registered once app is ready —
// session.defaultSession is unavailable before then.
function installPermissionDenial(): void {
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    log(`[lockdown] deny permission ${permission}`)
    callback(false)
  })
}

// External-link policy: the preload forwards trusted link clicks here. This is
// the ONLY code path that opens a browser.
function installExternalLinkHandler(): void {
  ipcMain.on('asuka:open-external', (event, url: unknown) => {
    if (typeof url !== 'string') return
    // Only the harness page may ask the shell to open something.
    const senderUrl = event.senderFrame?.url ?? ''
    if (!isHarnessNavigation(senderUrl)) {
      log(`[lockdown] deny open-external-sender ${senderUrl}`)
      return
    }
    if (isHarnessNavigation(url)) return // in-app links stay in-app
    if (!/^https?:\/\//u.test(url)) return
    log(`[lockdown] open-external (click) ${url}`)
    void shell.openExternal(url)
  })
}

// ---- splash + harness lifecycle -------------------------------------------

function loadSplash(): void {
  if (mainWindow === null) return
  if (process.env.ELECTRON_RENDERER_URL) {
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

async function startHarnessAndLoad(): Promise<void> {
  // State lives under Electron's userData (Epic 86 T8: pick once, never rename).
  const stateDir = process.env.ASUKA_DSH_HOME ?? join(app.getPath('userData'), 'harness')
  const logDir = process.env.ASUKA_LOG_DIR ?? join(app.getPath('userData'), 'logs')
  const paths = harnessPaths({ stateDir, logDir })
  harnessLogPath = paths.logPath
  log(`harness entry=${paths.entry}`)
  log(`harness stateDir=${paths.stateDir}`)
  log(`harness log=${paths.logPath}`)

  session_harness = spawnHarness({
    ...paths,
    onEvent: (event) => log(`harness ${event}`)
  })

  try {
    const readyUrl = await session_harness.readyUrl
    harnessOrigin = new URL(readyUrl).origin
    log(`harness-ready ${readyUrl}`)
    // Every boot mints a fresh token, but harness cookies are keyed by HOST
    // (127.0.0.1), not by port. A cookie left over from a previous boot makes
    // the browser-trust fence answer with a fallback page — no <title>, ~27 DOM
    // nodes — instead of the app. Seen on the 4th consecutive launch of a
    // verification run. Clear them before every load; this shell uses the
    // default session for nothing else. (The harness's own state lives in
    // DSH_HOME, not in the browser profile, so nothing real is lost.)
    await session.defaultSession.clearStorageData({ storages: ['cookies'] })
    log('harness-cookies-cleared')
    if (mainWindow === null) throw new Error('window closed before harness ready')
    // Electron handles the 303 + session cookie natively; title flips to the
    // harness marker once the real UI finishes loading.
    await mainWindow.loadURL(readyUrl)

    if (lockdownProbe && !smoke) {
      // v5 scripted violation: force a window.open from the harness page.
      // Expected result: one [lockdown] deny window-open line, plus one
      // [lockdown] open-external line (the deliberate handoff to the system
      // browser). The URL path self-identifies so the browser tab is obviously
      // the probe, not a stray.
      await mainWindow.webContents.executeJavaScript(
        "window.open('https://example.com/asuka-lockdown-probe','_blank'); 'probe-fired'"
      )
      setTimeout(() => {
        log('lockdown-probe-done')
        app.quit()
      }, 1500)
    }

    if (clickProbe && !smoke) {
      // v5b: prove the click path end to end with TRUSTED input. A synthetic
      // JS click would be filtered by event.isTrusted, so drive real mouse
      // events at the coordinates of an injected external anchor.
      const rectJson = (await mainWindow.webContents.executeJavaScript(`(() => {
        const a = document.createElement('a')
        a.id = 'wp-click-probe'
        a.href = 'https://example.com/asuka-click-probe'
        a.textContent = 'asuka click probe'
        a.style.cssText = 'position:fixed;top:12px;left:12px;z-index:2147483647;padding:8px;background:#fff;color:#000'
        document.body.appendChild(a)
        const r = a.getBoundingClientRect()
        return JSON.stringify({ x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) })
      })()`)) as string
      const { x, y } = JSON.parse(rectJson) as { x: number; y: number }
      mainWindow.webContents.sendInputEvent({ type: 'mouseMove', x, y })
      mainWindow.webContents.sendInputEvent({ type: 'mouseDown', x, y, button: 'left', clickCount: 1 })
      mainWindow.webContents.sendInputEvent({ type: 'mouseUp', x, y, button: 'left', clickCount: 1 })
      setTimeout(() => {
        log('click-probe-done')
        app.quit()
      }, 1500)
    }

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log(`harness-failed ${message}`)
    if (smoke) {
      app.exit(1)
      return
    }
    const choice = await dialog.showMessageBox({
      type: 'error',
      title: APP_NAME,
      message: 'The DSH harness failed to start.',
      detail: message,
      buttons: ['Retry', 'Show Log', 'Quit'],
      defaultId: 0,
      cancelId: 2
    })
    if (choice.response === 0) {
      session_harness?.stop('retry')
      void startHarnessAndLoad()
    } else if (choice.response === 1) {
      void shell.openPath(harnessLogPath)
    } else {
      app.quit()
    }
  }
}

// T6: screenshot evidence — capture the rendered DSH UI to artifacts/ after
// the SPA has had time to paint, and log the DOM size as a blank-page guard.
async function captureEvidence(dir: string): Promise<void> {
  if (mainWindow === null) return
  try {
    await new Promise((resolve) => setTimeout(resolve, 5000)) // SPA paint settle
    const domNodes = await mainWindow.webContents.executeJavaScript(
      "document.querySelectorAll('*').length"
    )
    log(`dom-nodes ${String(domNodes)}`)
    const image = await mainWindow.webContents.capturePage()
    if (image.isEmpty()) {
      log('screenshot-empty')
      return
    }
    if (process.env.ASUKA_DOM_DEBUG === '1') {
      // Diagnostic only: is the UI still booting at the 5s mark, and what is
      // actually on screen?
      await new Promise((resolve) => setTimeout(resolve, 10000))
      const late = await mainWindow.webContents.executeJavaScript("document.querySelectorAll('*').length")
      const text = await mainWindow.webContents.executeJavaScript(
        "(document.body.innerText || '').replace(/\\s+/g, ' ').slice(0, 300)"
      )
      log(`dom-nodes-late ${String(late)}`)
      log(`body-text ${String(text)}`)
    }
    mkdirSync(dir, { recursive: true })
    const stamp = Date.now()
    const file = join(dir, `screenshot-${stamp}.png`)
    writeFileSync(file, image.toPNG())
    log(`screenshot ${file}`)
  } catch (error) {
    log(`screenshot-failed ${error instanceof Error ? error.message : String(error)}`)
  }
}

// ---- app lifecycle ---------------------------------------------------------

app.whenReady().then(() => {
  if (!gotSingleInstanceLock) return // denied instance: already quitting
  log('app-ready')
  installPermissionDenial()
  installExternalLinkHandler()
  mainWindow = createSplashWindow()
  loadSplash()
  void startHarnessAndLoad()

  if (smoke) {
    // Auto-quit once the harness UI reported loaded (or after a hard cap so a
    // hang fails the run instead of blocking forever).
    const deadline = setTimeout(() => {
      log('smoke-timeout')
      app.exit(1)
    }, 60_000)
    let captured = false
    const check = setInterval(() => {
      if (harnessUiLoaded) {
        if (process.env.ASUKA_SCREENSHOT === '1' && !captured) {
          // Evidence capture once, then quit via the same path.
          captured = true
          clearInterval(check)
          clearTimeout(deadline)
          // Always quit after capture (success or failure) so a capture hang
          // cannot block the smoke run forever.
          // out/main → ../../artifacts = packages/asuka/artifacts in dev.
          void captureEvidence(join(__dirname, '../../artifacts')).finally(() => {
            log('smoke-quit')
            app.quit()
          })
          return
        }
        clearInterval(check)
        clearTimeout(deadline)
        log('smoke-quit')
        app.quit()
      }
    }, 250)
  }
})

app.on('window-all-closed', () => {
  log('window-all-closed')
  app.quit()
})

// T4: shutdown path. will-quit → SIGTERM to the harness child; harness.ts
// escalates to SIGKILL after a 4s grace. The child 'exited' event is logged
// by the onEvent callback so the timing can be asserted.
app.on('will-quit', () => {
  log('will-quit')
  session_harness?.stop('quit')
})

process.on('exit', (code) => {
  log(`exit code=${String(code)}`)
})
