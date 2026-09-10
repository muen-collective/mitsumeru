import { app, ipcMain, powerMonitor } from 'electron'
import { autoUpdater, type UpdateDownloadedEvent } from 'electron-updater'
import { copyFileSync, mkdirSync, readdirSync } from 'node:fs'
import { basename, join } from 'node:path'

import { isDevVersion, releaseChannel, UPDATE_FEED_URL } from '../shared/identity'

/**
 * Update client (Epic 86 T12). Client config only — the feed endpoint itself is
 * a separate task, and nothing here assumes it exists:
 *
 *   - a startup check at 15 s + jitter, then a 6 h cadence (30 min after a
 *     failure, so an offline launch retries instead of waiting half a day);
 *   - a check shortly after the machine resumes from sleep;
 *   - an IPC handler so the harness UI can ask for one on demand;
 *   - every downloaded version is archived under <userData>/updates/<version>/,
 *     which is what makes `allowDowngrade` a usable rollback instead of a flag
 *     with nothing to roll back to.
 *
 * Nothing here may take the app down: an unreachable feed is a logged line, not
 * a crash and not a blocked startup. The harness boots whether or not the
 * network is up.
 */

/** Spec: first check 15 s after launch, plus jitter so a fleet never stampedes. */
const FIRST_CHECK_MS = 15_000
const JITTER_MS = 5_000
/** Spec: every 6 h while the app stays open. */
const CADENCE_MS = 6 * 60 * 60 * 1000
/** A failed check (offline, feed 404) retries sooner than the full cadence. */
const RETRY_MS = 30 * 60 * 1000
/** Resume-from-sleep check: let the network stack come back before asking. */
const RESUME_DELAY_MS = 5_000
/** Download progress is logged every N percent, not on every event. */
const PROGRESS_STEP = 10

export interface UpdateStatus {
  state:
    | 'disabled'
    | 'idle'
    | 'checking'
    | 'current'
    | 'available'
    | 'downloading'
    | 'downloaded'
    | 'error'
  /** Version the updater is talking about (available/downloaded), if any. */
  version?: string
  percent?: number
  message?: string
  /** Where the downloaded version was archived, when it was. */
  archived?: string
  /** Epoch ms of the last state change. */
  at: number
}

export interface UpdaterOptions {
  log: (message: string) => void
  /** Guard for IPC callers: only the window showing the harness may ask. */
  isTrustedSender: (url: string) => boolean
  /** Overrides the packaged feed. Used by scripts/smoke-updater.sh. */
  feedUrl?: string
  /** Test seam: register every trigger, but schedule nothing. */
  manualOnly?: boolean
}

export interface UpdaterController {
  status: () => UpdateStatus
  /** Run a check now. Never rejects — failures land in the status. */
  checkNow: (trigger: string) => Promise<UpdateStatus>
  /** Archived versions under <userData>/updates, newest first. */
  archivedVersions: () => string[]
  stop: () => void
}

export function startUpdater(options: UpdaterOptions): UpdaterController {
  const { log, isTrustedSender, feedUrl, manualOnly = false } = options

  let status: UpdateStatus = { state: 'idle', at: Date.now() }
  let nextTimer: NodeJS.Timeout | null = null
  let stopped = false

  const setStatus = (next: Omit<UpdateStatus, 'at'>): void => {
    status = { ...next, at: Date.now() }
  }

  // One timer, always: a check reschedules the next one, and a resume or a
  // manual check must replace that plan rather than add a second one, or the
  // checks would multiply on every trigger.
  const schedule = (delayMs: number, why: string): void => {
    if (stopped) return
    if (nextTimer !== null) clearTimeout(nextTimer)
    nextTimer = setTimeout(() => {
      nextTimer = null
      void check('timer')
    }, delayMs)
    const jitterDetail = why === 'startup' ? ` baseMs=${String(FIRST_CHECK_MS)} jitterMs=${String(delayMs - FIRST_CHECK_MS)}` : ''
    log(`update-check-scheduled delayMs=${String(delayMs)} reason=${why}${jitterDetail}`)
  }

  const archivedVersions = (): string[] => {
    try {
      return readdirSync(join(app.getPath('userData'), 'updates')).sort().reverse()
    } catch {
      return [] // no archive directory yet — a fresh install has nothing to roll back to
    }
  }

  const archive = (event: UpdateDownloadedEvent): string | undefined => {
    try {
      const dir = join(app.getPath('userData'), 'updates', event.version)
      mkdirSync(dir, { recursive: true })
      const target = join(dir, basename(event.downloadedFile))
      copyFileSync(event.downloadedFile, target)
      log(`update-archived version=${event.version} path=${target}`)
      return target
    } catch (error) {
      // Archiving is a convenience for rollback: a failure here must not turn a
      // successful download into a failed update.
      log(`update-archive-failed ${error instanceof Error ? error.message : String(error)}`)
      return undefined
    }
  }

  const check = async (trigger: string): Promise<UpdateStatus> => {
    if (stopped) return status
    log(`update-check-start trigger=${trigger}`)
    setStatus({ state: 'checking' })
    let failed = false
    try {
      // null when the updater is inactive (an unpackaged run has no feed).
      const result = await autoUpdater.checkForUpdates()
      if (result === null) {
        log('update-check-skip updater-inactive (unpackaged or no feed config)')
        setStatus({ state: 'disabled', message: 'updater inactive' })
      } else if (result.updateInfo.version === app.getVersion()) {
        log(`update-check-result current=${app.getVersion()}`)
        setStatus({ state: 'current', version: app.getVersion() })
      }
      // An available update also arrives through 'update-available', which
      // carries the version actually on offer; that handler sets the status.
    } catch (error) {
      // Offline, DNS failure, 404 on the feed, a malformed yml: all land here.
      failed = true
      const message = error instanceof Error ? error.message : String(error)
      log(`update-check-failed ${message}`)
      setStatus({ state: 'error', message })
    }
    if (!stopped && !manualOnly && status.state !== 'disabled') {
      schedule(failed ? RETRY_MS : CADENCE_MS, failed ? 'retry' : 'cadence')
    }
    return status
  }

  // ---- electron-updater wiring ----------------------------------------------

  autoUpdater.autoDownload = true
  // Install on quit, never mid-session: the harness holds the user's work.
  autoUpdater.autoInstallOnAppQuit = true
  // Rollback (spec): without this a newer archive can never be replaced by an
  // older one, so a bad release would be a dead end.
  autoUpdater.allowDowngrade = true
  // A -dev build tracks the dev channel; a promoted build tracks latest.
  autoUpdater.allowPrerelease = isDevVersion(app.getVersion())

  if (feedUrl !== undefined) {
    // A feed override replaces the packaged app-update.yml for this session —
    // and with it the channel recorded there, because setFeedURL builds the
    // provider from these options alone. Left unsaid, the app asks for
    // latest-mac.yml while the build published dev-mac.yml: the first run of
    // scripts/smoke-updater.sh did exactly that and got a 404 from the feed.
    // Carry the channel across, derived by the same rule the builder used.
    const channel = releaseChannel(app.getVersion())
    if (channel !== null) autoUpdater.channel = channel
    autoUpdater.setFeedURL({ provider: 'generic', url: feedUrl })
  }
  log(
    `update-feed ${feedUrl ?? UPDATE_FEED_URL}${feedUrl === undefined ? ' (packaged config authoritative)' : ''} ` +
      `channel=${releaseChannel(app.getVersion()) ?? 'latest'} version=${app.getVersion()}` +
      ` prerelease=${String(autoUpdater.allowPrerelease)}`
  )

  autoUpdater.on('update-available', (info) => {
    log(`update-available version=${info.version}`)
    setStatus({ state: 'available', version: info.version })
  })
  autoUpdater.on('update-not-available', (info) => {
    log(`update-current version=${info.version}`)
    setStatus({ state: 'current', version: info.version })
  })
  autoUpdater.on('download-progress', (progress) => {
    const percent = Math.round(progress.percent)
    setStatus({ state: 'downloading', percent })
    if (percent % PROGRESS_STEP === 0) {
      log(`update-download-progress percent=${String(percent)} bps=${String(Math.round(progress.bytesPerSecond))}`)
    }
  })
  autoUpdater.on('update-downloaded', (event) => {
    const archived = archive(event)
    setStatus({ state: 'downloaded', version: event.version, archived })
    log(`update-downloaded version=${event.version} archives=${String(archivedVersions().length)}`)
  })
  autoUpdater.on('error', (error) => {
    // Background failures surface here, not only as a rejected promise.
    const message = error instanceof Error ? error.message : String(error)
    log(`update-error ${message}`)
    setStatus({ state: 'error', message })
  })

  // ---- triggers -------------------------------------------------------------

  if (!manualOnly) {
    const jitter = Math.floor(Math.random() * JITTER_MS)
    schedule(FIRST_CHECK_MS + jitter, 'startup')
    powerMonitor.on('resume', () => {
      log('update-check-resume')
      schedule(RESUME_DELAY_MS, 'resume')
    })
  }

  // ---- IPC ------------------------------------------------------------------

  ipcMain.handle('asuka:update-check', (event) => {
    const senderUrl = event.senderFrame?.url ?? ''
    if (!isTrustedSender(senderUrl)) {
      log(`[lockdown] deny update-check-sender ${senderUrl}`)
      return { state: 'disabled', message: 'untrusted sender', at: Date.now() } satisfies UpdateStatus
    }
    return check('manual')
  })

  ipcMain.handle('asuka:update-status', () => status)

  ipcMain.handle('asuka:update-archive', () => archivedVersions())

  const stop = (): void => {
    stopped = true
    if (nextTimer !== null) clearTimeout(nextTimer)
    nextTimer = null
    autoUpdater.removeAllListeners()
  }

  return { status: () => status, checkNow: check, archivedVersions, stop }
}
