/**
 * App identity — the one place the name lives.
 *
 * Epic 86 § Naming: the shell is codenamed `asuka` until the wrap proof is
 * accepted, then renamed to `mitsumeru`. The rename must stay a one-file
 * change, so nothing else in the shell hardcodes the name — package name,
 * appId, productName and the update feed all read from here (+ package.json).
 */

export const APP_NAME = 'asuka'
export const PRODUCT_NAME = 'Asuka'
export const APP_ID = 'com.muen.asuka'

/**
 * Update feed (Epic 86 T12). Ours, and only ours — the wrap must never inherit
 * a `dshdesktop.com` feed, or a DSH release would overwrite this shell and its
 * signing identity with somebody else's build.
 *
 * A generic feed: electron-updater appends `<channel>-mac.yml` and the artifact
 * names listed inside it. `scripts/check-identity.sh` keeps this value and the
 * builder's `publish.url` equal, so the packaged `app-update.yml` and the
 * dev-time override cannot drift apart.
 */
export const UPDATE_FEED_URL = 'https://updates.mitsumeru.app/asuka'

/** The harness package we wrap. Version is pinned in package.json. */
export const HARNESS_PACKAGE = '@deepseek-ai/dsh'

/**
 * Release labeling (Epic 86 T11). Internal builds, download links, release
 * notes and CTAs all carry `-dev` until a build is promoted to production;
 * the same suffix is what tells the updater to track the dev channel.
 */
export const DEV_SUFFIX = '-dev'

export const isDevVersion = (version: string): boolean => version.endsWith(DEV_SUFFIX)

/**
 * The update channel a version belongs to. This reproduces electron-builder's
 * own rule (`appInfo.channel` = the version's first semver prerelease
 * component), which is what names the release manifest: `0.1.0-dev` is channel
 * `dev` → `dev-mac.yml`; `0.1.0` has no channel and electron-updater resolves
 * that to `latest` → `latest-mac.yml`.
 *
 * It is duplicated from the builder on purpose: the client needs the same
 * answer at runtime, and a mismatch here is not cosmetic — the app would ask
 * the feed for a file the release never uploaded (measured, see updater.ts).
 */
export const releaseChannel = (version: string): string | null => {
  const prerelease = version.split('-')[1]
  if (prerelease === undefined || prerelease === '') return null
  return prerelease.split('.')[0]
}

/**
 * Titles the harness UI may serve, used to tell the real app from the
 * browser-trust fence's fallback page. The published npm tarball ships
 * `DeepSeek Harness`; a frontend built from a checkout says `DSH Local Build`.
 */
export const HARNESS_TITLES = ['DeepSeek Harness', 'DSH Local Build']
