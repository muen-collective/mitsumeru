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

/** The harness package we wrap. Version is pinned in package.json. */
export const HARNESS_PACKAGE = '@deepseek-ai/dsh'

/**
 * Titles the harness UI may serve, used to tell the real app from the
 * browser-trust fence's fallback page. The published npm tarball ships
 * `DeepSeek Harness`; a frontend built from a checkout says `DSH Local Build`.
 */
export const HARNESS_TITLES = ['DeepSeek Harness', 'DSH Local Build']
