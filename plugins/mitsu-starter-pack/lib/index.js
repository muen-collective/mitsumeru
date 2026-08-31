/**
 * @muen/mitsu-starter-pack — Host half.
 *
 * The browser half registers the "Creative workflows" settings section (a
 * placeholder for the git-JSON-versioned workflow runner designed next).
 *
 * This host half provides the `mitsu.pack` service NAME so the seam is intact
 * for when the versioned-workflow runner lands (it will read a versioned JSON
 * workflow from the workspace, resolve a runner, and surface run/status). Until
 * then it carries no active networking — the placeholder client is static.
 *
 * No key, no external API is read here; the RunningHub adapter and the fashion
 * starter pack are deferred. Keep this minimal: the workflow runner is the next
 * design milestone.
 */
const name = 'mitsu-starter-pack'

function apply(ctx) {
  // Minimal seam: provide a service descriptor so future host code (the
  // versioned-workflow runner) can slot in without touching the client mount.
  ctx.provide('mitsu.pack', {
    ready: false,                       // true once the workflow runner exists
    description: 'Creative workflow runner (git-JSON versioning — designed next)',
  })
}

export default { name, inject: [], apply }
