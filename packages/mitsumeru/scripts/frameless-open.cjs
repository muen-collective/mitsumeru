// theme:preview --frameless — a real frameless window on the live app, so the
// drag target can be judged by hand rather than argued about.
//
// Usage: electron scripts/frameless-open.cjs <url> [--no-outline]
const { app, BrowserWindow } = require('electron')
const { windowOptions, applyDragRegions, STRIP_HEIGHT, LIGHT_INSET } = require('./lib/frameless.cjs')

const argv = process.argv.slice(2)
const URL_ARG = argv.find((a) => !a.startsWith('--'))
const SHOW_DRAG = !argv.includes('--no-outline')

if (!URL_ARG) {
  console.error('usage: frameless-open <url> [--no-outline]')
  process.exit(2)
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1440,
    height: 940,
    show: false,
    // The prototype under test: no title bar chrome, native traffic lights
    // kept, content starting at y=0.
    ...windowOptions(),
    webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false }
  })

  // The app's own background, so the strip is not a different colour from the
  // window while the renderer boots.
  win.setBackgroundColor('#141014')

  await win.loadURL(URL_ARG)
  await wait(6000)
  await applyDragRegions(win, { showDrag: SHOW_DRAG })

  // If a session tab strip appears later, the CSS is already in place; this
  // only re-asserts the fallback bar in case the SPA replaced the body.
  win.webContents.on('did-finish-load', () => {
    applyDragRegions(win, { showDrag: SHOW_DRAG }).catch(() => {})
  })

  win.show()

  const measured = await win.webContents.executeJavaScript(`(() => {
    const strip = document.querySelector('[class*="tabStrip"]');
    const bar = document.getElementById('eva-drag-fallback');
    const r = (el) => el ? (() => { const b = el.getBoundingClientRect();
      return { top: Math.round(b.top), h: Math.round(b.height), left: Math.round(b.left) } })() : null;
    return {
      strip: r(strip),
      fallback: r(bar),
      stripRegion: strip ? getComputedStyle(strip).webkitAppRegion : null,
      stripPadLeft: strip ? getComputedStyle(strip).paddingLeft : null,
      tabRegion: strip && strip.querySelector('button') ? getComputedStyle(strip.querySelector('button')).webkitAppRegion : null
    };
  })()`)

  console.log('theme:preview --frameless — window is up.')
  console.log(`  strip height target : ${STRIP_HEIGHT}px   traffic-light inset: ${LIGHT_INSET}px`)
  console.log('  measured            :', JSON.stringify(measured))
  console.log('')
  console.log('  Try: drag the pink area at the top to move the window.')
  console.log('       Click a session tab (blue) — it must still switch, not drag.')
  console.log('       Switch theme in Settings: the strip follows the app colour.')
  console.log('')
  console.log('  Re-run with --no-outline to see it without the debug outlines.')
})
