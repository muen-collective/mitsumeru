// Generates themes/eva-<nn>.json and lib/client.js from
// palette/eva.json. Run from the repo root: node scripts/gen-themes.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const palette = JSON.parse(readFileSync(join(root, 'palette', 'eva.json'), 'utf8'))

const hexToRgb = (hex) => {
  const value = hex.replace('#', '')
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ]
}

const rgba = (hex, alpha) => `rgba(${hexToRgb(hex).join(', ')}, ${alpha})`

const mixHex = (a, b, t) => {
  const pa = hexToRgb(a)
  const pb = hexToRgb(b)
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t))
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

// EVA palette role -> --dsw-alias-* token mapping. Entries are either a color
// name or { color, alpha } for translucent roles. light covers EVA 00; dark
// covers EVA 01 (surface order flips between the two). Token
// roles follow the official design-platform.css alias directory.
const TOKEN_MAPS = {
  dark: {
    // blue-450/500 stay pinned to mauve (the session meter "messages" chip
    // and trajectory labels use them); the rest of the static ladder is
    // generated from STATIC_LADDERS below. Everything else maps by alias.
    '--dsw-static-blue-450': 'purple',
    '--dsw-static-blue-500': 'purple',
    '--dsw-ctp-sky': 'teal',
    '--dsw-ctp-peach': 'orange',
    '--dsw-ctp-lavender': 'purpleText',
    '--dsw-ctp-blue': 'navy',
    '--dsw-ctp-pink': 'purpleText',
    '--dsw-ctp-teal': 'teal',
    '--dsw-ctp-sapphire': 'tealDeep',
    '--dsw-ctp-rosewater': 'orange',
    '--dsw-ctp-flamingo': 'red',
    '--dsw-ctp-maroon': 'red',
    '--dsw-alias-bg-base': 'base',
    '--dsw-alias-bg-layer-1': 'mantle',
    '--dsw-alias-bg-layer-2': 'surface0',
    '--dsw-alias-bg-layer-3': 'surface1',
    '--dsw-alias-bg-overlay': 'surface0',
    '--dsw-alias-bg-mask-1': { color: 'crust', alpha: 0.5 },
    '--dsw-alias-bg-mask-2': { color: 'crust', alpha: 0.2 },
    '--dsw-alias-bg-mask-3': { color: 'crust', alpha: 0.48 },
    '--dsw-alias-bg-module-platform': 'surface0',
    '--dsw-alias-bg-multi-select': 'surface0',
    '--dsw-alias-bg-skeleton': { color: 'surface1', alpha: 0.08 },
    '--dsw-alias-border-l1': { color: 'overlay0', alpha: 0.25 },
    '--dsw-alias-border-l2': { color: 'overlay1', alpha: 0.45 },
    '--dsw-alias-border-l3': { color: 'overlay1', alpha: 0.55 },
    '--dsw-alias-border-l4': { color: 'overlay1', alpha: 0.7 },
    '--dsw-alias-label-primary': 'text',
    '--dsw-alias-label-secondary': 'subtext0',
    '--dsw-alias-label-tertiary': 'subtext1',
    '--dsw-alias-label-caption': 'subtext1',
    '--dsw-alias-label-dimmed': 'subtext1',
    '--dsw-alias-brand-primary': 'purple',
    '--dsw-alias-brand-text': 'crust',
    '--dsw-alias-button-primary-hover': 'purpleText',
    '--dsw-alias-button-primary-dimmed': 'surface0',
    '--dsw-alias-button-elevated-fill': 'surface0',
    '--dsw-alias-button-floating-fill': 'surface1',
    '--dsw-alias-button-floating-hover': 'surface2',
    '--dsw-alias-button-ghost-active-border': 'surface2',
    '--dsw-alias-button-ghost-active-fill': 'surface0',
    '--dsw-alias-button-ghost-active-hover': 'surface1',
    '--dsw-alias-state-business-primary': 'purple',
    '--dsw-alias-state-business-tertiary': 'surface0',
    '--dsw-alias-state-error-primary': 'red',
    '--dsw-alias-state-error-secondary': 'red',
    '--dsw-alias-state-success-primary': 'mint',
    '--dsw-alias-state-success-secondary': 'mint',
    '--dsw-alias-state-success-tertiary': 'surface0',
    '--dsw-alias-state-warn-label': 'yellow',
    '--dsw-alias-state-warn-primary': 'yellow',
    '--dsw-alias-state-warn-secondary': 'yellow',
    '--dsw-alias-state-warn-tertiary': 'surface0',
    '--dsw-alias-interactive-bg-hover': { color: 'surface0', alpha: 0.45 },
    '--dsw-alias-interactive-bg-active': { color: 'surface1', alpha: 0.55 },
    '--dsw-alias-interactive-bg-hover-accent': { color: 'purple', alpha: 0.14 },
    '--dsw-alias-interactive-bg-hover-danger': { color: 'red', alpha: 0.15 },
    '--dsw-alias-interactive-bg-hover-solid': 'surface1',
    // code block surface one step below the page background, exactly
    // like the VS Code theme ports' code-block background (= mantle)
    '--dsw-alias-markdown-code-block': 'mantle',
    '--dsw-alias-markdown-code-block-banner': 'surface0',
    '--dsw-alias-markdown-code-segment-selected': 'surface0',
    '--dsw-alias-markdown-code-segment-unselected': 'mantle',
    '--dsw-alias-markdown-citation': 'surface0',
    '--dsw-alias-markdown-inline-code': 'surface0',
    '--dsw-alias-markdown-placeholder': 'surface0',
    // Links and the active tab take the SECONDARY accent (EVA mint), not the
    // brand purple: the purple already carries buttons, user bubbles and icons,
    // so these two read as a different family on purpose.
    //
    // `--dsw-alias-link` matters more than it looks: the built-in theme defines
    // it (as --dsw-static-deepseek-500) and we did not, so markdown links,
    // file mentions and source links fell through to that built-in purple
    // instead of any colour we chose. Nothing warned — the token is simply
    // absent from our table.
    '--dsw-alias-link': 'accent2',
    // The active tab is `color: label-primary; background: markdown-tag`, so the
    // tab family is expressed through its fill. A flat accent2 fill reads as a
    // green chip; tinting it keeps the chrome quiet while the tab text still
    // comes up green.
    '--dsw-alias-markdown-tag': { color: 'accent2', alpha: 0.16 },
    '--dsw-alias-toast-bg': 'mantle',
    '--dsw-alias-tooltip-bg': 'surface0',
    '--dsw-specific-sidebar-fill': 'mantle',
    '--dsw-specific-sidebar-nav-item-active': 'surface1',
    '--dsw-specific-sidebar-nav-item-active-accent': { color: 'purple', alpha: 0.25 },
    '--dsw-specific-sidebar-nav-item-hover': 'surface0',
    '--dsw-specific-bubble': 'surface0',
    '--dsw-specific-bubble-highlight': 'surface1',
    '--dsw-specific-input-major': 'mantle',
    '--dsw-specific-login-input': 'mantle',
    '--dsw-specific-menu': 'surface0',
    '--dsw-specific-selector': 'surface1',
    '--dsw-specific-tip': 'surface0',
    '--dsw-alias-separator-primary': { color: 'purple', alpha: 0.8 },
    '--dsw-alias-scrollbar-bg-l1': 'surface0',
    '--dsw-alias-scrollbar-bg-l2': 'surface1',
    '--dsw-alias-scrollbar-hover-l1': 'surface2',
    '--dsw-alias-scrollbar-hover-l2': 'surface2',
    '--dsw-alias-bg-mask-photo': 'rgba(0, 0, 0, 0.88)',
    '--dsw-alias-bg-mask-drop': 'rgba(39, 39, 48, 0.7)',
    '--dsw-alias-border-inverted': 'rgba(255, 255, 255, 0.06)',
    '--dsw-alias-border-inverted2': 'rgba(255, 255, 255, 0.08)',
    '--dsw-alias-border-l2-darkmode-thin': { color: 'overlay1', alpha: 0.3 },
    '--dsw-alias-brand-primary-invert': 'text',
    '--dsw-alias-brand-primary-new-colorprimary-new-color': 'purple',
    '--dsw-alias-button-contrast-fill': 'text',
    '--dsw-alias-button-info-fill': 'purple',
    '--dsw-alias-button-info-hover': { mix: ['purple', 'base'], t: 0.6 },
    '--dsw-alias-button-primary-fill': 'purple',
    '--dsw-alias-button-tool-bar-fill': { color: 'overlay0', alpha: 0.5 },
    '--dsw-alias-button-tool-bar-fill-invisible': { color: 'overlay0', alpha: 0.36 },
    '--dsw-alias-button-tool-bar-hover': { color: 'overlay1', alpha: 0.6 },
    '--dsw-alias-label-primary-bluish': 'text',
    '--dsw-alias-label-primary-dimmed': 'subtext0',
    '--dsw-alias-label-primary-foreground': 'crust',
    '--dsw-alias-label-primary-inverted': 'surface0',
    '--shiki-foreground': 'text',
    '--shiki-background': 'mantle',
    '--shiki-token-constant': 'orange',
    '--shiki-token-string': 'mint',
    // comment/punctuation brightened to match the VS Code theme ports (its
    // comment is overlay2, punctuation inherits text); link goes blue;
    // the diff trio was completely unmapped before
    '--shiki-token-comment': 'overlay2',
    '--shiki-token-keyword': 'purple',
    '--shiki-token-parameter': 'red',
    '--shiki-token-function': 'navy',
    '--shiki-token-string-expression': 'mint',
    '--shiki-token-punctuation': 'subtext0',
    '--shiki-token-link': 'navy',
    '--shiki-token-inserted': 'mint',
    '--shiki-token-deleted': 'red',
    '--shiki-token-changed': 'orange',
  },
  light: {
    '--dsw-static-blue-450': 'purple',
    '--dsw-static-blue-500': 'purple',
    '--dsw-ctp-sky': 'blueSoft',
    '--dsw-ctp-peach': 'orange',
    '--dsw-ctp-lavender': 'blueMid',
    '--dsw-ctp-blue': 'purple',
    '--dsw-ctp-pink': 'blueSoft',
    '--dsw-ctp-teal': 'blueSoft',
    '--dsw-ctp-sapphire': 'blueMid',
    '--dsw-ctp-rosewater': 'orange',
    '--dsw-ctp-flamingo': 'red',
    '--dsw-ctp-maroon': 'red',
    '--dsw-alias-bg-base': 'base',
    '--dsw-alias-bg-layer-1': 'base',
    '--dsw-alias-bg-layer-2': 'mantle',
    '--dsw-alias-bg-layer-3': 'surface0',
    '--dsw-alias-bg-overlay': 'base',
    '--dsw-alias-bg-mask-1': { color: 'crust', alpha: 0.24 },
    '--dsw-alias-bg-mask-2': { color: 'crust', alpha: 0.12 },
    '--dsw-alias-bg-mask-3': { color: 'crust', alpha: 0.48 },
    '--dsw-alias-bg-module-platform': 'mantle',
    '--dsw-alias-bg-multi-select': 'mantle',
    '--dsw-alias-bg-skeleton': { color: 'surface0', alpha: 0.04 },
    '--dsw-alias-border-l1': { color: 'overlay0', alpha: 0.3 },
    '--dsw-alias-border-l2': { color: 'overlay1', alpha: 0.5 },
    '--dsw-alias-border-l3': { color: 'overlay1', alpha: 0.6 },
    '--dsw-alias-border-l4': { color: 'overlay1', alpha: 0.75 },
    '--dsw-alias-label-primary': 'text',
    '--dsw-alias-label-secondary': 'subtext0',
    '--dsw-alias-label-tertiary': 'subtext1',
    '--dsw-alias-label-caption': 'subtext1',
    '--dsw-alias-label-dimmed': 'subtext1',
    '--dsw-alias-brand-primary': 'purple',
    '--dsw-alias-brand-text': 'base',
    // Hover must stay distinct from BOTH the fill and the label on it.
    // It was blueHover (a LIGHTER step) while the fill was light blue; the fill
    // is dark blue now, so lighter converges on the label — the same collision
    // this note exists to prevent, from the other side. Go DARKER.
    '--dsw-alias-button-primary-hover': 'blueHoverDeep',
    '--dsw-alias-button-primary-dimmed': 'mantle',
    '--dsw-alias-button-elevated-fill': 'base',
    '--dsw-alias-button-floating-fill': 'base',
    '--dsw-alias-button-floating-hover': 'mantle',
    '--dsw-alias-button-ghost-active-border': 'surface1',
    '--dsw-alias-button-ghost-active-fill': 'mantle',
    '--dsw-alias-button-ghost-active-hover': 'surface0',
    '--dsw-alias-state-business-primary': 'purple',
    '--dsw-alias-state-business-tertiary': 'mantle',
    '--dsw-alias-state-error-primary': 'red',
    '--dsw-alias-state-error-secondary': 'red',
    '--dsw-alias-state-success-primary': 'mint',
    '--dsw-alias-state-success-secondary': 'mint',
    '--dsw-alias-state-success-tertiary': 'mantle',
    '--dsw-alias-state-warn-label': 'orange',
    '--dsw-alias-state-warn-primary': 'orange',
    '--dsw-alias-state-warn-secondary': 'orange',
    '--dsw-alias-state-warn-tertiary': 'mantle',
    '--dsw-alias-interactive-bg-hover': { color: 'surface0', alpha: 0.3 },
    '--dsw-alias-interactive-bg-active': { color: 'surface1', alpha: 0.4 },
    '--dsw-alias-interactive-bg-hover-accent': { color: 'purple', alpha: 0.1 },
    '--dsw-alias-interactive-bg-hover-danger': { color: 'red', alpha: 0.05 },
    '--dsw-alias-interactive-bg-hover-solid': 'mantle',
    '--dsw-alias-markdown-code-block': 'mantle',
    '--dsw-alias-markdown-code-block-banner': 'mantle',
    '--dsw-alias-markdown-code-segment-selected': 'base',
    '--dsw-alias-markdown-code-segment-unselected': 'mantle',
    '--dsw-alias-markdown-citation': 'mantle',
    '--dsw-alias-markdown-inline-code': 'base',
    '--dsw-alias-markdown-placeholder': 'mantle',
    // Same two roles as dark (see there), with the deeper green: the bright
    // mint does not carry on the pale surface.
    '--dsw-alias-link': 'accent2',
    '--dsw-alias-markdown-tag': { color: 'accent2', alpha: 0.16 },
    '--dsw-alias-toast-bg': 'surface0',
    '--dsw-alias-tooltip-bg': 'surface1',
    '--dsw-specific-sidebar-fill': 'mantle',
    '--dsw-specific-sidebar-nav-item-active': 'surface1',
    '--dsw-specific-sidebar-nav-item-active-accent': { color: 'purple', alpha: 0.2 },
    '--dsw-specific-sidebar-nav-item-hover': 'surface0',
    '--dsw-specific-bubble': 'mantle',
    '--dsw-specific-bubble-highlight': 'surface0',
    '--dsw-specific-input-major': 'base',
    '--dsw-specific-login-input': 'mantle',
    '--dsw-specific-menu': 'mantle',
    '--dsw-specific-selector': 'surface0',
    '--dsw-specific-tip': 'mantle',
    '--dsw-alias-separator-primary': { color: 'purple', alpha: 0.7 },
    '--dsw-alias-scrollbar-bg-l1': 'surface0',
    '--dsw-alias-scrollbar-bg-l2': 'surface1',
    '--dsw-alias-scrollbar-hover-l1': 'surface2',
    '--dsw-alias-scrollbar-hover-l2': 'surface2',
    '--dsw-alias-bg-mask-photo': 'rgba(0, 0, 0, 0.88)',
    '--dsw-alias-bg-mask-drop': 'rgba(255, 255, 255, 0.7)',
    '--dsw-alias-border-inverted': 'rgba(0, 0, 0, 0)',
    '--dsw-alias-border-inverted2': 'rgba(0, 0, 0, 0)',
    '--dsw-alias-border-l2-darkmode-thin': { color: 'overlay1', alpha: 0.35 },
    '--dsw-alias-brand-primary-invert': 'text',
    '--dsw-alias-brand-primary-new-colorprimary-new-color': 'purple',
    '--dsw-alias-button-contrast-fill': 'text',
    '--dsw-alias-button-info-fill': 'purple',
    '--dsw-alias-button-info-hover': { mix: ['purple', 'base'], t: 0.6 },
    '--dsw-alias-button-primary-fill': 'purple',
    '--dsw-alias-button-tool-bar-fill': { color: 'overlay1', alpha: 0.5 },
    '--dsw-alias-button-tool-bar-fill-invisible': { color: 'overlay1', alpha: 0.36 },
    '--dsw-alias-button-tool-bar-hover': { color: 'overlay2', alpha: 0.6 },
    '--dsw-alias-label-primary-bluish': 'text',
    '--dsw-alias-label-primary-dimmed': 'subtext0',
    // The primary button is `background: button-primary-fill; color: here`.
    // The light fill needs a dark label; this was mapped to the near-white
    // surface from when the light accent was a deep navy.
    '--dsw-alias-label-primary-foreground': 'purpleText',
    '--dsw-alias-label-primary-inverted': 'base',
    '--shiki-foreground': 'text',
    '--shiki-background': 'mantle',
    '--shiki-token-constant': 'orange',
    '--shiki-token-string': 'mint',
    '--shiki-token-comment': 'overlay1',
    '--shiki-token-keyword': 'purple',
    '--shiki-token-parameter': 'red',
    '--shiki-token-function': 'navy',
    '--shiki-token-string-expression': 'mint',
    '--shiki-token-punctuation': 'subtext1',
    '--shiki-token-link': 'navy',
    '--shiki-token-inserted': 'mint',
    '--shiki-token-deleted': 'red',
    '--shiki-token-changed': 'orange',
  },
}

const FLAVORS = [
  { key: 'eva01', id: 'eva-01', colorScheme: 'dark' },
  { key: 'eva00', id: 'eva-00', colorScheme: 'light' },
]

// Static color ladder plans: the official --dsw-static-* steps mapped onto
// the EVA ramp. `neutral` covers neutral-bluish / neutral (00 =
// lightest, 1000 = darkest). Functional families map their 500 step to the
// EVA accent and derive lighter/darker steps by mixing toward the
// scheme's light text or deep base (never out-of-palette colors). A plain
// string is a palette color name; [color, against, pct] is color-mix.
const STATIC_LADDERS = {
  dark: {
    // Interpolated so every step is unique (no flattened ladder); the ramp
    // runs lightest (00) to darkest (1000).
    neutral: {
      '00': 'text',
      '50': ['text', 'subtext1', 50],
      '60': 'subtext1',
      '75': ['subtext1', 'subtext0', 50],
      '100': 'subtext0',
      '150': ['subtext0', 'overlay2', 50],
      '200': 'overlay2',
      '250': ['overlay2', 'overlay1', 50],
      '300': 'overlay1',
      '400': ['overlay1', 'overlay0', 50],
      '500': 'surface2',
      '550': ['surface2', 'surface1', 50],
      '600': 'surface1',
      '700': 'surface0',
      '750': ['surface0', 'base', 50],
      '800': ['surface0', 'base', 25],
      '850': 'base',
      '875': ['base', 'mantle', 50],
      '900': 'mantle',
      '950': ['mantle', 'crust', 50],
      '1000': 'crust',
    },
    deepseek: {
      '50': ['purple', 'text', 55], '100': ['purple', 'text', 35], '200': 'purpleText',
      '300': ['purple', 'base', 70], '400': 'purple', '450': 'purple', '500': 'purple',
      '600': ['purple', 'base', 60], '700-delete': ['purple', 'base', 45],
      '800': ['purple', 'base', 30], '900': ['purple', 'base', 20],
    },
    blue: {
      '50': ['navy', 'text', 55], '50p': ['navy', 'text', 45], '75': ['navy', 'text', 35],
      '100': ['navy', 'text', 25], '300': ['navy', 'base', 75], '400': ['navy', 'base', 85],
      '450': ['navy', 'base', 90], '500': 'navy', '600': ['navy', 'base', 70],
      '800': ['navy', 'base', 50], '900': ['navy', 'base', 35], '950': ['navy', 'base', 25],
    },
    green: { '100': ['mint', 'text', 30], '400': ['mint', 'base', 75], '500': 'mint', '900': ['mint', 'base', 35] },
    red: { '50': ['red', 'text', 40], '100': ['red', 'text', 25], '400': ['red', 'base', 75], '500': 'red', '600': ['red', 'base', 65], '900': ['red', 'base', 35] },
    amber: { '100': ['yellow', 'text', 30], '400': ['yellow', 'base', 85], '500': 'orange', '600': 'orange', '900': ['orange', 'base', 40] },
  },
  light: {
    neutral: {
      '00': 'base',
      '50': ['base', 'mantle', 50],
      '60': 'mantle',
      '75': ['mantle', 'surface0', 50],
      '100': 'surface0',
      '150': ['surface0', 'surface1', 50],
      '200': 'surface1',
      '250': ['surface1', 'surface2', 50],
      '300': 'surface2',
      '400': ['surface2', 'overlay0', 50],
      '500': 'overlay1',
      '550': ['overlay1', 'overlay2', 50],
      '600': 'overlay2',
      '700': ['overlay2', 'subtext0', 50],
      '750': 'subtext0',
      '800': ['subtext0', 'subtext1', 50],
      '850': 'subtext1',
      '875': ['subtext1', 'text', 50],
      '900': 'text',
      '950': 'text',
      '1000': 'text',
    },
    deepseek: {
      '50': ['purple', 'base', 60], '100': ['purple', 'base', 40], '200': 'purpleText',
      '300': ['purple', 'base', 75], '400': 'purple', '450': 'purple', '500': 'purple',
      '600': ['purple', 'text', 65], '700-delete': ['purple', 'text', 45],
      '800': ['purple', 'text', 30], '900': ['purple', 'text', 18],
    },
    blue: {
      '50': ['navy', 'base', 60], '50p': ['navy', 'base', 48], '75': ['navy', 'base', 38],
      '100': ['navy', 'base', 28], '300': ['navy', 'base', 78], '400': ['navy', 'base', 88],
      '450': ['navy', 'base', 92], '500': 'navy', '600': ['navy', 'text', 70],
      '800': ['navy', 'text', 50], '900': ['navy', 'text', 35], '950': ['navy', 'text', 25],
    },
    green: { '100': ['mint', 'base', 35], '400': ['mint', 'base', 80], '500': 'mint', '900': ['mint', 'text', 35] },
    red: { '50': ['red', 'base', 45], '100': ['red', 'base', 28], '400': ['red', 'base', 78], '500': 'red', '600': ['red', 'text', 68], '900': ['red', 'text', 35] },
    amber: { '100': ['yellow', 'base', 35], '400': ['yellow', 'base', 88], '500': 'orange', '600': 'orange', '900': ['orange', 'text', 40] },
  },
}

const buildStaticTokens = (colors, scheme) => {
  const tokens = {}
  const ladders = STATIC_LADDERS[scheme]
  for (const [family, plan] of Object.entries(ladders)) {
    const names = family === 'neutral' ? ['neutral-bluish', 'neutral'] : [family]
    for (const [step, value] of Object.entries(plan)) {
      for (const name of names) {
        const key = `--dsw-static-${name}-${step}`
        if (typeof value === 'string') {
          tokens[key] = colors[value].hex
        } else {
          const [color, against, pct] = value
          tokens[key] = `color-mix(in srgb, ${colors[color].hex} ${pct}%, ${colors[against].hex})`
        }
      }
    }
  }
  return tokens
}

const buildTokens = (colors, scheme) => {
  const tokens = {}
  // Static ladder first; explicit TOKEN_MAPS entries (e.g. the mauve pins for
  // blue-450/500) win over generated ladder steps.
  Object.assign(tokens, buildStaticTokens(colors, scheme))
  for (const [token, mapping] of Object.entries(TOKEN_MAPS[scheme])) {
    if (typeof mapping === 'string') {
      tokens[token] = colors[mapping] ? colors[mapping].hex : mapping
    } else if ('mix' in mapping) {
      const [a, b] = mapping.mix
      tokens[token] = mixHex(colors[a].hex, colors[b].hex, mapping.t)
    } else {
      tokens[token] = rgba(colors[mapping.color].hex, mapping.alpha)
    }
  }
  return tokens
}

const skins = FLAVORS.map(({ key, id, colorScheme }) => {
  const colors = palette[key].colors
  const skin = {
    id,
    name: palette[key].name,
    colorScheme,
    tokens: buildTokens(colors, colorScheme),
  }
  writeFileSync(
    join(root, 'themes', `${id}.json`),
    JSON.stringify(skin, null, 2) + '\n',
  )
  return skin
})

const template = readFileSync(join(root, 'lib', 'client.tpl.js'), 'utf8')
const client = template.replace('__SKINS__', JSON.stringify(skins, null, 2))
writeFileSync(join(root, 'lib', 'client.js'), client)

console.log(`generated ${skins.length} themes and lib/client.js`)
