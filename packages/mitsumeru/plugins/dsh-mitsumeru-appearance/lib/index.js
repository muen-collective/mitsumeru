// @muen/dsh-mitsumeru-appearance — host half.
//
// This is an appearance package: the host registers nothing and does nothing.
// All rendering is in ./client.js, which registers two rows into the Settings
// **General** section (the same slot dsh's own Appearance cubes use) and applies
// the accent as one token-override layer.
//
// Deliberately no `inject` list and no `webServer`. The marks are files under
// <userData>/brand/, read through the shell's preload bridge, so this plugin owns
// no route and needs no host service — which is also why it has no host half to
// speak of. The dream-skin ancestor served its state through a private
// /…/api route only because a `-dev` build bound a new port on every launch;
// that port is the shell's business and nothing here depends on page origin.
export const name = 'mitsumeru-appearance'
export const inject = []
export function apply() {}

// Mount marker: the one thing a loader check can assert positively. A client
// module that throws on import leaves the boot succeeding with only a console
// error, so absence must be detectable from the renderer, not assumed.
export const MOUNT_MARKER = 'mitsumeru-appearance'
