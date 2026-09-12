// dsh-eva — browser half (client plugin bundle). GENERATED FILE:
// run `node scripts/gen-themes.mjs` to regenerate from lib/client.tpl.js.
//
// Loaded by dsh-client-modules at /plugins/@muen/dsh-eva-theme/client.js and
// executed through the vendored cordis Loader's lazy-CJS module table
// (window.__ModuleLoader__.load). The factory body is plain CJS with
// require() resolved against the shell's module table — the same shape the
// shipped ui-* packages' tsdown bundles emit.
//
// COMPATIBILITY — this bundle may require ONLY the words in the web shell's
// seed module table, measured against the harness this app pins
// (@deepseek-ai/dsh@0.1.5-rc.1): react, react/jsx-runtime, react-dom,
// react-dom/client, @deepseek-ai/cordis, @deepseek-ai/dsh-client-store,
// @deepseek-ai/dsh-client-ui-slots, @deepseek-ai/dsh-client-ui-primitives,
// @deepseek-ai/dsh-client-ui-dockkit.
//
// `defineStore` used to be imported from `@deepseek-ai/dsh-client-runtime`.
// That package no longer exists in the shell (it is not on disk and not in
// the seed table), so requiring it throws at materialization and takes the
// whole client plugin down. It lives in `@deepseek-ai/dsh-client-store` now.
// The array-of-strings `inject` below is cordis SERVICE injection and is
// unrelated to these require() targets.
window.__ModuleLoader__.load({
	id: "@muen/dsh-eva-theme",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let _client_store = require("@deepseek-ai/dsh-client-store");

		//#region dsh-eva: definitions
		/** The settings row's locale namespace. */
		const SETTINGS_NS = "settings.eva";
		/** localStorage key holding the selected theme id. */
		const STORAGE_KEY = "dsh-eva:skin";
		/** localStorage key remembering the last built-in preference. */
		const RESTORE_KEY = "dsh-eva:restore";
		const DEFAULT_SKIN = "system";

		/**
		 * The EVA theme catalog, generated from the official
		 * palette/eva.json. Each entry is a third-party theme
		 * for the built-in ThemeRuntime: an id, the base palette it builds on
		 * (colorScheme drives body[data-ds-dark-theme]), and --dsw-alias-*
		 * overrides applied as inline custom properties on <body> by
		 * ui-layout's ThemePresenter. Values are concrete CSS colors (no var()
		 * indirection).
		 */
		const SKINS = [
  {
    "id": "eva-01",
    "name": "EVA 01",
    "colorScheme": "dark",
    "tokens": {
      "--dsw-static-neutral-bluish-50": "color-mix(in srgb, #f2efee 50%, #d8d2d4)",
      "--dsw-static-neutral-50": "color-mix(in srgb, #f2efee 50%, #d8d2d4)",
      "--dsw-static-neutral-bluish-60": "#d8d2d4",
      "--dsw-static-neutral-60": "#d8d2d4",
      "--dsw-static-neutral-bluish-75": "color-mix(in srgb, #d8d2d4 50%, #b3a7b0)",
      "--dsw-static-neutral-75": "color-mix(in srgb, #d8d2d4 50%, #b3a7b0)",
      "--dsw-static-neutral-bluish-100": "#b3a7b0",
      "--dsw-static-neutral-100": "#b3a7b0",
      "--dsw-static-neutral-bluish-150": "color-mix(in srgb, #b3a7b0 50%, #9d909a)",
      "--dsw-static-neutral-150": "color-mix(in srgb, #b3a7b0 50%, #9d909a)",
      "--dsw-static-neutral-bluish-200": "#9d909a",
      "--dsw-static-neutral-200": "#9d909a",
      "--dsw-static-neutral-bluish-250": "color-mix(in srgb, #9d909a 50%, #8b7f88)",
      "--dsw-static-neutral-250": "color-mix(in srgb, #9d909a 50%, #8b7f88)",
      "--dsw-static-neutral-bluish-300": "#8b7f88",
      "--dsw-static-neutral-300": "#8b7f88",
      "--dsw-static-neutral-bluish-400": "color-mix(in srgb, #8b7f88 50%, #6f646c)",
      "--dsw-static-neutral-400": "color-mix(in srgb, #8b7f88 50%, #6f646c)",
      "--dsw-static-neutral-bluish-500": "#1d181d",
      "--dsw-static-neutral-500": "#1d181d",
      "--dsw-static-neutral-bluish-550": "color-mix(in srgb, #1d181d 50%, #221c22)",
      "--dsw-static-neutral-550": "color-mix(in srgb, #1d181d 50%, #221c22)",
      "--dsw-static-neutral-bluish-600": "#221c22",
      "--dsw-static-neutral-600": "#221c22",
      "--dsw-static-neutral-bluish-700": "#2a232a",
      "--dsw-static-neutral-700": "#2a232a",
      "--dsw-static-neutral-bluish-750": "color-mix(in srgb, #2a232a 50%, #141014)",
      "--dsw-static-neutral-750": "color-mix(in srgb, #2a232a 50%, #141014)",
      "--dsw-static-neutral-bluish-800": "color-mix(in srgb, #2a232a 25%, #141014)",
      "--dsw-static-neutral-800": "color-mix(in srgb, #2a232a 25%, #141014)",
      "--dsw-static-neutral-bluish-850": "#141014",
      "--dsw-static-neutral-850": "#141014",
      "--dsw-static-neutral-bluish-875": "color-mix(in srgb, #141014 50%, #0e0d0e)",
      "--dsw-static-neutral-875": "color-mix(in srgb, #141014 50%, #0e0d0e)",
      "--dsw-static-neutral-bluish-900": "#0e0d0e",
      "--dsw-static-neutral-900": "#0e0d0e",
      "--dsw-static-neutral-bluish-950": "color-mix(in srgb, #0e0d0e 50%, #070607)",
      "--dsw-static-neutral-950": "color-mix(in srgb, #0e0d0e 50%, #070607)",
      "--dsw-static-neutral-bluish-1000": "#070607",
      "--dsw-static-neutral-1000": "#070607",
      "--dsw-static-neutral-bluish-00": "#f2efee",
      "--dsw-static-neutral-00": "#f2efee",
      "--dsw-static-deepseek-50": "color-mix(in srgb, #9a4fdb 55%, #f2efee)",
      "--dsw-static-deepseek-100": "color-mix(in srgb, #9a4fdb 35%, #f2efee)",
      "--dsw-static-deepseek-200": "#c084fc",
      "--dsw-static-deepseek-300": "color-mix(in srgb, #9a4fdb 70%, #141014)",
      "--dsw-static-deepseek-400": "#9a4fdb",
      "--dsw-static-deepseek-450": "#9a4fdb",
      "--dsw-static-deepseek-500": "#9a4fdb",
      "--dsw-static-deepseek-600": "color-mix(in srgb, #9a4fdb 60%, #141014)",
      "--dsw-static-deepseek-800": "color-mix(in srgb, #9a4fdb 30%, #141014)",
      "--dsw-static-deepseek-900": "color-mix(in srgb, #9a4fdb 20%, #141014)",
      "--dsw-static-deepseek-700-delete": "color-mix(in srgb, #9a4fdb 45%, #141014)",
      "--dsw-static-blue-50": "color-mix(in srgb, #2a2438 55%, #f2efee)",
      "--dsw-static-blue-75": "color-mix(in srgb, #2a2438 35%, #f2efee)",
      "--dsw-static-blue-100": "color-mix(in srgb, #2a2438 25%, #f2efee)",
      "--dsw-static-blue-300": "color-mix(in srgb, #2a2438 75%, #141014)",
      "--dsw-static-blue-400": "color-mix(in srgb, #2a2438 85%, #141014)",
      "--dsw-static-blue-450": "#9a4fdb",
      "--dsw-static-blue-500": "#9a4fdb",
      "--dsw-static-blue-600": "color-mix(in srgb, #2a2438 70%, #141014)",
      "--dsw-static-blue-800": "color-mix(in srgb, #2a2438 50%, #141014)",
      "--dsw-static-blue-900": "color-mix(in srgb, #2a2438 35%, #141014)",
      "--dsw-static-blue-950": "color-mix(in srgb, #2a2438 25%, #141014)",
      "--dsw-static-blue-50p": "color-mix(in srgb, #2a2438 45%, #f2efee)",
      "--dsw-static-green-100": "color-mix(in srgb, #3ddc97 30%, #f2efee)",
      "--dsw-static-green-400": "color-mix(in srgb, #3ddc97 75%, #141014)",
      "--dsw-static-green-500": "#3ddc97",
      "--dsw-static-green-900": "color-mix(in srgb, #3ddc97 35%, #141014)",
      "--dsw-static-red-50": "color-mix(in srgb, #ff4538 40%, #f2efee)",
      "--dsw-static-red-100": "color-mix(in srgb, #ff4538 25%, #f2efee)",
      "--dsw-static-red-400": "color-mix(in srgb, #ff4538 75%, #141014)",
      "--dsw-static-red-500": "#ff4538",
      "--dsw-static-red-600": "color-mix(in srgb, #ff4538 65%, #141014)",
      "--dsw-static-red-900": "color-mix(in srgb, #ff4538 35%, #141014)",
      "--dsw-static-amber-100": "color-mix(in srgb, #f0b429 30%, #f2efee)",
      "--dsw-static-amber-400": "color-mix(in srgb, #f0b429 85%, #141014)",
      "--dsw-static-amber-500": "#e6770b",
      "--dsw-static-amber-600": "#e6770b",
      "--dsw-static-amber-900": "color-mix(in srgb, #e6770b 40%, #141014)",
      "--dsw-ctp-sky": "#3ddc97",
      "--dsw-ctp-peach": "#e6770b",
      "--dsw-ctp-lavender": "#c084fc",
      "--dsw-ctp-blue": "#2a2438",
      "--dsw-ctp-pink": "#c084fc",
      "--dsw-ctp-teal": "#3ddc97",
      "--dsw-ctp-sapphire": "#2f7d6a",
      "--dsw-ctp-rosewater": "#e6770b",
      "--dsw-ctp-flamingo": "#ff4538",
      "--dsw-ctp-maroon": "#ff4538",
      "--dsw-alias-bg-base": "#141014",
      "--dsw-alias-bg-layer-1": "#0e0d0e",
      "--dsw-alias-bg-layer-2": "#2a232a",
      "--dsw-alias-bg-layer-3": "#221c22",
      "--dsw-alias-bg-overlay": "#2a232a",
      "--dsw-alias-bg-mask-1": "rgba(7, 6, 7, 0.5)",
      "--dsw-alias-bg-mask-2": "rgba(7, 6, 7, 0.2)",
      "--dsw-alias-bg-mask-3": "rgba(7, 6, 7, 0.48)",
      "--dsw-alias-bg-module-platform": "#2a232a",
      "--dsw-alias-bg-multi-select": "#2a232a",
      "--dsw-alias-bg-skeleton": "rgba(34, 28, 34, 0.08)",
      "--dsw-alias-border-l1": "rgba(111, 100, 108, 0.25)",
      "--dsw-alias-border-l2": "rgba(139, 127, 136, 0.45)",
      "--dsw-alias-border-l3": "rgba(139, 127, 136, 0.55)",
      "--dsw-alias-border-l4": "rgba(139, 127, 136, 0.7)",
      "--dsw-alias-label-primary": "#f2efee",
      "--dsw-alias-label-secondary": "#b3a7b0",
      "--dsw-alias-label-tertiary": "#d8d2d4",
      "--dsw-alias-label-caption": "#d8d2d4",
      "--dsw-alias-label-dimmed": "#d8d2d4",
      "--dsw-alias-brand-primary": "#9a4fdb",
      "--dsw-alias-brand-text": "#070607",
      "--dsw-alias-button-primary-hover": "#c084fc",
      "--dsw-alias-button-primary-dimmed": "#2a232a",
      "--dsw-alias-button-elevated-fill": "#2a232a",
      "--dsw-alias-button-floating-fill": "#221c22",
      "--dsw-alias-button-floating-hover": "#1d181d",
      "--dsw-alias-button-ghost-active-border": "#1d181d",
      "--dsw-alias-button-ghost-active-fill": "#2a232a",
      "--dsw-alias-button-ghost-active-hover": "#221c22",
      "--dsw-alias-state-business-primary": "#9a4fdb",
      "--dsw-alias-state-business-tertiary": "#2a232a",
      "--dsw-alias-state-error-primary": "#ff4538",
      "--dsw-alias-state-error-secondary": "#ff4538",
      "--dsw-alias-state-success-primary": "#3ddc97",
      "--dsw-alias-state-success-secondary": "#3ddc97",
      "--dsw-alias-state-success-tertiary": "#2a232a",
      "--dsw-alias-state-warn-label": "#f0b429",
      "--dsw-alias-state-warn-primary": "#f0b429",
      "--dsw-alias-state-warn-secondary": "#f0b429",
      "--dsw-alias-state-warn-tertiary": "#2a232a",
      "--dsw-alias-interactive-bg-hover": "rgba(42, 35, 42, 0.45)",
      "--dsw-alias-interactive-bg-active": "rgba(34, 28, 34, 0.55)",
      "--dsw-alias-interactive-bg-hover-accent": "rgba(154, 79, 219, 0.14)",
      "--dsw-alias-interactive-bg-hover-danger": "rgba(255, 69, 56, 0.15)",
      "--dsw-alias-interactive-bg-hover-solid": "#221c22",
      "--dsw-alias-markdown-code-block": "#0e0d0e",
      "--dsw-alias-markdown-code-block-banner": "#2a232a",
      "--dsw-alias-markdown-code-segment-selected": "#2a232a",
      "--dsw-alias-markdown-code-segment-unselected": "#0e0d0e",
      "--dsw-alias-markdown-citation": "#2a232a",
      "--dsw-alias-markdown-inline-code": "#2a232a",
      "--dsw-alias-markdown-placeholder": "#2a232a",
      "--dsw-alias-link": "#3ddc97",
      "--dsw-alias-markdown-tag": "rgba(61, 220, 151, 0.16)",
      "--dsw-alias-toast-bg": "#0e0d0e",
      "--dsw-alias-tooltip-bg": "#2a232a",
      "--dsw-specific-sidebar-fill": "#0e0d0e",
      "--dsw-specific-sidebar-nav-item-active": "#221c22",
      "--dsw-specific-sidebar-nav-item-active-accent": "rgba(154, 79, 219, 0.25)",
      "--dsw-specific-sidebar-nav-item-hover": "#2a232a",
      "--dsw-specific-bubble": "#2a232a",
      "--dsw-specific-bubble-highlight": "#221c22",
      "--dsw-specific-input-major": "#0e0d0e",
      "--dsw-specific-login-input": "#0e0d0e",
      "--dsw-specific-menu": "#2a232a",
      "--dsw-specific-selector": "#221c22",
      "--dsw-specific-tip": "#2a232a",
      "--dsw-alias-separator-primary": "rgba(154, 79, 219, 0.8)",
      "--dsw-alias-scrollbar-bg-l1": "#2a232a",
      "--dsw-alias-scrollbar-bg-l2": "#221c22",
      "--dsw-alias-scrollbar-hover-l1": "#1d181d",
      "--dsw-alias-scrollbar-hover-l2": "#1d181d",
      "--dsw-alias-bg-mask-photo": "rgba(0, 0, 0, 0.88)",
      "--dsw-alias-bg-mask-drop": "rgba(39, 39, 48, 0.7)",
      "--dsw-alias-border-inverted": "rgba(255, 255, 255, 0.06)",
      "--dsw-alias-border-inverted2": "rgba(255, 255, 255, 0.08)",
      "--dsw-alias-border-l2-darkmode-thin": "rgba(139, 127, 136, 0.3)",
      "--dsw-alias-brand-primary-invert": "#f2efee",
      "--dsw-alias-brand-primary-new-colorprimary-new-color": "#9a4fdb",
      "--dsw-alias-button-contrast-fill": "#f2efee",
      "--dsw-alias-button-info-fill": "#9a4fdb",
      "--dsw-alias-button-info-hover": "#4a2964",
      "--dsw-alias-button-primary-fill": "#9a4fdb",
      "--dsw-alias-button-tool-bar-fill": "rgba(111, 100, 108, 0.5)",
      "--dsw-alias-button-tool-bar-fill-invisible": "rgba(111, 100, 108, 0.36)",
      "--dsw-alias-button-tool-bar-hover": "rgba(139, 127, 136, 0.6)",
      "--dsw-alias-label-primary-bluish": "#f2efee",
      "--dsw-alias-label-primary-dimmed": "#b3a7b0",
      "--dsw-alias-label-primary-foreground": "#070607",
      "--dsw-alias-label-primary-inverted": "#2a232a",
      "--shiki-foreground": "#f2efee",
      "--shiki-background": "#0e0d0e",
      "--shiki-token-constant": "#e6770b",
      "--shiki-token-string": "#3ddc97",
      "--shiki-token-comment": "#9d909a",
      "--shiki-token-keyword": "#9a4fdb",
      "--shiki-token-parameter": "#ff4538",
      "--shiki-token-function": "#2a2438",
      "--shiki-token-string-expression": "#3ddc97",
      "--shiki-token-punctuation": "#b3a7b0",
      "--shiki-token-link": "#2a2438",
      "--shiki-token-inserted": "#3ddc97",
      "--shiki-token-deleted": "#ff4538",
      "--shiki-token-changed": "#e6770b"
    }
  },
  {
    "id": "eva-00",
    "name": "EVA 00",
    "colorScheme": "light",
    "tokens": {
      "--dsw-static-neutral-bluish-50": "color-mix(in srgb, #f5f7fa 50%, #ffffff)",
      "--dsw-static-neutral-50": "color-mix(in srgb, #f5f7fa 50%, #ffffff)",
      "--dsw-static-neutral-bluish-60": "#ffffff",
      "--dsw-static-neutral-60": "#ffffff",
      "--dsw-static-neutral-bluish-75": "color-mix(in srgb, #ffffff 50%, #e4eaf2)",
      "--dsw-static-neutral-75": "color-mix(in srgb, #ffffff 50%, #e4eaf2)",
      "--dsw-static-neutral-bluish-100": "#e4eaf2",
      "--dsw-static-neutral-100": "#e4eaf2",
      "--dsw-static-neutral-bluish-150": "color-mix(in srgb, #e4eaf2 50%, #eef2f7)",
      "--dsw-static-neutral-150": "color-mix(in srgb, #e4eaf2 50%, #eef2f7)",
      "--dsw-static-neutral-bluish-200": "#eef2f7",
      "--dsw-static-neutral-200": "#eef2f7",
      "--dsw-static-neutral-bluish-250": "color-mix(in srgb, #eef2f7 50%, #f5f7fa)",
      "--dsw-static-neutral-250": "color-mix(in srgb, #eef2f7 50%, #f5f7fa)",
      "--dsw-static-neutral-bluish-300": "#f5f7fa",
      "--dsw-static-neutral-300": "#f5f7fa",
      "--dsw-static-neutral-bluish-400": "color-mix(in srgb, #f5f7fa 50%, #a8bacb)",
      "--dsw-static-neutral-400": "color-mix(in srgb, #f5f7fa 50%, #a8bacb)",
      "--dsw-static-neutral-bluish-500": "#8ca0b4",
      "--dsw-static-neutral-500": "#8ca0b4",
      "--dsw-static-neutral-bluish-550": "color-mix(in srgb, #8ca0b4 50%, #5f7188)",
      "--dsw-static-neutral-550": "color-mix(in srgb, #8ca0b4 50%, #5f7188)",
      "--dsw-static-neutral-bluish-600": "#5f7188",
      "--dsw-static-neutral-600": "#5f7188",
      "--dsw-static-neutral-bluish-700": "color-mix(in srgb, #5f7188 50%, #5a6b83)",
      "--dsw-static-neutral-700": "color-mix(in srgb, #5f7188 50%, #5a6b83)",
      "--dsw-static-neutral-bluish-750": "#5a6b83",
      "--dsw-static-neutral-750": "#5a6b83",
      "--dsw-static-neutral-bluish-800": "color-mix(in srgb, #5a6b83 50%, #44546b)",
      "--dsw-static-neutral-800": "color-mix(in srgb, #5a6b83 50%, #44546b)",
      "--dsw-static-neutral-bluish-850": "#44546b",
      "--dsw-static-neutral-850": "#44546b",
      "--dsw-static-neutral-bluish-875": "color-mix(in srgb, #44546b 50%, #0c0f3c)",
      "--dsw-static-neutral-875": "color-mix(in srgb, #44546b 50%, #0c0f3c)",
      "--dsw-static-neutral-bluish-900": "#0c0f3c",
      "--dsw-static-neutral-900": "#0c0f3c",
      "--dsw-static-neutral-bluish-950": "#0c0f3c",
      "--dsw-static-neutral-950": "#0c0f3c",
      "--dsw-static-neutral-bluish-1000": "#0c0f3c",
      "--dsw-static-neutral-1000": "#0c0f3c",
      "--dsw-static-neutral-bluish-00": "#f5f7fa",
      "--dsw-static-neutral-00": "#f5f7fa",
      "--dsw-static-deepseek-50": "color-mix(in srgb, #1b3a8c 60%, #f5f7fa)",
      "--dsw-static-deepseek-100": "color-mix(in srgb, #1b3a8c 40%, #f5f7fa)",
      "--dsw-static-deepseek-200": "#6fa8dc",
      "--dsw-static-deepseek-300": "color-mix(in srgb, #1b3a8c 75%, #f5f7fa)",
      "--dsw-static-deepseek-400": "#1b3a8c",
      "--dsw-static-deepseek-450": "#1b3a8c",
      "--dsw-static-deepseek-500": "#1b3a8c",
      "--dsw-static-deepseek-600": "color-mix(in srgb, #1b3a8c 65%, #0c0f3c)",
      "--dsw-static-deepseek-800": "color-mix(in srgb, #1b3a8c 30%, #0c0f3c)",
      "--dsw-static-deepseek-900": "color-mix(in srgb, #1b3a8c 18%, #0c0f3c)",
      "--dsw-static-deepseek-700-delete": "color-mix(in srgb, #1b3a8c 45%, #0c0f3c)",
      "--dsw-static-blue-50": "color-mix(in srgb, #0c0f3c 60%, #f5f7fa)",
      "--dsw-static-blue-75": "color-mix(in srgb, #0c0f3c 38%, #f5f7fa)",
      "--dsw-static-blue-100": "color-mix(in srgb, #0c0f3c 28%, #f5f7fa)",
      "--dsw-static-blue-300": "color-mix(in srgb, #0c0f3c 78%, #f5f7fa)",
      "--dsw-static-blue-400": "color-mix(in srgb, #0c0f3c 88%, #f5f7fa)",
      "--dsw-static-blue-450": "#1b3a8c",
      "--dsw-static-blue-500": "#1b3a8c",
      "--dsw-static-blue-600": "color-mix(in srgb, #0c0f3c 70%, #0c0f3c)",
      "--dsw-static-blue-800": "color-mix(in srgb, #0c0f3c 50%, #0c0f3c)",
      "--dsw-static-blue-900": "color-mix(in srgb, #0c0f3c 35%, #0c0f3c)",
      "--dsw-static-blue-950": "color-mix(in srgb, #0c0f3c 25%, #0c0f3c)",
      "--dsw-static-blue-50p": "color-mix(in srgb, #0c0f3c 48%, #f5f7fa)",
      "--dsw-static-green-100": "color-mix(in srgb, #2f6f4f 35%, #f5f7fa)",
      "--dsw-static-green-400": "color-mix(in srgb, #2f6f4f 80%, #f5f7fa)",
      "--dsw-static-green-500": "#2f6f4f",
      "--dsw-static-green-900": "color-mix(in srgb, #2f6f4f 35%, #0c0f3c)",
      "--dsw-static-red-50": "color-mix(in srgb, #a81624 45%, #f5f7fa)",
      "--dsw-static-red-100": "color-mix(in srgb, #a81624 28%, #f5f7fa)",
      "--dsw-static-red-400": "color-mix(in srgb, #a81624 78%, #f5f7fa)",
      "--dsw-static-red-500": "#a81624",
      "--dsw-static-red-600": "color-mix(in srgb, #a81624 68%, #0c0f3c)",
      "--dsw-static-red-900": "color-mix(in srgb, #a81624 35%, #0c0f3c)",
      "--dsw-static-amber-100": "color-mix(in srgb, #a16207 35%, #f5f7fa)",
      "--dsw-static-amber-400": "color-mix(in srgb, #a16207 88%, #f5f7fa)",
      "--dsw-static-amber-500": "#b45309",
      "--dsw-static-amber-600": "#b45309",
      "--dsw-static-amber-900": "color-mix(in srgb, #b45309 40%, #0c0f3c)",
      "--dsw-ctp-sky": "#4a80c4",
      "--dsw-ctp-peach": "#b45309",
      "--dsw-ctp-lavender": "#2b5fa8",
      "--dsw-ctp-blue": "#1b3a8c",
      "--dsw-ctp-pink": "#4a80c4",
      "--dsw-ctp-teal": "#4a80c4",
      "--dsw-ctp-sapphire": "#2b5fa8",
      "--dsw-ctp-rosewater": "#b45309",
      "--dsw-ctp-flamingo": "#a81624",
      "--dsw-ctp-maroon": "#a81624",
      "--dsw-alias-bg-base": "#f5f7fa",
      "--dsw-alias-bg-layer-1": "#f5f7fa",
      "--dsw-alias-bg-layer-2": "#ffffff",
      "--dsw-alias-bg-layer-3": "#e4eaf2",
      "--dsw-alias-bg-overlay": "#f5f7fa",
      "--dsw-alias-bg-mask-1": "rgba(255, 255, 255, 0.24)",
      "--dsw-alias-bg-mask-2": "rgba(255, 255, 255, 0.12)",
      "--dsw-alias-bg-mask-3": "rgba(255, 255, 255, 0.48)",
      "--dsw-alias-bg-module-platform": "#ffffff",
      "--dsw-alias-bg-multi-select": "#ffffff",
      "--dsw-alias-bg-skeleton": "rgba(228, 234, 242, 0.04)",
      "--dsw-alias-border-l1": "rgba(168, 186, 203, 0.3)",
      "--dsw-alias-border-l2": "rgba(140, 160, 180, 0.5)",
      "--dsw-alias-border-l3": "rgba(140, 160, 180, 0.6)",
      "--dsw-alias-border-l4": "rgba(140, 160, 180, 0.75)",
      "--dsw-alias-label-primary": "#0c0f3c",
      "--dsw-alias-label-secondary": "#5a6b83",
      "--dsw-alias-label-tertiary": "#44546b",
      "--dsw-alias-label-caption": "#44546b",
      "--dsw-alias-label-dimmed": "#44546b",
      "--dsw-alias-brand-primary": "#1b3a8c",
      "--dsw-alias-brand-text": "#f5f7fa",
      "--dsw-alias-button-primary-hover": "#12286b",
      "--dsw-alias-button-primary-dimmed": "#ffffff",
      "--dsw-alias-button-elevated-fill": "#f5f7fa",
      "--dsw-alias-button-floating-fill": "#f5f7fa",
      "--dsw-alias-button-floating-hover": "#ffffff",
      "--dsw-alias-button-ghost-active-border": "#eef2f7",
      "--dsw-alias-button-ghost-active-fill": "#ffffff",
      "--dsw-alias-button-ghost-active-hover": "#e4eaf2",
      "--dsw-alias-state-business-primary": "#1b3a8c",
      "--dsw-alias-state-business-tertiary": "#ffffff",
      "--dsw-alias-state-error-primary": "#a81624",
      "--dsw-alias-state-error-secondary": "#a81624",
      "--dsw-alias-state-success-primary": "#2f6f4f",
      "--dsw-alias-state-success-secondary": "#2f6f4f",
      "--dsw-alias-state-success-tertiary": "#ffffff",
      "--dsw-alias-state-warn-label": "#b45309",
      "--dsw-alias-state-warn-primary": "#b45309",
      "--dsw-alias-state-warn-secondary": "#b45309",
      "--dsw-alias-state-warn-tertiary": "#ffffff",
      "--dsw-alias-interactive-bg-hover": "rgba(228, 234, 242, 0.3)",
      "--dsw-alias-interactive-bg-active": "rgba(238, 242, 247, 0.4)",
      "--dsw-alias-interactive-bg-hover-accent": "rgba(27, 58, 140, 0.1)",
      "--dsw-alias-interactive-bg-hover-danger": "rgba(168, 22, 36, 0.05)",
      "--dsw-alias-interactive-bg-hover-solid": "#ffffff",
      "--dsw-alias-markdown-code-block": "#ffffff",
      "--dsw-alias-markdown-code-block-banner": "#ffffff",
      "--dsw-alias-markdown-code-segment-selected": "#f5f7fa",
      "--dsw-alias-markdown-code-segment-unselected": "#ffffff",
      "--dsw-alias-markdown-citation": "#ffffff",
      "--dsw-alias-markdown-inline-code": "#f5f7fa",
      "--dsw-alias-markdown-placeholder": "#ffffff",
      "--dsw-alias-link": "#2b5fa8",
      "--dsw-alias-markdown-tag": "rgba(43, 95, 168, 0.16)",
      "--dsw-alias-toast-bg": "#e4eaf2",
      "--dsw-alias-tooltip-bg": "#eef2f7",
      "--dsw-specific-sidebar-fill": "#ffffff",
      "--dsw-specific-sidebar-nav-item-active": "#eef2f7",
      "--dsw-specific-sidebar-nav-item-active-accent": "rgba(27, 58, 140, 0.2)",
      "--dsw-specific-sidebar-nav-item-hover": "#e4eaf2",
      "--dsw-specific-bubble": "#ffffff",
      "--dsw-specific-bubble-highlight": "#e4eaf2",
      "--dsw-specific-input-major": "#f5f7fa",
      "--dsw-specific-login-input": "#ffffff",
      "--dsw-specific-menu": "#ffffff",
      "--dsw-specific-selector": "#e4eaf2",
      "--dsw-specific-tip": "#ffffff",
      "--dsw-alias-separator-primary": "rgba(27, 58, 140, 0.7)",
      "--dsw-alias-scrollbar-bg-l1": "#e4eaf2",
      "--dsw-alias-scrollbar-bg-l2": "#eef2f7",
      "--dsw-alias-scrollbar-hover-l1": "#f5f7fa",
      "--dsw-alias-scrollbar-hover-l2": "#f5f7fa",
      "--dsw-alias-bg-mask-photo": "rgba(0, 0, 0, 0.88)",
      "--dsw-alias-bg-mask-drop": "rgba(255, 255, 255, 0.7)",
      "--dsw-alias-border-inverted": "rgba(0, 0, 0, 0)",
      "--dsw-alias-border-inverted2": "rgba(0, 0, 0, 0)",
      "--dsw-alias-border-l2-darkmode-thin": "rgba(140, 160, 180, 0.35)",
      "--dsw-alias-brand-primary-invert": "#0c0f3c",
      "--dsw-alias-brand-primary-new-colorprimary-new-color": "#1b3a8c",
      "--dsw-alias-button-contrast-fill": "#0c0f3c",
      "--dsw-alias-button-info-fill": "#1b3a8c",
      "--dsw-alias-button-info-hover": "#9eabce",
      "--dsw-alias-button-primary-fill": "#1b3a8c",
      "--dsw-alias-button-tool-bar-fill": "rgba(140, 160, 180, 0.5)",
      "--dsw-alias-button-tool-bar-fill-invisible": "rgba(140, 160, 180, 0.36)",
      "--dsw-alias-button-tool-bar-hover": "rgba(95, 113, 136, 0.6)",
      "--dsw-alias-label-primary-bluish": "#0c0f3c",
      "--dsw-alias-label-primary-dimmed": "#5a6b83",
      "--dsw-alias-label-primary-foreground": "#6fa8dc",
      "--dsw-alias-label-primary-inverted": "#f5f7fa",
      "--shiki-foreground": "#0c0f3c",
      "--shiki-background": "#ffffff",
      "--shiki-token-constant": "#b45309",
      "--shiki-token-string": "#2f6f4f",
      "--shiki-token-comment": "#8ca0b4",
      "--shiki-token-keyword": "#1b3a8c",
      "--shiki-token-parameter": "#a81624",
      "--shiki-token-function": "#0c0f3c",
      "--shiki-token-string-expression": "#2f6f4f",
      "--shiki-token-punctuation": "#44546b",
      "--shiki-token-link": "#0c0f3c",
      "--shiki-token-inserted": "#2f6f4f",
      "--shiki-token-deleted": "#a81624",
      "--shiki-token-changed": "#b45309"
    }
  }
];

		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh = {
			"skin.title": "EVA 主题",
			"skin.default": "默认",
			"skin.eva-01": "EVA 01",
			"skin.eva-00": "EVA 00",
			
			
		};

		/** English dictionary, checked complete against the zh key set. */
		const en = {
			"skin.title": "EVA theme",
			"skin.default": "Default",
			"skin.eva-01": "EVA 01",
			"skin.eva-00": "EVA 00",
			
			
		};
		//#endregion

		//#region dsh-eva: persistence
		/** Read a localStorage string value (null on absence or error). */
		function readStorage(key) {
			try {
				const value = window.localStorage.getItem(key);
				return typeof value === "string" ? value : null;
			} catch {
				return null;
			}
		}

		/** Write (or remove with null) a localStorage value. */
		function writeStorage(key, value) {
			try {
				if (value === null) window.localStorage.removeItem(key);
				else window.localStorage.setItem(key, value);
			} catch {
				// storage unavailable / quota — the preference stays process-local
			}
		}

		/** Saved skin id (may be unknown/absent). */
		function readSavedSkin() {
			return readStorage(STORAGE_KEY);
		}

		/** Persist a skin choice; DEFAULT_SKIN clears the stored value. */
		function writeSavedSkin(id) {
			writeStorage(STORAGE_KEY, id === DEFAULT_SKIN ? null : id);
		}

		/**
		 * Remember a built-in preference (system/light/dark) whenever the
		 * runtime is not on a EVA theme, so turning the skin off
		 * hands the user back exactly what they had before the plugin —
		 * instead of dropping them onto "system".
		 */
		function rememberBuiltinPreference(preference) {
			if (SKINS.some((skinDefinition) => skinDefinition.id === preference)) return;
			if (preference === "light" || preference === "dark" || preference === DEFAULT_SKIN) {
				writeStorage(RESTORE_KEY, preference);
			}
		}

		/** The preference to restore when turning the skin off (default: system). */
		function readRestoredPreference() {
			const raw = readStorage(RESTORE_KEY);
			return raw === "light" || raw === "dark" ? raw : DEFAULT_SKIN;
		}

		const STATE_ROUTE = "/eva/state";
		let stateTimer = null;
		function flushState() {
			const saved = readSavedSkin();
			fetch(STATE_ROUTE, {
				method: "PUT",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ version: 1, skin: saved })
			}).catch(() => {
				// best-effort; localStorage still holds the choice
			});
		}
		function scheduleFlush() {
			if (stateTimer !== null) clearTimeout(stateTimer);
			stateTimer = setTimeout(() => {
				stateTimer = null;
				flushState();
			}, 300);
		}
		//#endregion

		//#region dsh-eva: settings row store
		/**
		 * Skin row slot store: a mirror of the theme service snapshot. The
		 * plugin's apply-world change listener is the only writer; the row
		 * component reads via props.useStore.
		 */
		function createSkinStore() {
			return (0, _client_store.defineStore)({
				init: () => ({
					skin: DEFAULT_SKIN,
					revision: -1
				}),
				actions: {
					sync: (d, skin, revision) => {
						if (revision <= d.revision) return;
						d.skin = skin;
						d.revision = revision;
					}
				}
			});
		}
		//#endregion

		//#region dsh-eva: settings row
		/** Inline style sheet for the row (kept dependency-free). */
		const styles = {
			group: {
				borderBottom: "1px solid var(--dsw-alias-border-l2)",
				display: "flex",
				flexDirection: "column",
				gap: "10px",
				padding: "16px 0"
			},
			title: {
				color: "var(--dsw-alias-label-primary)",
				fontSize: "14px",
				fontWeight: 400,
				lineHeight: "22px"
			},
			grid: {
				display: "flex",
				flexWrap: "wrap",
				gap: "10px"
			},
			card: {
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				gap: "6px",
				width: "96px",
				padding: "3px",
				borderRadius: "10px",
				// longhand on purpose: the shorthand leaves borderColor to
				// fall back to currentColor once React clears the selected
				// override, painting stale black/white boxes on deselect
				borderWidth: "2px",
				borderStyle: "solid",
				borderColor: "transparent",
				background: "transparent",
				cursor: "pointer",
				font: "inherit",
				boxSizing: "border-box"
			},
			cardSelected: {
				borderColor: "var(--dsw-alias-brand-primary)",
				background: "var(--dsw-alias-interactive-bg-hover)"
			},
			cardLabel: {
				color: "var(--dsw-alias-label-secondary)",
				fontSize: "12px",
				lineHeight: "16px",
				whiteSpace: "nowrap"
			},
			cardLabelSelected: {
				color: "var(--dsw-alias-label-primary)"
			},
			swatch: {
				width: "100%",
				height: "52px",
				borderRadius: "8px",
				boxSizing: "border-box",
				padding: "8px",
				display: "flex",
				flexDirection: "column",
				justifyContent: "center",
				gap: "6px"
			},
			swatchLine: {
				height: "7px",
				borderRadius: "4px"
			},
			defaultSwatch: {
				width: "100%",
				height: "52px",
				borderRadius: "8px",
				boxSizing: "border-box",
				display: "flex",
				overflow: "hidden",
				border: "1px solid var(--dsw-alias-border-l2)"
			},
		};

		/** Mini palette preview driven by one skin's token table. */
		function Swatch({ tokens }) {
			return (0, react_jsx_runtime.jsxs)("div", {
				style: {
					...styles.swatch,
					background: tokens["--dsw-alias-bg-layer-1"],
					border: `1px solid ${tokens["--dsw-alias-border-l2"]}`
				},
				children: [
					(0, react_jsx_runtime.jsx)("div", {
						style: {
							...styles.swatchLine,
							width: "70%",
							background: tokens["--dsw-alias-label-primary"],
							opacity: 0.85
						}
					}),
					(0, react_jsx_runtime.jsx)("div", {
						style: {
							...styles.swatchLine,
							width: "45%",
							background: tokens["--dsw-alias-brand-primary"]
						}
					}),
					(0, react_jsx_runtime.jsx)("div", {
						style: {
							...styles.swatchLine,
							width: "55%",
							background: tokens["--dsw-alias-label-secondary"],
							opacity: 0.55
						}
					})
				]
			});
		}

		/** "Default" chip: follow the built-in appearance (light + dark halves). */
		function DefaultSwatch() {
			return (0, react_jsx_runtime.jsxs)("div", {
				style: styles.defaultSwatch,
				children: [
					(0, react_jsx_runtime.jsx)("div", { style: { flex: 1, background: "#f4f4f5" } }),
					(0, react_jsx_runtime.jsx)("div", { style: { flex: 1, background: "#1c1c20" } })
				]
			});
		}

		/** One selectable skin card. */
		function SkinCard({ skin, selected, onSelect, t }) {
			return (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: (event) => {
					onSelect();
					// drop focus so a stale focus ring never outlives the selection
					event.currentTarget.blur();
				},
				"aria-pressed": selected,
				style: {
					...styles.card,
					...(selected ? styles.cardSelected : {})
				},
				children: [
					(0, react_jsx_runtime.jsx)(Swatch, { tokens: skin.tokens }),
					(0, react_jsx_runtime.jsx)("span", {
						style: {
							...styles.cardLabel,
							...(selected ? styles.cardLabelSelected : {})
						},
						children: t(`skin.${skin.id}`)
					})
				]
			});
		}

		function SkinRow({ t, setSkin, useStore }) {
			const skin = useStore((s) => s.skin);
			const selected = SKINS.some((candidate) => candidate.id === skin) ? skin : null;
			return (0, react_jsx_runtime.jsxs)("div", {
				style: styles.group,
				children: [
					(0, react_jsx_runtime.jsx)("div", {
						style: styles.title,
						children: t("skin.title")
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						style: styles.grid,
						children: [
							(0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: (event) => {
									setSkin(DEFAULT_SKIN);
									// drop focus so a stale focus ring never outlives the selection
									event.currentTarget.blur();
								},
								"aria-pressed": selected === null,
								style: {
									...styles.card,
									...(selected === null ? styles.cardSelected : {})
								},
								children: [
									(0, react_jsx_runtime.jsx)(DefaultSwatch, {}),
									(0, react_jsx_runtime.jsx)("span", {
										style: {
											...styles.cardLabel,
											...(selected === null ? styles.cardLabelSelected : {})
										},
										children: t("skin.default")
									})
								]
							}),
							SKINS.map((skinDefinition) => (0, react_jsx_runtime.jsx)(SkinCard, {
								skin: skinDefinition,
								selected: selected === skinDefinition.id,
								onSelect: () => setSkin(skinDefinition.id),
								t
							}, skinDefinition.id))
						]
					}),
				]
			});
		}
		//#endregion

		//#region dsh-eva: client plugin body
		/**
		 * Required services: theme runtime (skins, switching), slots/locale
		 * (the settings row). Persistence is localStorage, so no settings
		 * transport is needed.
		 */
		const inject = [
			"slots",
			"locale",
			"theme"
		];

		/**
		 * Client plugin body: register the EVA themes into the theme
		 * runtime, restore the saved choice, keep the row's store in sync with
		 * theme/change, and register the picker into Settings → General.
		 * @param ctx - client cordis context.
		 */
		function apply(ctx) {
			const disposers = SKINS.map((skinDefinition) => ctx.theme.register(skinDefinition));
			ctx.effect(() => () => {
				for (const dispose of disposers) dispose();
			}, "dsh-eva: theme registration");

			// User-message bubbles carry a brand tint so the two roles read
			// apart; assistant replies intentionally stay on the bare canvas.
			// Keyed on the stable CSS-module suffixes, colored from our own
			// injected theme variables so it adapts per flavor automatically.
			//
			// Every selector is boosted with :not(#dsh-eva): the
			// shipped ui-* stylesheets are injected by React after ours, so a
			// plain attribute selector loses to the equally specific module
			// class and the tint silently dies. The :not(id) pseudo is a
			// no-op predicate that only raises specificity (1,1,0).
			//
			// The sheet is mounted only while one of our skins is active and
			// removed on the "Default" preference, so the built-in appearance
			// stays pixel-identical unless the user picked a EVA skin.
			const boost = (selector) =>
				selector.split(",").map((part) => `${part.trim()}:not(#dsh-eva)`).join(",");
			const SURFACE_RULES = [
				// Inline code in prose (`/Volumes/...`, `project/README.md`).
				//
				// The app's own rule is
				//   :not(pre) > code { ...; background-color: markdown-inline-code; ... }
				// — a background and NO colour, so inline code inherited plain body
				// text and read as ordinary prose in a box.
				//
				// Our theme cannot fix this with a token: there is no
				// "--dsw-alias-markdown-inline-code-foreground" in the vocabulary,
				// and the colour is simply absent from the app's rule. So it is set
				// here, in the overlay that only mounts while an EVA skin is active
				// (leaving the built-in appearance pixel-identical).
				//
				// Mint in dark, matching the links. In light it is the dark blue,
				// because the mint does not carry on the near-white surface.
				[
					"[class*=\"_markdown\"] :not(pre) > code",
					"  color: var(--dsw-alias-link);"
				],
				// The active tab: the app paints it `color: label-primary` over
				// `background: markdown-tag` (_tabActive in its stylesheet).
				// The fill alone is not enough to read as a theme colour, and
				// label-primary is plain text colour by design — so the tab's
				// TEXT is set to the secondary accent here, the same token the
				// links use, which keeps "green means navigational" consistent.
				//
				// Matched on a class substring rather than a suffix: the real
				// class is `_tabActive_17p4l_243` — a CSS-module hash — so a
				// [class$=...] selector would never match it.
				[
					"[class*=\"_tabActive\"]",
					"  color: var(--dsw-alias-link);"
				],
				[
					"[class$=\"_userStack\"] [class$=\"_bubble\"]",
					"  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 40%, var(--dsw-alias-bg-layer-2));"
				],
				// EVA 00 (the light theme) tints at 30%: the pale
				// surface makes 40% look stronger than on dark flavors.
				// body[data-ds-dark-theme] is present on dark schemes only.
				[
					"body:not([data-ds-dark-theme]) [class$=\"_userStack\"] [class$=\"_bubble\"]",
					"  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 30%, var(--dsw-alias-bg-layer-2));"
				],
				// composer command (plus) button: the InputBar add button, in
				// sky. Keyed on class suffix + aria-haspopup so model
				// selectors (which share the _trigger suffix) stay neutral.
				[
					"button[class$=\"_add\"][aria-haspopup=\"listbox\"]",
					"  color: var(--dsw-ctp-sky);"
				],
				// message reference chips: the shipped background is a
				// hardcoded deepseek blue; recolor from the brand
				[
					"[class$=\"_refChip\"]",
					"  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 22%, transparent);"
				],
				// reasoning body: warm peach tint to read apart from the
				// neutral answer text
				[
					"[class$=\"_thinkBody\"]",
					"  color: var(--dsw-ctp-sapphire);"
				],
				// tool call rows: the Think label in sapphire, executor
				// labels in peach
				[
					"[class$=\"_QWLzlG_title\"]",
					"  color: var(--dsw-ctp-sapphire);"
				],
				[
					"[class$=\"_o3BgMG_title\"]",
					"  color: var(--dsw-ctp-peach);"
				],
				// code block language tag (python/json/...): pink chip
				[
					"[class$=\"_infostring\"]",
					"  color: var(--dsw-ctp-pink);"
				],
				// message timestamp separators: soft lavender; the trailing
				// time+duration hint (hover-revealed at the end of an
				// assistant message) matches
				[
					"[class$=\"_timeStart\"], [class$=\"p-xYUq_timeEnd\"]",
					"  color: var(--dsw-ctp-lavender);"
				],
				// tool call summaries follow their label accent
				[
					"[class$=\"o3BgMG_summary\"]",
					"  color: var(--dsw-ctp-peach);"
				],
				[
					"[class$=\"QWLzlG_summary\"]",
					"  color: var(--dsw-ctp-sapphire);"
				],
				// context injection rows (shared _title class minus the tool
				// call labels) read as blue system notes
				[
					"[class$=\"_title_9cl6j_64\"]:not([class$=\"QWLzlG_title\"]):not([class$=\"o3BgMG_title\"])",
					"  color: var(--dsw-ctp-blue);"
				],
				// code block copy button warms to mauve on hover
				[
					"[class*=\"_copyButton\"]:hover",
					"  color: var(--dsw-alias-brand-primary);"
				],
				// message action rows (copy / feedback / branch / regenerate
				// icons next to timestamps and under messages): every button
				// warms to mauve on hover
				[
					"[class$=\"p-xYUq_actions\"] button:hover, [class$=\"Sxvs8a_actions\"] button:hover, [class$=\"_7yHdaG_actions\"] button:hover, [class$=\"osXY9a_actions\"] button:hover",
					"  color: var(--dsw-alias-brand-primary);"
				],
				// sidebar: mauve carries the selected-state meaning — the
				// active session's title stays mauve, others only warm on
				// hover (the row's own gray hover background stays)
				[
					"[class$=\"YDXeBa_selected\"] [class$=\"YDXeBa_title\"]",
					"  color: var(--dsw-alias-brand-primary);"
				],
				// hover follows the row, not the label: the shipped gray
				// background triggers on the row's :hover, so the mauve
				// text must trigger on the same ancestor to stay in sync
				[
					"[class$=\"YDXeBa_sessionRow\"]:hover [class$=\"YDXeBa_title\"], [class$=\"YDXeBa_projectRow\"]:hover [class$=\"YDXeBa_title\"]",
					"  color: var(--dsw-alias-brand-primary);"
				],
				[
					"[class$=\"YDXeBa_time\"]",
					"  color: var(--dsw-ctp-lavender);"
				],
				// whole new-session button warms on hover so label and the
				// leading plus icon follow together, scoped to the button
				// (matching the shipped gray hover's trigger area)
				[
					"[class~=\"hHd-Xa_newSession\"]:hover",
					"  color: var(--dsw-alias-brand-primary);"
				],
				// top-right session-log panel: header, title and close
				// button all warm to mauve on hover
				[
					"[class$=\"ydkMvW_header\"]:hover, [class$=\"ydkMvW_header\"]:hover [class$=\"ydkMvW_title\"], [class$=\"ydkMvW_close\"]:hover",
					"  color: var(--dsw-alias-brand-primary);"
				],
				// sidebar icon buttons (collapse, search, row actions): icons
				// warm to mauve on hover, echoing the text hovers above.
				// Word-matched because these carry modifier classes
				// (…_toggle / …_wide); the settings trigger hovers too.
				[
					"[class~=\"hHd-Xa_iconButton\"]:hover, [class~=\"qDHVXG_iconButton\"]:hover, [class~=\"qDHVXG_searchButton\"]:hover, [class~=\"YDXeBa_iconButton\"]:hover",
					"  color: var(--dsw-alias-brand-primary);"
				],
				[
					"[class~=\"VOzbGW_trigger\"]:hover",
					"  color: var(--dsw-alias-brand-primary);"
				],
				// top bar: current breadcrumb reads in brand mauve
				[
					"[class$=\"wSkVaW_crumbCurrent\"]",
					"  color: var(--dsw-alias-brand-primary);"
				],
				// homepage: headline in a single brand mauve (the gradient
				// was too loud), workspace label in mauve, the preview
				// badge in pink — lavender is reserved for time accents
				[
					"[class$=\"pXSMma_headlineText\"]",
					"  color: var(--dsw-alias-brand-primary);"
				],
				[
					"[class$=\"pXSMma_workspaceLabel\"]",
					"  color: var(--dsw-alias-brand-primary);"
				],
				[
					"[class$=\"pXSMma_previewBadge\"]",
					"  color: var(--dsw-ctp-pink);"
				],
				// hero workspace row mode seat ("标准模式") in blue, the
				// cool neighbor of lavender
				[
					"[class$=\"cubgiG_seat\"]",
					"  color: var(--dsw-ctp-blue);"
				],
				// the rest of the palette gets one seat each: breadcrumb
				// trail in teal, new-session label in sapphire, details
				// empty-state hint in rosewater, settings label in flamingo,
				// sidebar row action icons in maroon
				[
					"[class$=\"wSkVaW_crumb\"]",
					"  color: var(--dsw-ctp-teal);"
				],
				// new-session label keeps the default font color; only the
				// hover warms to mauve (see the button-scoped rule above)
				[
					"[class$=\"ydkMvW_empty\"]",
					"  color: var(--dsw-ctp-rosewater);"
				],
				// sidebar row action icons (hover-revealed …/＋ buttons) keep
				// the default color; only the hover warms to mauve (see the
				// icon-button hover rule above)
				// composer selectors: model effort in sky (echoing the
				// command accents; lavender was overused), workspace and
				// model labels warm to mauve on hover (constant color stays
				// neutral — earlier "cyan" complaints were about the
				// trigger itself, not hover)
				[
					"[class$=\"_7KE1Ra_triggerEffort\"]",
					"  color: var(--dsw-ctp-sky);"
				],
				// same ancestor-scoped hover: the shipped trigger's gray
				// background is on the trigger container
				[
					"[class$=\"Sh0Q9G_trigger\"]:hover [class$=\"Sh0Q9G_triggerLabel\"], [class$=\"_7KE1Ra_trigger\"]:hover [class$=\"_7KE1Ra_triggerLabel\"]",
					"  color: var(--dsw-alias-brand-primary);"
				],
				// diff blocks: the shipped DiffBlock rows carry no classes,
				// so added/removed lines get no colors at all. Tag each row
				// by its leading +/- and tint green/red from the state
				// tokens. :where() keeps the tag rules out of the boost.
				[
					"[data-diff] > div[data-diff-kind=\"add\"]",
					[
						"  background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 14%, transparent);",
						"  color: color-mix(in srgb, var(--dsw-alias-state-success-primary) 72%, var(--dsw-alias-label-primary));"
					].join("\n")
				],
				[
					"[data-diff] > div[data-diff-kind=\"del\"]",
					[
						"  background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 14%, transparent);",
						"  color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 72%, var(--dsw-alias-label-primary));"
					].join("\n")
				],
				// dropdown menus under the composer (model picker options,
				// command list rows): shipped hovers only gray the row
				// background — warm the text to mauve as well
				[
					"[class$=\"_7KE1Ra_option\"]:hover:not(:disabled), [class$=\"mufS8W_row\"]:hover",
					"  color: var(--dsw-alias-brand-primary);"
				],
				// workspace/model cards: border warms on hover, primary
				// button brightens
				[
					"[class$=\"uV2eYG_card\"]:hover",
					"  border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 55%, transparent);"
				],
				[
					"[class$=\"uV2eYG_primary\"]:hover",
					"  filter: brightness(1.08);"
				],
				// the primary button doubles as the stop button while a run is
				// in flight (same element, aria-label flips to "停止"/"Stop"):
				// recolor to error red so stop reads at a glance
				[
					"[class$=\"uV2eYG_primary\"]:is([aria-label=\"停止\"],[aria-label=\"Stop\"])",
					[
						"  background: var(--dsw-alias-state-error-primary);",
						"  filter: none;"
					].join("\n")
				]
			].map(([selector, body]) => `${boost(selector)} {\n${body}\n}`).join("\n");
			const style = document.createElement("style");
			style.textContent = SURFACE_RULES;
			const syncSurfaceTint = () => {
				const active = SKINS.some((skinDefinition) => skinDefinition.id === ctx.theme.getTheme().preference);
				if (active && !style.isConnected) document.head.appendChild(style);
				if (!active && style.isConnected) style.remove();
			};
			syncSurfaceTint();
			ctx.on("theme/change", syncSurfaceTint);
			ctx.effect(() => () => {
				style.remove();
			}, "dsh-eva: surface tint lifecycle");

			// Tag DiffBlock rows (data-diff container) by leading +/- so the
			// tint rules above can color added vs removed lines.
			const diffObserver = new MutationObserver(() => {
				for (const row of document.querySelectorAll("[data-diff] > div")) {
					if (row.hasAttribute("data-diff-kind")) continue;
					const text = row.textContent ?? "";
					row.setAttribute("data-diff-kind", text.startsWith("+") ? "add" : text.startsWith("-") ? "del" : "none");
				}
			});
			diffObserver.observe(document.body, { childList: true, subtree: true });
			ctx.effect(() => () => {
				diffObserver.disconnect();
			}, "dsh-eva: diff row tagging");

			// Restore the saved skin. The ThemeService adopts its durable
			// built-in preference from the Host settings scope asynchronously
			// after boot, and re-adopts it on every settings-document reload
			// — switching a model rewrites the settings doc and clobbers our
			// third-party preference back to the document's value ("system"
			// when never written, or a persisted light/dark). So instead of
			// a one-shot boot window, defend on every theme/change.
			//
			// The one seam that tells "the user clicked light/dark in the
			// Appearance row THIS session" apart from "adopt() copied the
			// settings document at boot/reload" is the setTheme wrapper:
			// adopt() writes the runtime preference directly and never goes
			// through setTheme. A built-in preference only wins while it
			// matches a live explicit pick; values adopted from the document
			// (livePick null) are stale for us — the EVA row choice is
			// newer than the document's light/dark — so the flavor is
			// re-applied then. Picking a flavor clears the record.
			let liveBuiltinPick = null;
			const originalSetTheme = ctx.theme.setTheme;
			ctx.theme.setTheme = (id) => {
				liveBuiltinPick = id === "light" || id === "dark" || id === DEFAULT_SKIN ? id : null;
				originalSetTheme.call(ctx.theme, id);
			};
			const reassertSaved = () => {
				const current = ctx.theme.getTheme().preference;
				if ((current === "light" || current === "dark") && current === liveBuiltinPick) return;
				const latest = readSavedSkin();
				if (typeof latest === "string" && latest !== DEFAULT_SKIN && SKINS.some((skinDefinition) => skinDefinition.id === latest)) {
					ctx.theme.setTheme(latest);
				}
			};
			reassertSaved();

			// Durable two-layer persistence: localStorage is the instant
			// layer, the module-level flushState/scheduleFlush push changes
			// to the host's state file (under $DSH_HOME), which survives
			// Desktop's per-launch port churn where localStorage always
			// starts empty. Hydrate once at boot per empty layer.
			const hydrateFromFile = async () => {
				try {
					const response = await fetch(STATE_ROUTE);
					if (!response.ok) return;
					const state = await response.json();
					const skin = state && typeof state.skin === "string" && SKINS.some((skinDefinition) => skinDefinition.id === state.skin) ? state.skin : null;
					if (readSavedSkin() === null && skin !== null) {
						writeSavedSkin(skin);
						if (ctx.theme.getTheme().preference === DEFAULT_SKIN) ctx.theme.setTheme(skin);
					}
				} catch {
					// route absent (older host) — localStorage-only mode
				}
			};
			hydrateFromFile();

			const skinStore = createSkinStore();
			let skinBound;
			const syncSkin = (snapshot) => {
				skinBound?.sync(snapshot.preference, snapshot.revision);
			};
			ctx.on("theme/change", (snapshot) => {
				syncSkin(snapshot);
				const pref = snapshot.preference;
				// Record the built-in preference on every non-flavor
				// observation (boot, adopt() reloads, explicit Appearance
				// changes) BEFORE any re-assert, so turning the skin off
				// can hand the user back exactly what they had.
				rememberBuiltinPreference(pref);
				// If the preference moved to another plugin's third-party theme,
				// drop our stored choice so only the last-picked plugin restores
				// at boot (both plugins must implement this convention).
				if (pref !== DEFAULT_SKIN && pref !== "light" && pref !== "dark" && !SKINS.some((skinDefinition) => skinDefinition.id === pref)) {
					writeSavedSkin(DEFAULT_SKIN);
				}
				// Re-assert from a fresh task: a re-entrant setTheme inside the
				// dispatch is missed by other subscribers (ui-layout's
				// ThemePresenter), so the restored skin would never reach the DOM.
				scheduleFlush();
				setTimeout(() => {
					reassertSaved();
				}, 0);
			});

			ctx.effect(() => ctx.locale.register(SETTINGS_NS, {
				zh,
				en
			}), "dsh-eva: settings row dictionaries");

			const skinInjected = (actions) => {
				skinBound = actions;
				syncSkin(ctx.theme.getTheme());
				return {
					setSkin: (id) => {
						// persist first: setTheme publishes a synchronous
						// theme/change, so the re-assert handler must
						// already see the new saved value (otherwise
						// toggling back to the default re-applies the old
						// flavor)
						writeSavedSkin(id);
						// turning the skin off restores the user's last
						// built-in preference instead of forcing "system"
						ctx.theme.setTheme(id === DEFAULT_SKIN ? readRestoredPreference() : id);
						scheduleFlush();
					}
				};
			};
			ctx.slots.inject("settings.general.item", () => ctx.slots.register({
				name: "settings.general.item",
				id: "eva",
				order: 19,
				store: skinStore,
				locale: SETTINGS_NS,
				inject: skinInjected
			}, SkinRow));

			ctx.effect(() => () => {
				if (stateTimer !== null) clearTimeout(stateTimer);
				// undo the setTheme wrapper so a stopped plugin leaves the
				// runtime as it found it
				ctx.theme.setTheme = originalSetTheme;
			}, "dsh-eva: state flush timer");
		}
		//#endregion

		exports.SKINS = SKINS;
		exports.DEFAULT_SKIN = DEFAULT_SKIN;
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
