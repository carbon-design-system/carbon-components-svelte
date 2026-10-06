// Entry point. The bundle of this file is evaluated inside the target
// global context and exposes `__domEnv.install(options)`.

import * as collections from "./collections.js";
import * as css from "./css.js";
import * as document from "./document.js";
import * as element from "./element.js";
import * as events from "./events.js";
import * as forms from "./forms.js";
import * as geometry from "./geometry.js";
import * as html from "./html.js";
import * as mutation from "./mutation.js";
import * as node from "./node.js";
import * as range from "./range.js";
import * as win from "./window.js";

const EXCLUDE = new Set([
  "Window",
  "CSSNamespace",
  "ParentNode",
  "ChildNode",
  "NonDocumentTypeChildNode",
  "HTMLOrSVGElement",
]);

function collectClasses() {
  const out = {};
  for (const mod of [
    events,
    node,
    collections,
    mutation,
    geometry,
    css,
    element,
    forms,
    html,
    range,
    document,
    win,
  ]) {
    for (const [name, value] of Object.entries(mod)) {
      if (EXCLUDE.has(name) || !/^[A-Z][A-Za-z]+$/.test(name)) continue;
      if (typeof value === "function" && value.prototype) out[name] = value;
    }
  }
  out.NodeFilter = range.NodeFilter;
  out.Window = win.Window;
  return out;
}

function install(options = {}) {
  const global = globalThis;
  const classes = collectClasses();
  const doc = win.installWindow(global, classes, options);
  win.defineEventHandlers(element.HTMLElement.prototype, win.HANDLER_EVENTS);
  win.defineEventHandlers(element.SVGElement.prototype, win.HANDLER_EVENTS);
  win.defineEventHandlers(document.Document.prototype, [
    ...win.HANDLER_EVENTS,
    "readystatechange",
    "visibilitychange",
  ]);
  return doc;
}

globalThis.__domEnv = { install };
