// Who owns the sidebar brand seat? Read back from the running renderer.
//
// The companion to mount-probe.cjs, for the same class of failure but a nastier
// one: the seat is exclusive, upstream ships an occupant, and losing that contest
// is completely silent. The app boots, the profile composes, nothing throws — the
// sidebar just belongs to DeepSeek. No error to grep for, which is why the only
// reliable check is to look at the pixel-adjacent truth: which node is in the DOM.
//
// Discriminators, both structural rather than class-name based (the harness CSS
// is hashed per build, so class selectors rot on every dsh upgrade — the old
// fork's own stylesheet still targets `.IrIWsq_*`, a prefix this harness no
// longer emits):
//
//   OURS      an <img> in the brand row whose src is a base64 SVG containing the
//             the brand dot; the design source (logo/*.svg) sets it per
//             appearance — orange-red #FF5E00 on dark, red #FF0004 on light —
//             so each payload carries one of those instead of a single cyan.
//   UPSTREAM  an inline <svg> (FishLogo / BrandWordmark are React components)
//   FALLBACK  the shell's own text seat: "Local Build" / "DeepSeek Harness"
//
// Run: node scripts/brand-probe.cjs <url-with-token>
// Exit 0 = our mark holds the seat. Non-zero = it does not, naming the winner.
const { app, BrowserWindow } = require('electron')

/**
 * Every probe boots a NEW harness on a NEW random port, and each port's token
 * issues its own `dsh-auth-*` cookie with a 30-day life. Electron keeps one
 * shared cookie jar at ~/Library/Application Support/Electron, so cookies
 * accumulate one per run — measured: 70 of them, ~17.6 KB of Cookie header,
 * over Node's 16 KB maxHeaderSize. The server then answers **431 Request
 * Header Fields Too Large** before the app loads, and the failure surfaces as
 * "the app did not load (nodes=3)" — which reads like a harness or plugin bug
 * and is not one.
 *
 * So each probe gets its own throwaway profile. The cookie jar starts empty
 * every run, and nothing lands in the developer's real one.
 */
function isolateProfile() {
  if (typeof app === 'undefined') return null;
  const { mkdtempSync } = require('node:fs');
  const { tmpdir } = require('node:os');
  const { join } = require('node:path');
  const dir = mkdtempSync(join(tmpdir(), 'mitsumeru-probe-'));
  app.setPath('userData', dir);
  return dir;
}

isolateProfile();


const URL_ARG = process.argv[2]
if (!URL_ARG) {
  console.error('usage: brand-probe <url-with-token>')
  process.exit(2)
}

app.commandLine.appendSwitch('disable-gpu')
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
    console.log(`[brand-probe] FAIL: ${why}`)
    if (consoleErrors.length > 0) {
      console.log('[brand-probe] console errors:')
      for (const line of consoleErrors.slice(0, 12)) console.log('   ' + line)
    }
    app.exit(1)
  }

  try {
    await win.loadURL(URL_ARG)
  } catch (error) {
    return fail(`loadURL threw: ${error && error.message}`)
  }

  // The plugin graph needs time to materialize and every slot occupant to
  // register before the winner is readable.
  await new Promise((resolve) => setTimeout(resolve, 6000))

  const probe = await win.webContents.executeJavaScript(
    `(() => {
       const inBrandBox = (el) => {
         if (el.closest('[role="dialog"]') !== null) return false; // settings panel, not the seat
         const r = el.getBoundingClientRect();
         return r.width > 0 && r.height > 0 && r.left < 320 && r.top < 110;
       };

       // 1. our payloads: base64 SVG images carrying one of the dot colours
       const DOT_HEXES = ['FF5E00', 'FF0004'];
       const hasDot = (svg) => DOT_HEXES.some((hex) => svg.indexOf(hex) !== -1);
       const ours = [];
       for (const img of document.querySelectorAll('img')) {
         const src = img.getAttribute('src') || '';
         if (!src.startsWith('data:image/svg+xml;base64,')) continue;
         if (!inBrandBox(img)) continue;
         let svg = '';
         try { svg = atob(src.slice('data:image/svg+xml;base64,'.length)); } catch { continue; }
         ours.push({ dot: hasDot(svg), bytes: svg.length, alt: img.getAttribute('alt') || '' });
       }

       // 2. upstream's occupants are inline <svg> React components (FishLogo /
       //    BrandWordmark). Count them in the same box.
       const inlineSvg = [];
       for (const svg of document.querySelectorAll('svg')) {
         if (!inBrandBox(svg)) continue;
         inlineSvg.push((svg.getAttribute('viewBox') || '') + '|' + svg.querySelectorAll('path,circle,rect,g').length);
       }

       // 3. the shell's text fallback seats
       const text = (document.body.innerText || '');
       const seatText = [];
       for (const label of ['Local Build', 'DeepSeek Harness', 'Mitsumeru']) {
         if (text.indexOf(label) !== -1) seatText.push(label);
       }

       return {
         ours,
         dotCount: ours.filter((o) => o.dot).length,
         inlineSvg,
         seatText,
         title: document.title,
         nodeCount: document.querySelectorAll('*').length,
         bootWired: typeof window.__DSH_BOOT__ !== 'undefined'
       };
     })()`
  )

  console.log('[brand-probe] page title        :', JSON.stringify(probe.title))
  console.log('[brand-probe] DOM nodes         :', probe.nodeCount)
  console.log('[brand-probe] boot wire loaded  :', probe.bootWired)
  console.log('[brand-probe] our mark payloads :', probe.ours.length, JSON.stringify(probe.ours))
  console.log('[brand-probe] inline <svg> in seat:', JSON.stringify(probe.inlineSvg))
  console.log('[brand-probe] brand text present:', JSON.stringify(probe.seatText))

  if (!probe.bootWired || probe.nodeCount < 100) {
    return fail(`the app did not load (nodes=${probe.nodeCount}, bootWire=${probe.bootWired}) — auth, trust fence, or an over-large Cookie header. If nodes is tiny (under ~10), suspect HTTP 431: repeated probe runs accumulate one dsh-auth cookie per harness PORT in the shared Electron profile, and past Node's 16KB maxHeaderSize the server answers 431 before the app loads. isolateProfile() prevents it; an older profile needs its dsh-auth cookies cleared.`)
  }

  // Positive assertion first: our dot must be IN the seat. Everything else
  // is diagnosis.
  if (probe.dotCount === 0) {
    const upstream = probe.inlineSvg.length > 0
      ? `an inline <svg> holds it — that is upstream's brand occupant (FishLogo/BrandWordmark), so ui-brand-official was not vacated or our bundle was not composed`
      : `no occupant of ours and no inline <svg> — the seat is on the shell fallback (${JSON.stringify(probe.seatText)})`
    return fail(`the sidebar brand seat does not carry our dot (#FF5E00 / #FF0004): ${upstream}`)
  }

  // And the fallback must NOT also be showing: a contest in progress can leave
  // both occupants' descendants in the tree, which would be a partial brand mix.
  if (probe.seatText.includes('Local Build')) {
    return fail(`our mark is present but the shell fallback label "Local Build" also renders — partial brand mix`)
  }

  console.log('[brand-probe] PASS: the sidebar brand seat carries our dot (#FF5E00 / #FF0004), no upstream occupant')
  app.exit(0)
})
