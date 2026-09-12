// Frameless-window prototype helpers, shared by the theme:preview scripts.
//
// WHY THIS EXISTS
//
// The app currently builds a plain BrowserWindow, so macOS draws the stock
// title bar — chrome that follows the OS appearance, not the app's theme. The
// look we want (Figma, Discord: their own bar at the top of the window, with
// native traffic lights sitting in it) comes from `titleBarStyle: 'hidden'`,
// which drops the title bar chrome and lets web content start at y=0.
//
// That alone is not enough to make the window grabbable: once the title bar is
// gone there is no draggable surface unless the CONTENT declares one. So this
// also stamps `-webkit-app-region: drag` over the app's own top strip, with
// `no-drag` on the interactive things inside it — otherwise the whole strip
// would be a drag handle and the session tabs would stop responding to clicks.

/** The app's own top row: 10px top padding + 28px tall tabs. Measured. */
const STRIP_HEIGHT = 38;

/** macOS draws the traffic lights 14px tall. Centre them in the strip. */
const LIGHT_SIZE = 14;

/**
 * BrowserWindow options for the frameless prototype.
 *
 * `titleBarStyle: 'hidden'` keeps NATIVE traffic lights — they are still drawn
 * by macOS and behave normally. Nothing here replaces them with custom
 * controls, which is the whole reason to prefer this over `frame: false`.
 *
 * `trafficLightPosition.y` centres them in the strip. x leaves an 18px gutter,
 * matching how Figma and Discord inset theirs.
 */
const windowOptions = () => ({
  titleBarStyle: 'hidden',
  trafficLightPosition: { x: 18, y: Math.round((STRIP_HEIGHT - LIGHT_SIZE) / 2) }
});

/** The traffic-light group is ~52px wide (3 x 12px + 2 x 8px gaps). */
const LIGHT_INSET = 18 + 52 + 14;

/**
 * CSS that makes the top of the window draggable.
 *
 * MEASURED CONSTRAINT: this app has NO persistent top bar. The session tab
 * strip is the only thing that ever occupies the top row, and it does not exist
 * until a session is opened — a fresh window has nothing in the top 38px at all
 * and is therefore ungrabbable. So this does BOTH:
 *
 *   1. the tab strip, when present, becomes the drag surface (its own padding
 *      and the gaps between tabs drag; the tabs themselves stay clickable)
 *   2. a transparent bar always sits at the top edge, so the window can be moved
 *      even with no strip
 *
 * The two overlap when a strip exists. That is safe: the bar is
 * `pointer-events: none`, so it never receives clicks and never blocks a tab;
 * it only contributes a drag region.
 *
 * `showDrag` outlines the drag areas. The original complaint was that the strip
 * is invisible, so a reader judging this needs to SEE where the grab target is.
 */
const dragCss = (showDrag) => `
  /* Frameless prototype: the top strip is the window drag handle. */
  [class*="tabStrip"] {
    -webkit-app-region: drag;
    padding-left: ${LIGHT_INSET}px !important;
    /* the strip must actually own the top edge, not sit under the title bar */
    margin-top: 0 !important;
  }
  /* Anything interactive inside the strip must opt OUT, or it stops working. */
  [class*="tabStrip"] button,
  [class*="tabStrip"] a,
  [class*="tabStrip"] input,
  [class*="tabStrip"] [role="tab"],
  [class*="tabStrip"] [role="button"] {
    -webkit-app-region: no-drag;
  }

  /* Always-present drag surface. Transparent and click-through: it exists only
     to give the window a grab target when no tab strip is on screen. */
  #eva-drag-fallback {
    position: fixed;
    top: 0; left: 0; right: 0;
    height: ${STRIP_HEIGHT}px;
    -webkit-app-region: drag;
    z-index: 2147483000;
    background: transparent;
    pointer-events: none;   /* never swallow clicks */
  }

  ${showDrag ? `
  [class*="tabStrip"], #eva-drag-fallback {
    outline: 1px dashed rgba(255, 90, 160, 0.9) !important;
    outline-offset: -1px;
  }
  [class*="tabStrip"] button,
  [class*="tabStrip"] [role="tab"],
  [class*="tabStrip"] a {
    outline: 1px dashed rgba(90, 200, 255, 0.9) !important;
    outline-offset: -1px;
  }
  /* label what the reader is looking at, once */
  #eva-drag-legend {
    position: fixed; top: ${STRIP_HEIGHT + 8}px; left: ${LIGHT_INSET + 8}px;
    z-index: 2147483001;
    font: 11px/1.5 ui-monospace, monospace;
    color: #ff5aa0; background: rgba(0,0,0,0.72);
    padding: 4px 8px; border-radius: 6px; pointer-events: none;
  }
  ` : ''}
`;

/**
 * Apply the drag regions to a window that was created with windowOptions().
 *
 * insertCSS is used rather than touching the page's own stylesheets: the app's
 * sheets are injected by React and would win the cascade against a plain
 * selector of equal specificity (the same trap the theme plugin documents).
 * insertCSS lands in the user-agent-ish layer that outranks them.
 */
async function applyDragRegions(win, { showDrag = true } = {}) {
  try {
    await win.webContents.insertCSS(dragCss(showDrag));
  } catch {
    return false; // page not ready yet — caller can retry on did-finish-load
  }
  // the fallback bar has to be a real element (a pseudo-element cannot be a
  // drag region on its own in every engine), and it must not steal clicks
  await win.webContents.executeJavaScript(`(() => {
    if (document.getElementById('eva-drag-fallback')) return true;
    const bar = document.createElement('div');
    bar.id = 'eva-drag-fallback';
    document.body.appendChild(bar);
    ${showDrag ? `const legend = document.createElement('div');
    legend.id = 'eva-drag-legend';
    legend.textContent = 'pink = drag to move window   ·   blue = still clickable';
    document.body.appendChild(legend);` : ''}
    return true;
  })()`);
  return true;
}

module.exports = { windowOptions, applyDragRegions, STRIP_HEIGHT, LIGHT_INSET };
