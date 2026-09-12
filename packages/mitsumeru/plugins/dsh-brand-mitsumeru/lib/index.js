// @muen/dsh-brand-mitsumeru — host half.
// This is a brand-rendering package: the host intentionally registers nothing
// and does nothing. All rendering is in ./client.js, which fills the DSH brand
// slots with the hardcoded Mitsumeru wordmark + cyan-blue dot. Kept as a stable
// entry so the loader can mount the row.
export const name = 'brand-mitsumeru'
export const inject = []
export function apply() {}
