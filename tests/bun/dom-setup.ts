import { JSDOM } from "jsdom";

// Bun ships no DOM implementation, so we bootstrap one from jsdom and copy its
// globals onto globalThis by hand. This file must run (and finish) before any
// module that touches `document` is imported — including transitively, e.g.
// @testing-library/dom's `screen` singleton reads `document` once at import
// time and silently locks in a broken state if it loads first. That's why
// this is its own --preload entry, ordered before tests/bun/test-globals.ts.
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
  pretendToBeVisual: true,
});

const skip = new Set([
  "undefined",
  "window",
  "globalThis",
  "self",
  "top",
  "parent",
  // Bun's own implementations are more spec-complete than jsdom's; copying
  // jsdom's over the top breaks things (e.g. jsdom's Intl wrapper makes
  // `new Intl.Segmenter()` throw).
  "queueMicrotask",
  "setTimeout",
  "clearTimeout",
  "setInterval",
  "clearInterval",
  "fetch",
  "performance",
  "crypto",
  "Buffer",
  "process",
  "Intl",
]);
for (const key of Object.getOwnPropertyNames(dom.window)) {
  if (skip.has(key)) continue;
  if (key.startsWith("webkit") || key.startsWith("on")) continue;
  try {
    // @ts-expect-error
    globalThis[key] = dom.window[key];
  } catch {}
}
// @ts-expect-error
globalThis.window = dom.window;
// @ts-expect-error
globalThis.document = dom.window.document;
// @ts-expect-error
globalThis.navigator = dom.window.navigator;
