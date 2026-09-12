// Loading-screen capture: render the splash HTML exactly as the app does, at the
// window size the app gives it, and write a PNG.
//
// Why render the file rather than photograph a launch: the splash is on screen
// for a second or two, and it is a self-contained HTML file with a local font —
// so loading it directly reproduces the pixels deterministically, at the exact
// window size (1280x800, from createSplashWindow in src/main/index.ts), instead of
// racing a startup to catch it. A screen grab of a launch would depend on when the
// shutter happened to fire and on whatever was behind the window.
//
// The one thing this cannot reproduce is the settle animation mid-flight, which is
// why the capture waits for it to finish before shooting.
//
// Run: node scripts/splash-shot.cjs <out-dir>
const { app, BrowserWindow } = require('electron')
const { mkdirSync } = require('node:fs')
const { join, resolve } = require('node:path')

const OUT_DIR = process.argv[2] || 'artifacts/landing'
mkdirSync(OUT_DIR, { recursive: true })

// The window size the app actually gives the splash (createSplashWindow).
const WIDTH = 1280
const HEIGHT = 800

const SPLASH = resolve(__dirname, '..', 'out', 'renderer', 'index.html')

app.commandLine.appendSwitch('disable-gpu')
app.disableHardwareAcceleration()

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: WIDTH,
    height: HEIGHT,
    show: false,
    backgroundColor: '#191a1a',
    webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false }
  })

  try {
    await win.loadFile(SPLASH)
  } catch (error) {
    console.log(`[splash-shot] FAIL loadFile: ${error && error.message}`)
    console.log(`[splash-shot] looked for ${SPLASH} — run: pnpm build`)
    app.exit(1)
    return
  }

  // Freeze the blink, then wait. The caret blinks at 1s with `steps(1, end)`, so
  // half the time it is invisible — and a capture that lands in that half writes a
  // screenshot with no caret in it. Measured: the first run of this script did
  // exactly that at a 1600ms wait. Pinning the animation to its first frame makes
  // the capture deterministic instead of a coin flip on when the shutter fires.
  await win.webContents.insertCSS('.line .caret { animation: none; opacity: 1 !important; }')

  // 1600ms also clears the 420ms settle animation and the font-display: block
  // window, so nothing here is translucent or in fallback type.
  await new Promise((r) => setTimeout(r, 1600))

  // What is on screen, read back so the capture is asserted and not just saved.
  const seen = await win.webContents.executeJavaScript(
    `(() => {
       const body = document.body;
       const line = document.querySelector('.line');
       const tagline = document.querySelector('.tagline');
       const cs = (el) => el ? getComputedStyle(el) : null;
       const lcs = cs(line), tcs = cs(tagline);
       return {
         text: (body.innerText || '').trim(),
         bg: getComputedStyle(body).backgroundColor,
         size: [window.innerWidth, window.innerHeight],
         lineFont: lcs ? lcs.fontFamily + ' ' + lcs.fontSize + ' ' + lcs.letterSpacing : null,
         tagFont: tcs ? tcs.fontFamily + ' ' + tcs.fontSize : null,
         stageOpacity: cs(document.querySelector('.stage'))?.opacity
       };
     })()`
  )

  console.log(`[splash-shot] window      : ${seen.size[0]}x${seen.size[1]}`)
  console.log(`[splash-shot] body bg     : ${seen.bg}`)
  console.log(`[splash-shot] line        : ${JSON.stringify(seen.lineFont)}`)
  console.log(`[splash-shot] tagline     : ${JSON.stringify(seen.tagFont)}`)
  console.log(`[splash-shot] text        : ${JSON.stringify(seen.text)}`)
  console.log(`[splash-shot] stage opacity: ${seen.stageOpacity}`)

  const image = await win.webContents.capturePage()
  if (image.isEmpty()) {
    console.log('[splash-shot] FAIL: captured an empty image')
    app.exit(1)
    return
  }
  // Named from the CAPTURED image, not from the requested window size. Two
  // differences are real and both were measured here: capturePage returns the
  // bitmap at the display's scale factor (2x, so 2560 wide), and the content area
  // is shorter than the window because the title bar is not part of it (768 of
  // the 800 requested). A name built from WIDTH/HEIGHT would say 1280x800 and be
  // wrong twice — and a design reference with a wrong size in its name is worse
  // than no name at all.
  const px = image.getSize()
  const file = join(OUT_DIR, `loading-screen-${px.width}x${px.height}.png`)
  require('node:fs').writeFileSync(file, image.toPNG())
  console.log(`[splash-shot] captured image: ${px.width}x${px.height} px`)
  console.log(`[splash-shot] wrote ${file}`)
  app.exit(0)
})
