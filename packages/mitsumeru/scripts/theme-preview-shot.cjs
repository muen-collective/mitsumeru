// theme:preview --shot — capture the app under each EVA theme, plus a swatch
// board of the colours each heading maps to, so a token change can be checked
// without packaging a DMG.
//
// Usage: electron scripts/theme-preview-shot.cjs <url> <outDir> [eva-01|eva-00]
const { app, BrowserWindow, nativeImage } = require('electron')
const fs = require('fs')
const path = require('path')

const [URL_ARG, OUT_DIR, ONLY] = process.argv.slice(2)
if (!URL_ARG || !OUT_DIR) {
  console.error('usage: theme-preview-shot <url> <outDir> [eva-01|eva-00]')
  process.exit(2)
}
app.commandLine.appendSwitch('disable-gpu')

// Each run boots a new harness on a new port and that port's token issues its
// own dsh-auth cookie. Sharing Electron's default profile accumulates them until
// the Cookie header exceeds Node's 16 KB maxHeaderSize and the server answers
// 431 before the app loads. Measured: 70 cookies, ~17.6 KB. Isolate instead.
const { mkdtempSync } = require('node:fs')
const { tmpdir } = require('node:os')
app.setPath('userData', mkdtempSync(require('node:path').join(tmpdir(), 'mitsumeru-probe-')))


const THEMES = [
  { id: 'eva-01', label: 'EVA 01' },
  { id: 'eva-00', label: 'EVA 00' }
].filter((t) => !ONLY || t.id === ONLY)

// Tokens worth showing side by side: each one is a colour the user names.
const BOARD = [
  ['buttons / icons', '--dsw-alias-brand-primary'],
  ['text links', '--dsw-alias-link'],
  ['tab fill', '--dsw-alias-markdown-tag'],
  ['user bubble', null], // read off the element itself
  ['text', '--dsw-alias-label-primary'],
  ['bg base', '--dsw-alias-bg-base'],
  ['separator', '--dsw-alias-separator-primary']
]

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * Draw a labelled board of the roles the user names, using the ACTIVE theme's
 * tokens. The tab strip and the text links only exist once a conversation is
 * open, so without this there is nothing on screen to judge them by. Each chip
 * reads the same custom property the real element reads.
 */
async function drawRoleBoard(win, themeId) {
  return win.webContents.executeJavaScript(`(() => {
    const body = getComputedStyle(document.body);
    const v = (n) => body.getPropertyValue(n).trim();
    const old = document.getElementById('eva-role-board');
    if (old) old.remove();

    const board = document.createElement('div');
    board.id = 'eva-role-board';
    board.style.cssText = [
      'position:fixed','inset:0','z-index:2147483647',
      'background:var(--dsw-alias-bg-base)','color:var(--dsw-alias-label-primary)',
      'font:13px/1.5 system-ui,sans-serif','padding:28px 34px','overflow:auto'
    ].join(';');

    const h = document.createElement('div');
    h.textContent = ${JSON.stringify('EVA role board — ')};
    h.style.cssText = 'font:600 17px/1.4 system-ui,sans-serif;margin-bottom:20px';
    h.textContent = 'EVA role board — ' + ${JSON.stringify(themeId || 'active theme')};
    board.appendChild(h);

    const row = (label, node, token, value) => {
      const r = document.createElement('div');
      r.style.cssText = 'display:flex;align-items:center;gap:16px;padding:11px 0';
      const lab = document.createElement('div');
      lab.textContent = label;
      lab.style.cssText = 'width:150px;flex:none;color:var(--dsw-alias-label-secondary)';
      const slot = document.createElement('div');
      slot.style.cssText = 'width:250px;flex:none';
      slot.appendChild(node);
      const meta = document.createElement('div');
      meta.textContent = token + '  ' + value;
      meta.style.cssText = 'font:12px ui-monospace,monospace;color:var(--dsw-alias-label-tertiary)';
      r.append(lab, slot, meta);
      board.appendChild(r);
    };

    const text = (t, css) => { const e = document.createElement('span'); e.textContent = t; e.style.cssText = css; return e; };

    // buttons / icons — brand fill, as the app's primary button uses it
    const btn = document.createElement('span');
    btn.textContent = 'Send';
    btn.style.cssText = 'display:inline-block;padding:6px 16px;border-radius:8px;font-weight:500;background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary-foreground)';
    row('buttons / icons', btn, '--dsw-alias-brand-primary', v('--dsw-alias-brand-primary'));

    // text links — the real property, and the real underline treatment
    row('text links',
      text('source link', 'color:var(--dsw-alias-link);font-weight:500;text-decoration:underline dotted var(--dsw-alias-link);text-underline-offset:3px'),
      '--dsw-alias-link', v('--dsw-alias-link'));

    // active tab — color:label-primary over background:markdown-tag (as _tabActive does)
    const strip = document.createElement('span');
    strip.style.cssText = 'display:inline-flex;gap:4px;align-items:center;padding:10px 0 0';
    const mkTab = (label, active) => {
      const t = document.createElement('span');
      t.textContent = label;
      t.style.cssText = [
        'display:flex','align-items:center','height:28px','padding:0 12px','border-radius:12px',
        'font-size:13px','white-space:nowrap',
        active
          ? 'color:var(--dsw-alias-link);background:var(--dsw-alias-markdown-tag)'
          : 'color:var(--dsw-alias-label-secondary)'
      ].join(';');
      return t;
    };
    strip.append(mkTab('session one', false), mkTab('active', true));
    row('active tab', strip, '--dsw-alias-markdown-tag', v('--dsw-alias-markdown-tag'));

    // user bubble — exactly the mix the overlay uses
    const bubble = document.createElement('span');
    bubble.textContent = 'your message';
    bubble.style.cssText = 'display:inline-block;padding:7px 12px;border-radius:12px;background:color-mix(in srgb, var(--dsw-alias-brand-primary) 40%, var(--dsw-alias-bg-layer-2))';
    row('user bubble', bubble, 'brand 40% over bg-layer-2', 'color-mix(...)');

    // the brand dot, as the sidebar actually renders it
    const markImg = document.querySelector('img.mu-mark--light, img.mu-mark--dark, .mu-mark');
    const markVis = markImg && getComputedStyle(markImg).display !== 'none' ? markImg
                  : document.querySelector('img.mu-mark');
    const dot = document.createElement('img');
    if (markVis) dot.src = markVis.getAttribute('src') || markVis.src;
    dot.style.cssText = 'width:26px;height:26px;display:inline-block';
    row('logo dot', dot, 'logo/*.svg', (markVis ? (markVis.className || '') : 'no mark in DOM'));

    row('text', text('primary label', 'color:var(--dsw-alias-label-primary)'), '--dsw-alias-label-primary', v('--dsw-alias-label-primary'));
    row('separator', (() => { const e = document.createElement('span'); e.style.cssText = 'display:block;height:2px;width:100%;background:var(--dsw-alias-separator-primary)'; return e; })(), '--dsw-alias-separator-primary', v('--dsw-alias-separator-primary'));

    document.body.appendChild(board);
    const r = board.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: Math.min(r.height, 560) };
  })()`)
}


/** Click Settings, pick a theme, and clear the first-run overlay. */
async function prepare(win, label) {
  await win.webContents.executeJavaScript(`(() => {
    const b = Array.from(document.querySelectorAll('button'))
      .find((el) => ['Settings','设置'].includes((el.textContent||'').trim()));
    if (b) b.click(); return !!b;
  })()`)
  await wait(2500)

  const picked = await win.webContents.executeJavaScript(`(() => {
    const b = Array.from(document.querySelectorAll('button'))
      .find((el) => (el.textContent || '').trim() === ${JSON.stringify(label)});
    if (!b) return false; b.click(); return true;
  })()`)
  await wait(1800)

  // first-run overlay + its scrim (throwaway-home plumbing, not app behaviour)
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
  await wait(1200)
  return picked
}

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1400, height: 900, show: false,
    webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false }
  })
  await win.loadURL(URL_ARG)
  await wait(6000)

  fs.mkdirSync(OUT_DIR, { recursive: true })
  const summary = []

  for (const theme of THEMES) {
    const picked = await prepare(win, theme.label)

    // what each named thing actually resolves to right now
    const colours = await win.webContents.executeJavaScript(`(() => {
      const body = getComputedStyle(document.body);
      const pick = (n) => body.getPropertyValue(n).trim();
      const bubble = document.querySelector('[class$="_userStack"] [class$="_bubble"]');
      const activeTab = document.querySelector('[class*="_tabActive"]');
      const link = document.querySelector('a[href],[class$="_sourceLink"],[class$="_fileMention"]');
      const cs = (el) => el ? getComputedStyle(el) : null;
      return {
        'buttons / icons': pick('--dsw-alias-brand-primary'),
        'text links': (link && cs(link).color) || pick('--dsw-alias-link'),
        'tab fill': (activeTab && cs(activeTab).backgroundColor) || pick('--dsw-alias-markdown-tag'),
        'user bubble': (bubble && cs(bubble).backgroundColor) || null,
        'text': pick('--dsw-alias-label-primary'),
        'bg base': pick('--dsw-alias-bg-base'),
        'separator': pick('--dsw-alias-separator-primary'),
        'scheme': document.documentElement.style.colorScheme || ''
      };
    })()`)

    // the role board (tab + links have no home without an open conversation)
    const boardRect = await drawRoleBoard(win, theme.id)
    await wait(900)
    const boardShot = await win.webContents.capturePage()
    const bi = nativeImage.createFromBuffer(boardShot.toPNG())
    const bscale = bi.getSize().width / win.getBounds().width
    fs.writeFileSync(path.join(OUT_DIR, `${theme.id}-roles.png`), bi.crop({
      x: Math.max(0, Math.round(boardRect.x * bscale)),
      y: Math.max(0, Math.round(boardRect.y * bscale)),
      width: Math.min(bi.getSize().width, Math.round(boardRect.w * bscale)),
      height: Math.min(bi.getSize().height, Math.round(boardRect.h * bscale))
    }).toPNG())
    await win.webContents.executeJavaScript(`(() => { const b = document.getElementById('eva-role-board'); if (b) b.remove(); return true; })()`)
    await wait(500)

    // Settings → General, which is where the theme row lives
    const shot = await win.webContents.capturePage()
    const full = path.join(OUT_DIR, `${theme.id}-settings.png`)
    fs.writeFileSync(full, shot.toPNG())

    // and the row itself, cropped, for a quick look
    const rect = await win.webContents.executeJavaScript(`(() => {
      const t = Array.from(document.querySelectorAll('div'))
        .find((el) => (el.textContent||'').trim() === 'EVA theme');
      if (!t) return null;
      let row = t;
      for (let i = 0; i < 6 && row.parentElement; i++) {
        const x = row.textContent || '';
        if (x.includes('EVA 01') && x.includes('EVA 00') && x.includes('Default')) break;
        row = row.parentElement;
      }
      const r = row.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    })()`)
    if (rect) {
      const img = nativeImage.createFromBuffer(shot.toPNG())
      const scale = img.getSize().width / win.getBounds().width
      const x = Math.max(0, Math.round(rect.x * scale) - 44)
      const y = Math.max(0, Math.round(rect.y * scale) - 110)
      const cropped = img.crop({
        x, y,
        width: Math.min(img.getSize().width - x, Math.round(rect.w * scale) + 120),
        height: Math.min(img.getSize().height - y, Math.round(rect.h * scale) + 130)
      })
      fs.writeFileSync(path.join(OUT_DIR, `${theme.id}-row.png`), cropped.toPNG())
    }

    summary.push({ theme: theme.id, picked, ...colours })
  }

  console.log('\n=== EVA theme preview ===')
  const keys = ['buttons / icons', 'text links', 'tab fill', 'user bubble', 'text', 'bg base', 'scheme']
  const pad = (s, n) => String(s).padEnd(n).slice(0, n)
  console.log('  ' + pad('', 20) + THEMES.map((t) => pad(t.id, 30)).join(''))
  for (const k of keys) {
    const row = THEMES.map((t) => {
      const s = summary.find((x) => x.theme === t.id)
      return pad(s ? (s[k] ?? '-') : '-', 30)
    }).join('')
    console.log('  ' + pad(k, 20) + row)
  }
  for (const s of summary) {
    if (!s.picked) console.log(`  [warn] could not click the ${s.theme} card in Settings`)
  }
  console.log(`\n  wrote ${OUT_DIR}/<theme>-roles.png, <theme>-settings.png and <theme>-row.png`)
  app.exit(0)
})
