"use strict";
(() => {
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });

  // ../../node_modules/.pnpm/lucide-react@0.468.0_react@18.3.1/node_modules/lucide-react/dist/esm/createLucideIcon.js
  var import_react2 = __require("react");

  // ../../node_modules/.pnpm/lucide-react@0.468.0_react@18.3.1/node_modules/lucide-react/dist/esm/shared/src/utils.js
  var toKebabCase = (string) => string.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
  var mergeClasses = (...classes) => classes.filter((className, index, array) => {
    return Boolean(className) && className.trim() !== "" && array.indexOf(className) === index;
  }).join(" ").trim();

  // ../../node_modules/.pnpm/lucide-react@0.468.0_react@18.3.1/node_modules/lucide-react/dist/esm/Icon.js
  var import_react = __require("react");

  // ../../node_modules/.pnpm/lucide-react@0.468.0_react@18.3.1/node_modules/lucide-react/dist/esm/defaultAttributes.js
  var defaultAttributes = {
    xmlns: "http://www.w3.org/2000/svg",
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round"
  };

  // ../../node_modules/.pnpm/lucide-react@0.468.0_react@18.3.1/node_modules/lucide-react/dist/esm/Icon.js
  var Icon = (0, import_react.forwardRef)(
    ({
      color = "currentColor",
      size = 24,
      strokeWidth = 2,
      absoluteStrokeWidth,
      className = "",
      children,
      iconNode,
      ...rest
    }, ref) => {
      return (0, import_react.createElement)(
        "svg",
        {
          ref,
          ...defaultAttributes,
          width: size,
          height: size,
          stroke: color,
          strokeWidth: absoluteStrokeWidth ? Number(strokeWidth) * 24 / Number(size) : strokeWidth,
          className: mergeClasses("lucide", className),
          ...rest
        },
        [
          ...iconNode.map(([tag, attrs]) => (0, import_react.createElement)(tag, attrs)),
          ...Array.isArray(children) ? children : [children]
        ]
      );
    }
  );

  // ../../node_modules/.pnpm/lucide-react@0.468.0_react@18.3.1/node_modules/lucide-react/dist/esm/createLucideIcon.js
  var createLucideIcon = (iconName, iconNode) => {
    const Component = (0, import_react2.forwardRef)(
      ({ className, ...props }, ref) => (0, import_react2.createElement)(Icon, {
        ref,
        iconNode,
        className: mergeClasses(`lucide-${toKebabCase(iconName)}`, className),
        ...props
      })
    );
    Component.displayName = `${iconName}`;
    return Component;
  };

  // ../../node_modules/.pnpm/lucide-react@0.468.0_react@18.3.1/node_modules/lucide-react/dist/esm/icons/file-text.js
  var FileText = createLucideIcon("FileText", [
    ["path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z", key: "1rqfz7" }],
    ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4", key: "tnqrlb" }],
    ["path", { d: "M10 9H8", key: "b1mrlr" }],
    ["path", { d: "M16 13H8", key: "t4e002" }],
    ["path", { d: "M16 17H8", key: "z1uh3a" }]
  ]);

  // ../../node_modules/.pnpm/lucide-react@0.468.0_react@18.3.1/node_modules/lucide-react/dist/esm/icons/globe.js
  var Globe = createLucideIcon("Globe", [
    ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
    ["path", { d: "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20", key: "13o1zl" }],
    ["path", { d: "M2 12h20", key: "9i4pu4" }]
  ]);

  // ../../node_modules/.pnpm/lucide-react@0.468.0_react@18.3.1/node_modules/lucide-react/dist/esm/icons/image.js
  var Image = createLucideIcon("Image", [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", ry: "2", key: "1m3agn" }],
    ["circle", { cx: "9", cy: "9", r: "2", key: "af1f0g" }],
    ["path", { d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21", key: "1xmnt7" }]
  ]);

  // ../../node_modules/.pnpm/lucide-react@0.468.0_react@18.3.1/node_modules/lucide-react/dist/esm/icons/panel-left.js
  var PanelLeft = createLucideIcon("PanelLeft", [
    ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", key: "afitv7" }],
    ["path", { d: "M9 3v18", key: "fh3hqa" }]
  ]);

  // src/client.jsx
  var import_jsx_runtime = __require("react/jsx-runtime");
  window.__ModuleLoader__.load({
    id: "@muen/mitsu-rail",
    factory: (require2) => {
      const React = require2("react");
      const h = React.createElement;
      const { useState } = React;
      const STYLE = `
      .mitsu-rail-nav { position: fixed; top: 0; right: 0; bottom: 0; width: 52px; z-index: 950; display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 12px 0; background: var(--dsw-alias-bg-layer-1); border-left: 1px solid var(--dsw-alias-border-l2); }
      .mitsu-rail-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 10px; border: 1px solid transparent; background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; }
      .mitsu-rail-btn:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }
      .mitsu-rail-btn.active { border-color: var(--mitsu-primary, #765898); color: var(--mitsu-primary, #765898); background: color-mix(in srgb, var(--mitsu-primary, #765898) 8%, transparent); }
      .mitsu-rail-avatar { margin-top: auto; width: 30px; height: 30px; border-radius: 999px; background: color-mix(in srgb, var(--mitsu-primary, #765898) 25%, transparent); color: var(--dsw-alias-label-primary); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; cursor: pointer; }
      .mitsu-rail-panel { position: fixed; top: 0; right: 52px; bottom: 0; width: 300px; z-index: 945; background: var(--dsw-alias-bg-layer-2); border-left: 1px solid var(--dsw-alias-border-l2); color: var(--dsw-alias-label-primary); font-family: var(--dsw-font-family); padding: 20px; overflow-y: auto; }
      .mitsu-rail-panel-title { font-size: 14px; font-weight: 700; margin-bottom: 12px; }
      .mitsu-rail-panel-note { font-size: 12px; color: var(--dsw-alias-label-secondary); }
    `;
      let styleInjected = false;
      const ensureStyle = () => {
        if (styleInjected) return;
        styleInjected = true;
        const style = document.createElement("style");
        style.textContent = STYLE;
        document.head.appendChild(style);
      };
      const ITEMS = [
        { id: "tree", icon: PanelLeft, label: "Tree" },
        { id: "assets", icon: Image, label: "Assets" },
        { id: "docs", icon: FileText, label: "Docs" },
        { id: "browser", icon: Globe, label: "Browser" }
      ];
      const RIGHT_RAIL = () => {
        const [open, setOpen] = useState(null);
        ensureStyle();
        const toggle = (id) => setOpen((prev) => prev === id ? null : id);
        const activePanel = ITEMS.find((i) => i.id === open);
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "mitsu-rail-nav", children: [
          ITEMS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              className: "mitsu-rail-btn" + (open === item.id ? " active" : ""),
              title: item.label,
              "aria-label": item.label,
              onClick: () => toggle(item.id),
              children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(item.icon, { size: 18 })
            },
            item.id
          )),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mitsu-rail-avatar", title: "Account", children: "TP" }),
          activePanel && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "mitsu-rail-panel", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mitsu-rail-panel-title", children: activePanel.label }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "mitsu-rail-panel-note", children: [
              "Mitsu ",
              activePanel.label,
              " surface placeholder."
            ] })
          ] })
        ] });
      };
      return {
        inject: ["slots"],
        apply(ctx) {
          ctx.slots.inject("shell.overlay", () => ctx.slots.register({
            name: "shell.overlay",
            id: "mitsu-rail",
            order: 120,
            label: "Mitsu right rail"
          }, RIGHT_RAIL));
        }
      };
    }
  });
})();
/*! Bundled license information:

lucide-react/dist/esm/shared/src/utils.js:
  (**
   * @license lucide-react v0.468.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/defaultAttributes.js:
  (**
   * @license lucide-react v0.468.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/Icon.js:
  (**
   * @license lucide-react v0.468.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/createLucideIcon.js:
  (**
   * @license lucide-react v0.468.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/file-text.js:
  (**
   * @license lucide-react v0.468.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/globe.js:
  (**
   * @license lucide-react v0.468.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/image.js:
  (**
   * @license lucide-react v0.468.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/panel-left.js:
  (**
   * @license lucide-react v0.468.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/lucide-react.js:
  (**
   * @license lucide-react v0.468.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)
*/
