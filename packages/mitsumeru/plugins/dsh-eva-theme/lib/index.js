/**
 * @muen/dsh-eva-theme — host half.
 *
 * The whole feature lives in the browser half (`./client`), which DSH's
 * dsh-client-modules picks up through the package's `dsh.client` declaration.
 * This entry exists so the loader has something to mount, and so the two host
 * routes the browser half talks to are served.
 *
 * Routes (the same `webServer.register` shape the shipped ui-* packages use):
 *
 *   - `/eva/state` (GET / PUT): durable theme persistence in a small JSON file
 *     under $DSH_HOME. The browser half also writes localStorage, but DSH
 *     Desktop serves the UI from a random per-launch loopback port and
 *     localStorage is scoped per origin INCLUDING the port, so localStorage
 *     alone loses the choice on every relaunch. This file is what survives.
 *   - `/eva/check-update` (GET): answered with `ok: false`. Upstream catppuccin
 *     queries the npm registry for its own package, which is meaningless here:
 *     this plugin is vendored into the app and is not published anywhere, so
 *     there is nothing to update to and no npm command a user could run.
 *     Reporting "up to date" would be a lie; the browser half renders the
 *     error state, which is the honest outcome. If this plugin is ever
 *     published, restore the registry lookup here.
 *
 * Both routes are released on teardown.
 */
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";

const STATE_PATH = "/eva/state";
const CHECK_UPDATE_PATH = "/eva/check-update";
const STATE_VERSION = 1;

/** $DSH_HOME, falling back to ~/.dsh the way the harness resolves it. */
function dshHome() {
  const configured = process.env.DSH_HOME?.trim();
  return configured !== undefined && configured !== "" ? configured : join(homedir(), ".dsh");
}

function stateFile() {
  return join(dshHome(), "eva-theme-state.json");
}

/** Read the durable state; an unreadable or malformed file reads as empty. */
function readDurableState() {
  try {
    const parsed = JSON.parse(readFileSync(stateFile(), "utf8"));
    return typeof parsed === "object" && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

/** Write the durable state atomically (temp + rename) so a crash cannot truncate it. */
function writeDurableState(value) {
  const target = stateFile();
  mkdirSync(dirname(target), { recursive: true });
  const temp = `${target}.${process.pid}.tmp`;
  writeFileSync(temp, `${JSON.stringify({ ...value, version: STATE_VERSION }, null, 2)}\n`, "utf8");
  renameSync(temp, target);
}

function json(res, status, payload) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

/** Cordis entry: register the routes and release them on teardown. */
export function apply(ctx) {
  const webServer = ctx.get("webServer");
  if (webServer === undefined) return;

  const disposers = [
    webServer.register({
      kind: "exact",
      path: STATE_PATH,
      handler: async (req, res) => {
        if (req.method === "GET") {
          json(res, 200, readDurableState() ?? {});
          return;
        }
        if (req.method === "PUT") {
          try {
            const parsed = JSON.parse(await readBody(req));
            if (typeof parsed !== "object" || parsed === null) throw new Error("bad body");
            writeDurableState(parsed);
            json(res, 200, { ok: true });
          } catch (error) {
            json(res, 400, { ok: false, error: error instanceof Error ? error.message : String(error) });
          }
          return;
        }
        json(res, 405, { ok: false, error: "method not allowed" });
      }
    }),
    webServer.register({
      kind: "exact",
      path: CHECK_UPDATE_PATH,
      handler: (_req, res) => {
        json(res, 200, {
          ok: false,
          error: "not-published",
          detail: "this theme ships with the app; there is nothing to check"
        });
      }
    })
  ];

  ctx.effect(() => () => {
    for (const dispose of disposers) dispose();
  }, "dsh-eva-theme: host routes");
}
