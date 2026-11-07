// CSS rule coverage: which selectors of a stylesheet match some DOM state
// the tests reach. A selector no test's markup ever matches is either a
// state no test renders or CSS nothing uses.
//
// Selectors are reduced to their structure first: pseudo-elements and the
// user-action states (`:hover`, `:focus`...) come off, since a test's DOM
// can't show those but the markup they style is what counts. Each selector
// is checked until it first matches, and only when the element it styles
// could be in the document: selectors are indexed by a class of their last
// compound, checked against the classes in the document.

/** Pseudo-elements and user-action pseudo-classes, longest names first. */
const DYNAMIC =
  /::?(?:before|after|placeholder|selection|marker|backdrop|file-selector-button|first-line|first-letter|-webkit-[\w-]+|-moz-[\w-]+|-ms-[\w-]+)(?:\([^)]*\))?|:(?:focus-visible|focus-within|focus|hover|active|visited|link|target|autofill|-webkit-autofill)(?![\w-])/g;

/** Splits on commas outside parentheses and brackets. */
export function splitSelectors(text) {
  const out = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth--;
    else if (ch === "," && depth === 0) {
      out.push(text.slice(start, i).trim());
      start = i + 1;
    }
  }
  out.push(text.slice(start).trim());
  return out.filter(Boolean);
}

/** Every style rule's selectors in `css`, once each, in order. */
export function selectorsOf(css) {
  const src = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const seen = new Set();
  let i = 0;
  const block = (end) => {
    while (i < end) {
      const open = src.indexOf("{", i);
      if (open === -1 || open >= end) return;
      const prelude = src.slice(i, open).trim();
      let depth = 1;
      let j = open + 1;
      while (j < src.length && depth > 0) {
        if (src[j] === "{") depth++;
        else if (src[j] === "}") depth--;
        j++;
      }
      if (/^@(media|supports|layer|container|scope)\b/.test(prelude)) {
        i = open + 1;
        block(j - 1);
        i = j;
        continue;
      }
      if (!prelude.startsWith("@") && !/^(from|to|\d+%)/.test(prelude)) {
        for (const selector of splitSelectors(prelude)) seen.add(selector);
      }
      i = j;
    }
  };
  block(src.length);
  return [...seen];
}

/** `selector` without pseudo-elements and user-action states. */
export function structural(selector) {
  let s = selector.replace(DYNAMIC, "");
  // `:not()` or `:is()` left empty by the strip.
  let prev;
  do {
    prev = s;
    s = s.replace(/:(?:not|is|where|has)\(\s*\)/g, "");
  } while (s !== prev);
  s = s.replace(/\s*([>+~])\s*$/, "").trim();
  return s === "" || /^[>+~]/.test(s) ? "*" : s;
}

/** A class the element `selector` styles must have, or `null`. */
export function keyClass(selector) {
  let depth = 0;
  let last = 0;
  for (let i = 0; i < selector.length; i++) {
    const ch = selector[i];
    if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth--;
    else if (
      depth === 0 &&
      (ch === " " || ch === ">" || ch === "+" || ch === "~")
    )
      last = i + 1;
  }
  let compound = "";
  depth = 0;
  for (const ch of selector.slice(last)) {
    if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth--;
    else if (depth === 0) compound += ch;
  }
  return /\.(-?[_a-zA-Z][\w-]*)/.exec(compound)?.[1] ?? null;
}

let state = null;

/**
 * Starts tracking `selectors` (from `selectorsOf`). `querySelector` and
 * the class walk use the methods as they are now, so tests that spy on
 * them don't see the coverage checks.
 */
export function enable(global, selectors) {
  const D = global.Document.prototype;
  const E = global.Element.prototype;
  const query = D.querySelector;
  const all = D.querySelectorAll;
  const classes = Object.getOwnPropertyDescriptor(E, "classList").get;
  const byClass = new Map();
  const always = [];
  const unsupported = [];
  for (const original of selectors) {
    const test = structural(original);
    const entry = { original, test };
    const key = keyClass(test);
    if (key) {
      let list = byClass.get(key);
      if (!list) byClass.set(key, (list = []));
      list.push(entry);
    } else always.push(entry);
  }
  state = {
    covered: new Set(),
    unsupported,
    byClass,
    always,
    query: (doc, s) => query.call(doc, s),
    elements: (doc) => all.call(doc, "[class]"),
    classes: (el) => classes.call(el),
  };
}

export function isEnabled() {
  return state !== null;
}

function tryMatch(doc, entry) {
  try {
    if (state.query(doc, entry.test)) state.covered.add(entry.original);
    return true;
  } catch {
    state.unsupported.push(entry.original);
    return false;
  }
}

/** Marks the selectors that match something in `doc` now. */
export function check(doc) {
  if (!state || !doc.documentElement) return;
  const present = new Set();
  for (const el of state.elements(doc)) {
    for (const name of state.classes(el)) present.add(name);
  }
  const drop = (list) => list.filter((e) => !state.covered.has(e.original));
  for (const name of present) {
    const list = state.byClass.get(name);
    if (!list) continue;
    const left = [];
    for (const entry of list) {
      if (tryMatch(doc, entry) && !state.covered.has(entry.original))
        left.push(entry);
    }
    if (left.length) state.byClass.set(name, left);
    else state.byClass.delete(name);
  }
  state.always = drop(state.always.filter((entry) => tryMatch(doc, entry)));
}

/** What matched so far, and what dom-env couldn't parse. */
export function result() {
  return state
    ? {
        covered: [...state.covered],
        unsupported: [...new Set(state.unsupported)],
      }
    : null;
}
