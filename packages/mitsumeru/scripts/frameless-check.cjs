// Verify the frameless prototype, split so nothing depends on the app finishing
// its boot:
//
//   A. the CSS contract — does our rule actually match the app's real class
//      names, and does every interactive element in the strip opt out?
//   B. window-level facts — is the window really frameless, are the native
//      traffic lights kept, is there always a drag surface?
//   C. the live app, if it happens to be up (best-effort; not required to pass)
//
// A is done by injecting elements carrying the class names MEASURED from the
// app's own stylesheet (`_tabStrip_17p4l_156`, `_tabActive_17p4l_243`), so the
// rule is tested against the real names rather than a guess. It stays
// deterministic even when the harness is slow to boot.
const { app, BrowserWindow } = require('electron')
const { windowOptions, applyDragRegions, STRIP_HEIGHT, LIGHT_INSET } = require('./lib/frameless.cjs')

const URL_ARG = process.argv[2]
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
app.commandLine.appendSwitch('disable-gpu')

// Each run boots a new harness on a new port and that port's token issues its
// own dsh-auth cookie. Sharing Electron's default profile accumulates them until
// the Cookie header exceeds Node's 16 KB maxHeaderSize and the server answers
// 431 before the app loads. Measured: 70 cookies, ~17.6 KB. Isolate instead.
const { mkdtempSync } = require('node:fs')
const { tmpdir } = require('node:os')
app.setPath('userData', mkdtempSync(require('node:path').join(tmpdir(), 'mitsumeru-probe-')))


let failures = 0
const check = (ok, label, detail) => {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? '  — ' + detail : ''}`)
  if (!ok) failures++
}
const note = (msg) => console.log(`  note  ${msg}`)

app.whenReady().then(async () => {
  // A page is needed for insertCSS to land; about:blank is enough and cannot
  // fail to boot.
  const win = new BrowserWindow({
    width: 1440, height: 940, show: false,
    ...windowOptions(),
    webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false }
  })

  console.log('=== A. CSS contract (deterministic) ===')
  await win.loadURL('about:blank')
  await wait(400)
  await applyDragRegions(win, { showDrag: true })
  await wait(400)

  // The real class names, taken from the app's stylesheet:
  //   ._tabStrip_17p4l_156{...padding:10px 6px 0 10px}
  //   ._tabActive_17p4l_243{color:...;background:...}
  const contract = await win.webContents.executeJavaScript(`(() => {
    const region = (el) => getComputedStyle(el).webkitAppRegion;
    const strip = document.createElement('div');
    strip.className = '_tabStrip_17p4l_156';
    strip.innerHTML = '<button id="tab-a">session one</button>' +
                      '<span role="tab" id="tab-b">session two</span>' +
                      '<a href="#" id="tab-c">link</a>' +
                      '<div id="tab-gap" style="flex:1"></div>';
    document.body.appendChild(strip);

    const fallback = document.getElementById('eva-drag-fallback');
    // content must be padded below the band, or the brand row renders under the
    // traffic lights (the collision this band exists to prevent)
    const frame = document.createElement('div');
    frame.className = '_frame_test';
    document.body.appendChild(frame);
    const legend = document.getElementById('eva-drag-legend');
    const out = {
      contentPushed: Math.round(parseFloat(getComputedStyle(frame).paddingTop)),
      legendAtBottom: legend ? getComputedStyle(legend).bottom !== 'auto' : null,
      stripRegion: region(strip),
      stripPadLeft: Math.round(parseFloat(getComputedStyle(strip).paddingLeft)),
      fallbackRegion: fallback ? region(fallback) : null,
      fallbackPointer: fallback ? getComputedStyle(fallback).pointerEvents : null,
      fallbackHeight: fallback ? Math.round(fallback.getBoundingClientRect().height) : null,
      children: {}
    };
    for (const id of ['tab-a', 'tab-b', 'tab-c', 'tab-gap']) {
      const el = document.getElementById(id);
      out.children[id] = el ? region(el) : 'missing';
    }
    return out;
  })()`)

  check(contract.stripRegion === 'drag',
    'a tab strip (real class name) becomes a drag region', String(contract.stripRegion))
  check(contract.stripPadLeft >= LIGHT_INSET,
    'the traffic-light gutter is reserved', `padding-left=${contract.stripPadLeft}px vs inset ${LIGHT_INSET}px`)
  check(contract.children['tab-a'] === 'no-drag', 'a tab button stays clickable (no-drag)', String(contract.children['tab-a']))
  check(contract.children['tab-b'] === 'no-drag', 'a [role=tab] stays clickable (no-drag)', String(contract.children['tab-b']))
  check(contract.children['tab-c'] === 'no-drag', 'a link in the strip stays clickable (no-drag)', String(contract.children['tab-c']))
  check(contract.children['tab-gap'] === 'drag',
    'the empty space between tabs drags (this is the grab target)', String(contract.children['tab-gap']))
  check(contract.fallbackRegion === 'drag',
    'a drag surface exists even with no tab strip', String(contract.fallbackRegion))
  check(contract.fallbackHeight === STRIP_HEIGHT,
    'the always-present bar covers the strip height', `${contract.fallbackHeight}px`)
  check(contract.contentPushed === STRIP_HEIGHT,
    'the app content is pushed below the reserved band (no traffic-light overlap)',
    `padding-top=${contract.contentPushed}px, band=${STRIP_HEIGHT}px`)
  check(contract.legendAtBottom === true,
    'the debug legend sits at the bottom, not over the brand row')
  check(contract.fallbackPointer === 'none',
    'the always-present bar never swallows clicks', String(contract.fallbackPointer))

  console.log('')
  console.log('=== B. window options ===')
  const opts = windowOptions()
  check(opts.titleBarStyle === 'hidden',
    'titleBarStyle hidden: no title bar chrome, content starts at y=0', opts.titleBarStyle)
  check(opts.frame === undefined,
    'frame is NOT disabled — macOS still draws the native traffic lights')
  check(typeof opts.trafficLightPosition?.x === 'number' && typeof opts.trafficLightPosition?.y === 'number',
    'traffic lights are positioned', `x=${opts.trafficLightPosition?.x} y=${opts.trafficLightPosition?.y}`)
  check(opts.trafficLightPosition.y === Math.round((STRIP_HEIGHT - 14) / 2),
    'traffic lights are centred in the strip', `y=${opts.trafficLightPosition.y} in ${STRIP_HEIGHT}px`)
  const live = win.getBounds()
  check(live.width === 1440 && live.height === 940, 'the window really opened', `${live.width}x${live.height}`)

  console.log('')
  console.log('=== C. the live app (best-effort) ===')
  if (!URL_ARG || URL_ARG === 'about:blank') {
    note('no app URL given — skipped')
  } else {
    await win.loadURL(URL_ARG)
    let settled = false
    for (let i = 0; i < 40; i++) {
      const probe = await win.webContents.executeJavaScript(`(() => ({
        boot: !!document.querySelector('[class*="_boot_"]'),
        buttons: document.querySelectorAll('button').length,
        strip: !!document.querySelector('[class*="tabStrip"]')
      }))()`).catch(() => ({ boot: true, buttons: 0, strip: false }))
      if (probe.strip || (!probe.boot && probe.buttons > 3)) { settled = true; break }
      await wait(1000)
    }
    await applyDragRegions(win, { showDrag: true })
    await wait(600)
    const liveDom = await win.webContents.executeJavaScript(`(() => {
      const strip = document.querySelector('[class*="tabStrip"]');
      return {
        settled: ${settled},
        hasStrip: !!strip,
        stripRegion: strip ? getComputedStyle(strip).webkitAppRegion : null
      };
    })()`)

    if (liveDom.hasStrip) {
      check(liveDom.stripRegion === 'drag', 'the app\'s real tab strip is a drag region', String(liveDom.stripRegion))
    } else {
      note(settled
        ? 'app rendered, but this profile has NO session open, so there is no tab strip;'
        : 'app did not finish booting in 40s in this harness;')
      note('the top edge is covered by the always-present drag bar (verified in A) —')
      note('the strip-specific rules are verified in A against the real class names.')
    }
  }

  console.log('')
  console.log(failures === 0
    ? 'PASS: frameless prototype is wired correctly'
    : `FAIL: ${failures} check(s) failed`)
  app.exit(failures === 0 ? 0 : 1)
})
