#!/usr/bin/env node
/**
 * Structural check on the generated themes: no UI colour may become invisible.
 *
 * WHY THIS EXISTS. The light theme shipped `button-primary-hover` and
 * `label-primary-foreground` as the SAME token, so the primary button's label
 * took the exact colour of the fill underneath it on hover — contrast 1.00,
 * text gone. It was not visible in a screenshot because you have to hover to
 * hit it, and nothing in the theme vocabulary says the two are related.
 *
 * So this asserts the relationships that actually matter on screen:
 *
 *   1. A fill and the text drawn on it are not the same colour.
 *   2. Interactive states (hover, dimmed) are DISTINCT from the resting fill —
 *      otherwise the state is invisible.
 *   3. Every pair in (1) clears a real contrast floor.
 *
 * It reads themes/*.json, so it checks what ships, not what the generator
 * intended.
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Relative luminance of #rrggbb or rgb()/rgba(); null when not a solid colour. */
function luminance(value) {
  if (typeof value !== "string") return null;
  let r, g, b;
  const hex = value.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    [r, g, b] = [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16));
  } else {
    const rgb = value.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
    if (!rgb) return null;
    [r, g, b] = [1, 2, 3].map((i) => Number(rgb[i]));
  }
  const f = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** WCAG contrast ratio, or null if either colour is translucent/unparseable. */
function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  if (la === null || lb === null) return null;
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Pairs that must stay legible. `min` is the floor: 3.0 for large/bold text and
 * non-text indicators, 4.5 for body text.
 */
const PAIRS = [
  { what: "primary button label on its fill", fg: "label-primary-foreground", bg: "button-primary-fill", min: 3 },
  { what: "primary button label on its HOVER fill", fg: "label-primary-foreground", bg: "button-primary-hover", min: 3 },
  { what: "body text on the base surface", fg: "label-primary", bg: "bg-base", min: 4.5 },
  { what: "body text on layer-2", fg: "label-primary", bg: "bg-layer-2", min: 4.5 },
  { what: "secondary text on base", fg: "label-secondary", bg: "bg-base", min: 3 },
  { what: "links on base", fg: "link", bg: "bg-base", min: 3 },
  { what: "links on layer-2", fg: "link", bg: "bg-layer-2", min: 3 },
  { what: "text on a tooltip", fg: "label-primary", bg: "tooltip-bg", min: 3 },
  { what: "error text on base", fg: "state-error-primary", bg: "bg-base", min: 3 },
  { what: "success text on base", fg: "state-success-primary", bg: "bg-base", min: 3 }
];

/**
 * Colours that must NOT be identical, even where contrast is not the point.
 * An interactive state that matches its resting state cannot be seen at all.
 */
const DISTINCT = [
  { what: "button hover vs resting fill", a: "button-primary-fill", b: "button-primary-hover" },
  { what: "button dimmed vs resting fill", a: "button-primary-fill", b: "button-primary-dimmed" },
  { what: "hover fill vs the label on it", a: "button-primary-hover", b: "label-primary-foreground" },
  { what: "layer-2 vs layer-3", a: "bg-layer-2", b: "bg-layer-3" }
];

let failures = 0;
const fail = (msg) => { console.log(`  FAIL  ${msg}`); failures++; };

for (const file of readdirSync(join(ROOT, "themes")).filter((f) => f.endsWith(".json")).sort()) {
  const theme = JSON.parse(readFileSync(join(ROOT, "themes", file), "utf8"));
  const t = theme.tokens;
  const get = (k) => t[`--dsw-alias-${k}`];
  console.log(`\n${file}  (${theme.colorScheme})`);

  for (const { what, fg, bg, min } of PAIRS) {
    const a = get(fg);
    const b = get(bg);
    const ratio = contrast(a, b);
    if (ratio === null) {
      // translucent or non-colour values are legitimate here; note and skip
      console.log(`  skip  ${what}  (${fg}=${a}, ${bg}=${b} is not a solid pair)`);
      continue;
    }
    const ok = ratio >= min;
    const line = `${ok ? "ok  " : "FAIL"}  ${what}: ${ratio.toFixed(2)} (min ${min})  ${a} on ${b}`;
    if (ok) console.log(`  ${line}`);
    else fail(`${file}: ${line}`);
  }

  for (const { what, a, b } of DISTINCT) {
    const va = get(a);
    const vb = get(b);
    if (va === vb) fail(`${file}: ${what} are the SAME colour (${va}) — the state is invisible`);
    else console.log(`  ok    ${what}: ${va} != ${vb}`);
  }
}

console.log(failures === 0
  ? "\ncheck-contrast: all theme colours are legible and states are distinct"
  : `\ncheck-contrast: ${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
