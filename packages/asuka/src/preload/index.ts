import { contextBridge, ipcRenderer } from 'electron'

import { APP_NAME } from '../shared/identity'

/**
 * asuka preload.
 *
 * External-link policy (decided 2026-09-09): a real click on a link opens the
 * reader's system browser. Nothing else ever opens a browser.
 *
 * Why the click (and not the main process) decides: the harness UI renders
 * external links as `target="_blank"` anchors, so a trusted click is the only
 * honest signal of intent. Scripted window.open() calls are denied in the main
 * process and never forwarded — `event.isTrusted` filters synthetic dispatches,
 * so injected content cannot drive the browser.
 */

function externalHrefFrom(target: EventTarget | null): string | undefined {
  if (!(target instanceof Element)) return undefined
  const anchor = target.closest('a[href]')
  if (anchor === null) return undefined
  const href = anchor.getAttribute('href')
  if (href === null || href === '') return undefined
  try {
    const url = new URL(href, window.location.href)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined
    return url.toString()
  } catch {
    return undefined
  }
}

document.addEventListener(
  'click',
  (event) => {
    // Trusted input only: a script dispatching click() cannot open a browser.
    if (!event.isTrusted) return
    const href = externalHrefFrom(event.target)
    if (href === undefined) return
    // The main process decides: harness-origin links stay in-app, external ones
    // go to the system browser.
    ipcRenderer.send('asuka:open-external', href)
  },
  true
)

// The shell's own surface for the page it hosts: which build this is, and the
// update state. Read from the main process instead of baked in at build time,
// so a running app can never claim a version the artifact does not carry (T11)
// and the `-dev` label survives a rebuild.
contextBridge.exposeInMainWorld(APP_NAME, {
  getAppInfo: () => ipcRenderer.invoke('asuka:app-info'),
  checkForUpdates: () => ipcRenderer.invoke('asuka:update-check'),
  updateStatus: () => ipcRenderer.invoke('asuka:update-status'),
  archivedVersions: () => ipcRenderer.invoke('asuka:update-archive'),
  // Restart into a downloaded version. Exposed for completeness — the shell's own
  // window is the harness's page, so today the dialog and the menu are what
  // actually call it.
  restartToUpdate: () => ipcRenderer.invoke('asuka:update-restart')
})
