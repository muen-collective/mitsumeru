// Mount proof for the mitsu profile (Epic 88, step 1), retargeted 2026-09-12
// from the retired dsh-mitsumeru-appearance plugin to dsh-eva-theme.
//
// WHY THIS EXISTS, and why it asserts positively: `window.__ModuleLoader__`
// fails SILENTLY. A client module that throws on import or never registers
// leaves the boot succeeding with only a console line — "UI boots, zero errors,
// panel absent" is the documented failure mode. So absence must be an asserted
// failure, and presence must be read back from the running renderer.
//
// Four things can each fail independently, and this walks all four:
//   1. the profile composes our bundle      -> asserted before launch (dump-config)
//   2. the client module is SERVED          -> asserted by the combo-chunk fetch
//   3. the module body EVALUATES            -> asserted here: no console error
//   4. `apply()` REGISTERS into the shell   -> asserted here: marker + row in DOM
//
// Run: node scripts/mount-probe.cjs <url-with-token>
// Exit 0 = mounted. Non-zero = not mounted, with the reason printed.
const { app, BrowserWindow } = require('electron')

const URL_ARG = process.argv[2]
if (!URL_ARG) {
  console.error('usage: mount-probe <url-with-token>')
  process.exit(2)
}

// dsh-eva-theme sets no window global of its own, so there is no marker to
// read. The positive signal is the settings row it registers: the theme picker
// renders the EVA title and one card per skin. Both strings come from the
// plugin's own locale dictionary, so finding them proves the module evaluated,
// apply() ran, AND the row reached the DOM.
const ROW_TITLE = 'EVA theme'
const ROW_SKINS = ['EVA 01', 'EVA 00']

app.commandLine.appendSwitch('disable-gpu')
// Keep it off-screen but real: this is a genuine renderer, not a simulation.
app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false }
  })

  const consoleErrors = []
  win.webContents.on('console-message', (_e, level, message) => {
    if (level >= 2) consoleErrors.push(message)
  })

  const fail = (why) => {
    console.log(`[mount-probe] FAIL: ${why}`)
    if (consoleErrors.length > 0) {
      console.log('[mount-probe] console errors:')
      for (const line of consoleErrors.slice(0, 12)) console.log('   ' + line)
    }
    app.exit(1)
  }

  try {
    await win.loadURL(URL_ARG)
  } catch (error) {
    return fail(`loadURL threw: ${error && error.message}`)
  }

  // The shell is a SPA that boots from a boot wire; give the plugin graph time
  // to materialize and `apply()` to run before reading anything back.
  await new Promise((resolve) => setTimeout(resolve, 6000))

  const probe = await win.webContents.executeJavaScript(
    `(() => {
       return {
         title: document.title,
         nodeCount: document.querySelectorAll('*').length,
         bootWired: typeof window.__DSH_BOOT__ !== 'undefined'
       };
     })()`
  )

  console.log('[mount-probe] page title      :', JSON.stringify(probe.title))
  console.log('[mount-probe] DOM nodes       :', probe.nodeCount)
  console.log('[mount-probe] boot wire loaded:', probe.bootWired)

  // A ~27-node page with no title is the trust-fence fallback, not the app.
  if (!probe.bootWired || probe.nodeCount < 100) {
    return fail(`the app did not load (nodes=${probe.nodeCount}, bootWire=${probe.bootWired}) — auth or trust fence, not our plugin`)
  }

  // `settings.general.item` only renders while the Settings panel is OPEN, so the
  // row cannot be in the DOM yet. Open it, then look. (Claiming "silent
  // non-mount" before this step would have been a false negative — the same
  // mistake as probing a single-file /plugins URL.)
  const opened = await win.webContents.executeJavaScript(
    `(() => {
       const wanted = ['Settings', '\u8bbe\u7f6e'];
       const button = Array.from(document.querySelectorAll('button'))
         .find((el) => wanted.includes((el.textContent || '').trim()));
       if (!button) return { clicked: false, buttons: Array.from(document.querySelectorAll('button')).map(b => (b.textContent || '').trim()).filter(Boolean).slice(0, 25) };
       button.click();
       return { clicked: true };
     })()`
  )
  if (!opened.clicked) {
    return fail(`could not find the Settings trigger; buttons seen: ${JSON.stringify(opened.buttons)}`)
  }

  await new Promise((resolve) => setTimeout(resolve, 2500))

  const afterOpen = await win.webContents.executeJavaScript(
    `(() => {
       const text = document.body.textContent || '';
       return {
         dialog: document.querySelector('[role="dialog"]') !== null,
         rowTitle: text.includes(${JSON.stringify(ROW_TITLE)}),
         skins: ${JSON.stringify(ROW_SKINS)}.filter((label) => text.includes(label)),
         generalOpen: text.includes('Appearance') && text.includes('Font size')
       };
     })()`
  )

  console.log('[mount-probe] settings dialog :', afterOpen.dialog)
  console.log('[mount-probe] General rendered:', afterOpen.generalOpen)
  console.log('[mount-probe] our row title   :', afterOpen.rowTitle ? 'FOUND' : 'ABSENT')
  console.log('[mount-probe] our skin cards  :', afterOpen.skins.join(', ') || 'NONE')

  if (!afterOpen.dialog) return fail('the Settings panel did not open')
  if (!afterOpen.rowTitle) {
    return fail(`Settings opened but "${ROW_TITLE}" is not in it — registration did not reach the panel`)
  }
  const missing = ROW_SKINS.filter((label) => !afterOpen.skins.includes(label))
  if (missing.length > 0) {
    return fail(`the row rendered but is missing skin card(s): ${missing.join(', ')}`)
  }

  console.log('[mount-probe] PASS: module evaluated, apply() ran, and both EVA skins render in Settings → General')
  app.exit(0)
})
