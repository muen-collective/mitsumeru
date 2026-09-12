// theme:preview (interactive) — a real window on the live app, for clicking
// around a theme against the tokens in the source tree.
//
// Reload after editing a token: press Cmd-R in the window, or Ctrl-C here and
// re-run. The plugin has no build step, so what you edit is what reloads —
// after re-running `node scripts/gen-themes.mjs` in the plugin and the
// vendoring step in theme-preview.sh.
//
// Usage: electron scripts/theme-preview-open.cjs <url> [themeId]
const { app, BrowserWindow } = require('electron')

// Each run boots a new harness on a new port and that port's token issues its
// own dsh-auth cookie. Sharing Electron's default profile accumulates them until
// the Cookie header exceeds Node's 16 KB maxHeaderSize and the server answers
// 431 before the app loads. Measured: 70 cookies, ~17.6 KB. Isolate instead.
const { mkdtempSync } = require('node:fs')
const { tmpdir } = require('node:os')
app.setPath('userData', mkdtempSync(require('node:path').join(tmpdir(), 'mitsumeru-probe-')))


// Parse every argument ONCE, at module scope and before first use. A later
// `const THEME = ...` shadowed the earlier one and threw "Cannot access 'THEME'
// before initialization" because the reference above it was in the same scope.
const ARGV = process.argv.slice(2)
const URL_ARG = ARGV.find((a) => !a.startsWith('--'))
const THEME = ARGV.find((a) => a === 'eva-01' || a === 'eva-00') ?? null
const OPEN_SETTINGS = ARGV.includes('--settings')
if (!URL_ARG) {
  console.error('usage: theme-preview-open <url> [--settings] [eva-01|eva-00]')
  process.exit(2)
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1440, height: 940,
    title: `EVA theme preview${THEME ? ` — ${THEME}` : ''}`,
    webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false }
  })
  await win.loadURL(URL_ARG)
  await wait(6000)

  // Settings is a MODAL: opening it on launch blocks the app the review is
  // about, so it is opt-in via --settings.
  if (OPEN_SETTINGS) {
    await win.webContents.executeJavaScript(`(() => {
      const b = Array.from(document.querySelectorAll('button'))
        .find((el) => ['Settings','设置'].includes((el.textContent||'').trim()));
      if (b) b.click(); return !!b;
    })()`)
    await wait(2500)
  }

  // clear the first-run overlay + scrim so the window shows the app, not setup
  await win.webContents.executeJavaScript(`(() => {
    const settings = document.querySelector('[role="dialog"]');
    for (const el of Array.from(document.querySelectorAll('div')).reverse()) {
      if (settings && (el === settings || el.contains(settings) || settings.contains(el))) continue;
      const r = el.getBoundingClientRect();
      if (r.width < innerWidth * 0.4 || r.height < innerHeight * 0.3) continue;
      if (!/Configure later|Save and continue/i.test(el.textContent || '')) continue;
      el.remove(); break;
    }
    for (const el of Array.from(document.querySelectorAll('div,section'))) {
      const cs = getComputedStyle(el);
      const m = (cs.backgroundColor || '').match(/rgba?\\(([^)]+)\\)/);
      if (!m) continue;
      const p = m[1].split(',').map(Number);
      const a = p.length === 4 ? p[3] : 1;
      const r = el.getBoundingClientRect();
      if (a <= 0.15 || a >= 0.95) continue;
      if (r.width < innerWidth - 4 || r.height < innerHeight - 4) continue;
      if (!(p[0] < 60 && p[1] < 60 && p[2] < 60)) continue;
      el.style.display = 'none';
    }
    return true;
  })()`)
  await wait(800)

  if (THEME) {
    await win.webContents.executeJavaScript(`(() => {
      const label = ${JSON.stringify(THEME)} === 'eva-00' ? 'EVA 00' : 'EVA 01';
      const b = Array.from(document.querySelectorAll('button'))
        .find((el) => (el.textContent || '').trim() === label);
      if (b) b.click(); return !!b;
    })()`)
    await wait(1500)
  }

  console.log(`theme:preview — window open${THEME ? ` on ${THEME}` : ''}. Cmd-R to reload after editing tokens.`)
})
