// DOM checks: structural accessibility rules that need no layout, run on
// the live document, so a component's markup is checked in every state its
// tests put it in rather than the few an axe run in a browser sees.
//
// - `idref`: an `aria-*` id reference, `for`, `list`, `form` or `headers`
//   naming an id that isn't in the document. Like axe, `aria-controls` and
//   `aria-owns` may name a missing id while `aria-expanded="false"`: a
//   closed popup needn't be rendered.
// - `duplicate-id`: two elements in the document with the same id.
// - `aria-hidden-focus`: an element in the tab order inside
//   `aria-hidden="true"`.
// - `nested-interactive`: an element in the tab order inside one whose role
//   makes its content presentational (a button, a checkbox, an option...).
//
// With checks on, they run when a dispatched event's effects have settled
// (the next macrotask), and on demand.

import { check as checkCoverage, isEnabled as coverageOn } from "./coverage.js";

let enabled = false;
let realSetTimeout = null;
let pending = null;
/** Findings since the last `take()`, keyed by rule and element. */
let found = new Map();

const IDREFS = [
  "aria-labelledby",
  "aria-describedby",
  "aria-controls",
  "aria-owns",
  "aria-activedescendant",
  "aria-errormessage",
  "aria-details",
  "aria-flowto",
];
const IDREF_SELECTOR = [
  ...IDREFS.map((name) => `[${name}]`),
  "label[for]",
  "input[list]",
  "[form]",
  "td[headers]",
  "th[headers]",
].join(",");
/** References a closed popup may leave dangling. */
const POPUP_REFS = new Set(["aria-controls", "aria-owns"]);

/** Roles whose content is presentational (WAI-ARIA "children presentational"). */
const ATOMIC_ROLES = new Set([
  "button",
  "checkbox",
  "img",
  "meter",
  "menuitemcheckbox",
  "menuitemradio",
  "option",
  "progressbar",
  "radio",
  "scrollbar",
  "separator",
  "slider",
  "switch",
  "tab",
]);

const NATIVELY_FOCUSABLE =
  "a[href],area[href],button,input,select,textarea,iframe,summary,[contenteditable],audio[controls],video[controls]";

/**
 * The DOM methods the checks use, taken when checks are enabled: tests spy
 * on `querySelectorAll` and the like, and a check must not show up in what
 * a test counts.
 */
let dom = null;

function method(proto, name) {
  const fn = proto[name];
  return (self, ...args) => fn.apply(self, args);
}

export function enable(global) {
  const E = global.Element.prototype;
  const D = global.Document.prototype;
  const elementAll = method(E, "querySelectorAll");
  const documentAll = method(D, "querySelectorAll");
  const attributes = Object.getOwnPropertyDescriptor(E, "attributes").get;
  dom = {
    all: (node, selector) =>
      node.nodeType === 9
        ? documentAll(node, selector)
        : elementAll(node, selector),
    attr: method(E, "getAttribute"),
    has: method(E, "hasAttribute"),
    matches: method(E, "matches"),
    closest: method(E, "closest"),
    visible: method(E, "checkVisibility"),
    attributes: (el) => attributes.call(el),
  };
  enabled = true;
  watchSettle(global);
}

/**
 * Turns on the check after each dispatch settles, for the DOM checks or
 * CSS coverage (coverage.js), whichever is on.
 */
export function watchSettle(global) {
  realSetTimeout ??= global.__realTimers?.setTimeout ?? global.setTimeout;
}

export function isEnabled() {
  return enabled;
}

/** Called after a top-level dispatch: check once its effects settle. */
export function afterDispatch(doc) {
  if (!realSetTimeout || pending) return;
  pending = realSetTimeout(() => {
    pending = null;
    if (enabled) run(doc);
    if (coverageOn()) checkCoverage(doc);
  }, 0);
}

function tag(el) {
  let out = `<${el.localName}`;
  for (const attr of dom.attributes(el)) {
    const value =
      attr.value.length > 40 ? `${attr.value.slice(0, 40)}…` : attr.value;
    out += ` ${attr.name}="${value}"`;
    if (out.length > 160) return `${out.slice(0, 160)}…>`;
  }
  return `${out}>`;
}

/** Records a finding; `id` is the id it's about, for `idref` and `duplicate-id`. */
function add(rule, el, detail, id = null) {
  const key = `${rule} ${tag(el)} ${detail}`;
  if (!found.has(key)) found.set(key, { rule, element: tag(el), detail, id });
}

/**
 * In the tab order: focusable, without a negative `tabindex`, and rendered
 * (`checkVisibility` reads `display` and `visibility` from the styles
 * dom-env knows: inline ones and `<style>` sheets).
 */
function tabbable(el) {
  const tabindex = dom.attr(el, "tabindex");
  if (tabindex !== null) {
    const n = Number.parseInt(tabindex, 10);
    if (Number.isNaN(n)) {
      if (!dom.matches(el, NATIVELY_FOCUSABLE)) return false;
    } else if (n < 0) return false;
  } else if (!dom.matches(el, NATIVELY_FOCUSABLE)) return false;
  if (el.localName === "input" && dom.attr(el, "type") === "hidden")
    return false;
  if (dom.matches(el, ":disabled") || dom.closest(el, "[inert]")) return false;
  return dom.visible(el, { visibilityProperty: true });
}

function role(el) {
  const explicit = dom.attr(el, "role")?.trim().split(/\s+/)[0];
  if (explicit) return explicit;
  if (el.localName === "button") return "button";
  if (el.localName === "input") {
    const type = (dom.attr(el, "type") ?? "text").toLowerCase();
    if (type === "checkbox" || type === "radio") return type;
    if (type === "range") return "slider";
    if (type === "button" || type === "submit" || type === "reset")
      return "button";
  }
  return null;
}

/** Runs every check on `doc` and records what it finds. */
export function run(doc) {
  if (!doc.documentElement) return;
  const ids = new Map();
  for (const el of dom.all(doc, "[id]")) {
    const id = dom.attr(el, "id");
    if (!id) continue;
    const first = ids.get(id);
    if (first)
      add("duplicate-id", el, `id "${id}" is also on ${tag(first)}`, id);
    else ids.set(id, el);
  }

  for (const el of dom.all(doc, IDREF_SELECTOR)) {
    const closed = dom.attr(el, "aria-expanded") === "false";
    const refs = [];
    for (const name of IDREFS) {
      const value = dom.attr(el, name);
      if (value === null || (closed && POPUP_REFS.has(name))) continue;
      refs.push([name, value]);
    }
    const local = el.localName;
    if (local === "label") refs.push(["for", dom.attr(el, "for")]);
    else if (local === "input" && dom.has(el, "list"))
      refs.push(["list", dom.attr(el, "list")]);
    if (local === "td" || local === "th")
      refs.push(["headers", dom.attr(el, "headers")]);
    if (dom.has(el, "form")) refs.push(["form", dom.attr(el, "form")]);
    for (const [name, value] of refs) {
      for (const id of (value ?? "").trim().split(/\s+/)) {
        if (id && !ids.has(id))
          add("idref", el, `${name} names missing id "${id}"`, id);
      }
    }
  }

  for (const hidden of dom.all(doc, '[aria-hidden="true"]')) {
    if (tabbable(hidden))
      add("aria-hidden-focus", hidden, "is itself in the tab order");
    for (const el of dom.all(hidden, `${NATIVELY_FOCUSABLE},[tabindex]`)) {
      if (tabbable(el))
        add(
          "aria-hidden-focus",
          el,
          `is in the tab order inside ${tag(hidden)}`,
        );
    }
  }

  for (const el of dom.all(doc, "button,input,[role]")) {
    const r = role(el);
    if (!r || !ATOMIC_ROLES.has(r)) continue;
    for (const inner of dom.all(el, `${NATIVELY_FOCUSABLE},[tabindex]`)) {
      if (tabbable(inner))
        add(
          "nested-interactive",
          inner,
          `is in the tab order inside a ${r}, ${tag(el)}`,
        );
    }
  }
}

/** The findings so far, and starts a new list. */
export function take() {
  const out = [...found.values()];
  found = new Map();
  return out;
}

/** Drops a check scheduled by a dispatch, as when a test ends. */
export function cancel() {
  if (pending) {
    (globalThis.__realTimers?.clearTimeout ?? clearTimeout)(pending);
    pending = null;
  }
}
