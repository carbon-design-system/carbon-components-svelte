// CSS selector engine. Selector strings compile once into matcher closures
// that read element fields directly (no public getters), cached by string.
//
// Contract with element.js: elements expose `_localName`, `_ns`, `_id`,
// `_className`, `_classTokens` (null until computed), `_attrs` (array of
// Attr with `_name`/`_value`, or null), and `_doc` with `_focused` /
// `_focusVisible`. Form-ish state goes through `_disabledState()` and the
// public `checked`/`selected`/`value` getters.

import { domException, HTML_NS, splitTokens } from "./shared.js";

const ELEMENT = 1;
const TEXT = 3;
const CDATA = 4;
const EMPTY = [];

function syntaxError(selector) {
  return domException(`'${selector}' is not a valid selector.`, "SyntaxError");
}

// --- Tokenizing helpers -----------------------------------------------------

function isNameStart(c) {
  return (
    (c >= 97 && c <= 122) || (c >= 65 && c <= 90) || c === 95 || c >= 128 // a-z A-Z _ non-ASCII
  );
}
function isNameChar(c) {
  return isNameStart(c) || (c >= 48 && c <= 57) || c === 45;
}
function isHex(c) {
  return (c >= 48 && c <= 57) || (c >= 65 && c <= 70) || (c >= 97 && c <= 102);
}
function isWs(c) {
  return c === 32 || c === 9 || c === 10 || c === 12 || c === 13;
}

class Parser {
  constructor(source) {
    this.s = source;
    this.i = 0;
  }
  peek(o = 0) {
    return this.s.charCodeAt(this.i + o);
  }
  eof() {
    return this.i >= this.s.length;
  }
  fail() {
    throw syntaxError(this.s);
  }
  skipWs() {
    let any = false;
    while (!this.eof()) {
      const c = this.peek();
      if (isWs(c)) {
        this.i++;
        any = true;
      } else if (c === 47 && this.peek(1) === 42) {
        const end = this.s.indexOf("*/", this.i + 2);
        if (end === -1) this.fail();
        this.i = end + 2;
        any = true;
      } else {
        break;
      }
    }
    return any;
  }
  escape() {
    // Called after a backslash.
    if (this.eof()) return "�";
    const c = this.peek();
    if (isHex(c)) {
      let hex = "";
      while (hex.length < 6 && !this.eof() && isHex(this.peek()))
        hex += this.s[this.i++];
      if (!this.eof() && isWs(this.peek())) {
        if (this.peek() === 13 && this.peek(1) === 10) this.i++;
        this.i++;
      }
      const cp = Number.parseInt(hex, 16);
      return cp === 0 || cp > 0x10ffff || (cp >= 0xd800 && cp <= 0xdfff)
        ? "�"
        : String.fromCodePoint(cp);
    }
    if (c === 10 || c === 12 || c === 13) this.fail();
    const cp = this.s.codePointAt(this.i);
    this.i += cp > 0xffff ? 2 : 1;
    return String.fromCodePoint(cp);
  }
  ident() {
    let out = "";
    const start = this.i;
    if (this.peek() === 45) {
      out += "-";
      this.i++;
      if (this.peek() === 45) {
        out += "-";
        this.i++;
      }
    }
    while (!this.eof()) {
      const c = this.peek();
      if (isNameChar(c)) {
        out += this.s[this.i++];
      } else if (c === 92) {
        this.i++;
        out += this.escape();
      } else {
        break;
      }
    }
    if (out === "" || out === "-") {
      this.i = start;
      return null;
    }
    // An identifier can't start with a digit, or "-" + digit.
    const first = out.charCodeAt(0);
    if (first >= 48 && first <= 57 && this.s[start] !== "\\") this.fail();
    return out;
  }
  string() {
    const quote = this.s[this.i++];
    let out = "";
    while (true) {
      if (this.eof()) return out;
      const ch = this.s[this.i];
      if (ch === quote) {
        this.i++;
        return out;
      }
      if (ch === "\\") {
        this.i++;
        const c = this.peek();
        if (c === 10) {
          this.i++;
          continue;
        }
        out += this.escape();
        continue;
      }
      if (ch === "\n") this.fail();
      out += ch;
      this.i++;
    }
  }
  /** Raw text up to the matching close paren, for nth arguments. */
  balanced() {
    let depth = 0;
    const start = this.i;
    while (!this.eof()) {
      const ch = this.s[this.i];
      if (ch === "(") depth++;
      else if (ch === ")") {
        if (depth === 0) return this.s.slice(start, this.i);
        depth--;
      } else if (ch === '"' || ch === "'") {
        this.string();
        continue;
      }
      this.i++;
    }
    this.fail();
  }
}

// --- Element helpers --------------------------------------------------------

function classTokens(el) {
  let t = el._classTokens;
  if (t === null) {
    const s = el._className;
    t = el._classTokens = s ? splitTokens(s) : EMPTY;
  }
  return t;
}

function isHTML(el) {
  return el._ns === HTML_NS && el._doc._isHTML;
}

function getAttr(el, name, lowerName) {
  const attrs = el._attrs;
  if (attrs === null) return null;
  const n = isHTML(el) ? lowerName : name;
  for (let i = 0; i < attrs.length; i++)
    if (attrs[i]._name === n) return attrs[i]._value;
  return null;
}

function prevElement(el) {
  for (let s = el._prev; s; s = s._prev) if (s.nodeType === ELEMENT) return s;
  return null;
}
function nextElement(el) {
  for (let s = el._next; s; s = s._next) if (s.nodeType === ELEMENT) return s;
  return null;
}
function parentElement(el) {
  const p = el._parent;
  return p && p.nodeType === ELEMENT ? p : null;
}

const CASE_INSENSITIVE_ATTRS = new Set(
  "accept accept-charset align alink axis bgcolor charset checked clear codetype color compact declare defer dir direction disabled enctype face frame hreflang http-equiv lang language link media method multiple nohref noresize noshade nowrap readonly rel rev rules scope scrolling selected shape target text type valign valuetype vlink".split(
    " ",
  ),
);

// --- Compiling --------------------------------------------------------------

const ALWAYS = () => true;
const NEVER = () => false;

function and(tests) {
  if (tests.length === 0) return ALWAYS;
  if (tests.length === 1) return tests[0];
  if (tests.length === 2) {
    const [a, b] = tests;
    return (el, ctx) => a(el, ctx) && b(el, ctx);
  }
  return (el, ctx) => {
    for (let i = 0; i < tests.length; i++) if (!tests[i](el, ctx)) return false;
    return true;
  };
}

function anyOf(list) {
  if (list.length === 1) return list[0];
  return (el, ctx) => {
    for (let i = 0; i < list.length; i++) if (list[i](el, ctx)) return true;
    return false;
  };
}

function parseSelectorList(p, { relative = false, forgiving = false } = {}) {
  const out = [];
  while (true) {
    p.skipWs();
    const start = p.i;
    try {
      out.push(parseComplex(p, relative));
    } catch (e) {
      if (!forgiving) throw e;
      // Skip to the next top-level comma or the closing paren.
      p.i = start;
      let depth = 0;
      while (!p.eof()) {
        const ch = p.s[p.i];
        if (ch === "(") depth++;
        else if (ch === ")") {
          if (depth === 0) break;
          depth--;
        } else if (ch === "," && depth === 0) break;
        p.i++;
      }
    }
    p.skipWs();
    if (p.eof() || p.s[p.i] === ")") return out;
    if (p.s[p.i] !== ",") p.fail();
    p.i++;
  }
}

/** Returns a matcher `(el, ctx) => boolean` for one complex selector. */
function parseComplex(p, relative) {
  const compounds = [];
  const combinators = [];
  let leading = null;
  p.skipWs();
  if (relative) {
    const ch = p.s[p.i];
    if (ch === ">" || ch === "+" || ch === "~") {
      leading = ch;
      p.i++;
      p.skipWs();
    } else {
      leading = " ";
    }
  }
  compounds.push(parseCompound(p));
  while (true) {
    const hadWs = p.skipWs();
    if (p.eof()) break;
    const ch = p.s[p.i];
    if (ch === "," || ch === ")") break;
    let comb = " ";
    if (ch === ">" || ch === "+" || ch === "~") {
      comb = ch;
      p.i++;
      p.skipWs();
    } else if (!hadWs) {
      p.fail();
    }
    combinators.push(comb);
    compounds.push(parseCompound(p));
  }

  // Build right to left: m_i = compound_i && related(m_{i+1}).
  let matcher;
  if (relative) {
    // Leftmost relation anchors to the :has() subject, held in ctx.anchor.
    const anchorTest = (el, ctx) => el === ctx.anchor;
    matcher = relate(leading, compounds[0], anchorTest);
  } else {
    matcher = compounds[0];
  }
  for (let i = 1; i < compounds.length; i++) {
    matcher = relate(combinators[i - 1], compounds[i], matcher);
  }
  matcher.leading = leading;
  return matcher;
}

/** `test(el) && el has a `comb`-related element matching `left`. */
function relate(comb, test, left) {
  switch (comb) {
    case ">":
      return (el, ctx) => {
        if (!test(el, ctx)) return false;
        const p = el._parent;
        return p !== null && p.nodeType === ELEMENT && left(p, ctx);
      };
    case " ":
      return (el, ctx) => {
        if (!test(el, ctx)) return false;
        for (
          let p = el._parent;
          p !== null && p.nodeType === ELEMENT;
          p = p._parent
        ) {
          if (left(p, ctx)) return true;
        }
        return false;
      };
    case "+":
      return (el, ctx) => {
        if (!test(el, ctx)) return false;
        const s = prevElement(el);
        return s !== null && left(s, ctx);
      };
    case "~":
      return (el, ctx) => {
        if (!test(el, ctx)) return false;
        for (let s = prevElement(el); s; s = prevElement(s))
          if (left(s, ctx)) return true;
        return false;
      };
  }
  throw new Error(`unknown combinator ${comb}`);
}

function parseCompound(p) {
  const tests = [];
  let sawAny = false;
  let pseudoElement = false;

  // Type selector, possibly with a namespace prefix.
  let c = p.peek();
  if (
    c === 42 /* * */ ||
    c === 124 /* | */ ||
    isNameStart(c) ||
    c === 45 ||
    c === 92
  ) {
    let name = null;
    let nsAny = false;
    if (c === 42) {
      p.i++;
      name = "*";
    } else if (c !== 124) {
      name = p.ident();
    }
    if (p.peek() === 124 && p.peek(1) !== 61 /* not |= */) {
      p.i++;
      nsAny = name === "*";
      if (p.peek() === 42) {
        p.i++;
        name = "*";
      } else {
        name = p.ident();
        if (name === null) p.fail();
      }
      // Only `*|x` and `|x` are meaningful without @namespace rules.
      if (!nsAny) tests.push((el) => el._ns === null);
    }
    if (name !== null) {
      sawAny = true;
      if (name !== "*") {
        const lower = name.toLowerCase();
        tests.push((el) =>
          el._ns === HTML_NS ? el._localName === lower : el._localName === name,
        );
      }
    }
  }

  while (!p.eof()) {
    c = p.peek();
    if (c === 35 /* # */) {
      p.i++;
      const id = p.ident();
      if (id === null) p.fail();
      tests.push((el) => el._id === id);
    } else if (c === 46 /* . */) {
      p.i++;
      const cls = p.ident();
      if (cls === null) p.fail();
      tests.push((el) => {
        if (!el._className) return false;
        const t = classTokens(el);
        for (let i = 0; i < t.length; i++) if (t[i] === cls) return true;
        return false;
      });
    } else if (c === 91 /* [ */) {
      p.i++;
      tests.push(parseAttribute(p));
    } else if (c === 58 /* : */) {
      p.i++;
      if (p.peek() === 58) {
        p.i++;
        parsePseudoElement(p);
        pseudoElement = true;
      } else {
        const result = parsePseudoClass(p);
        if (result === PSEUDO_ELEMENT) pseudoElement = true;
        else tests.push(result);
      }
    } else {
      break;
    }
    sawAny = true;
  }
  if (!sawAny) p.fail();
  return pseudoElement ? NEVER : and(tests);
}

function parseAttribute(p) {
  p.skipWs();
  let name;
  if (p.peek() === 42 && p.peek(1) === 124) {
    p.i += 2;
    name = p.ident();
  } else {
    name = p.ident();
    if (p.peek() === 124 && p.peek(1) !== 61) {
      p.i++;
      name = p.ident();
    }
  }
  if (name === null) p.fail();
  const lower = name.toLowerCase();
  p.skipWs();
  if (p.peek() === 93 /* ] */) {
    p.i++;
    return (el) => getAttr(el, name, lower) !== null;
  }
  const op = p.s[p.i];
  if (op === "=") {
    p.i++;
  } else if ("~|^$*".includes(op) && p.s[p.i + 1] === "=") {
    p.i += 2;
  } else {
    p.fail();
  }
  p.skipWs();
  let value;
  const q = p.peek();
  if (q === 34 || q === 39) value = p.string();
  else {
    value = p.ident();
    if (value === null) {
      // Unquoted values may also be numbers in practice ([tabindex=0]).
      const m = /^[0-9][\w-]*/.exec(p.s.slice(p.i));
      if (!m) p.fail();
      value = m[0];
      p.i += value.length;
    }
  }
  p.skipWs();
  let flag = null;
  const f = p.peek();
  if (f === 105 || f === 73) {
    flag = "i";
    p.i++;
  } else if (f === 115 || f === 83) {
    flag = "s";
    p.i++;
  }
  p.skipWs();
  if (p.peek() !== 93) p.fail();
  p.i++;

  const htmlInsensitive = flag === null && CASE_INSENSITIVE_ATTRS.has(lower);
  const ci = flag === "i";
  const needle = ci ? value.toLowerCase() : value;
  const lowerNeedle = value.toLowerCase();
  const cmp = (actual) => {
    switch (op) {
      case "=":
        return actual === needle;
      case "~":
        if (needle === "" || /[\t\n\f\r ]/.test(needle)) return false;
        return splitTokens(actual).includes(needle);
      case "|":
        return actual === needle || actual.startsWith(needle + "-");
      case "^":
        return needle !== "" && actual.startsWith(needle);
      case "$":
        return needle !== "" && actual.endsWith(needle);
      case "*":
        return needle !== "" && actual.includes(needle);
    }
    return false;
  };
  return (el) => {
    const v = getAttr(el, name, lower);
    if (v === null) return false;
    if (ci) return cmp(v.toLowerCase());
    if (htmlInsensitive && isHTML(el)) {
      return op === "=" ? v.toLowerCase() === lowerNeedle : cmp(v);
    }
    return cmp(v);
  };
}

const PSEUDO_ELEMENT = Symbol("pseudo-element");
const LEGACY_PSEUDO_ELEMENTS = new Set([
  "before",
  "after",
  "first-line",
  "first-letter",
]);

function parsePseudoElement(p) {
  const name = p.ident();
  if (name === null) p.fail();
  if (p.peek() === 40) {
    p.i++;
    p.balanced();
    p.i++;
  }
}

function parseNth(text, p) {
  let s = text.trim().toLowerCase();
  let of = null;
  const ofMatch = /\s+of\s+/.exec(s);
  if (ofMatch) {
    const rest = text.trim().slice(ofMatch.index + ofMatch[0].length);
    s = s.slice(0, ofMatch.index);
    of = anyOf(parseSelectorList(new Parser(rest)));
  }
  let a;
  let b;
  if (s === "odd") {
    a = 2;
    b = 1;
  } else if (s === "even") {
    a = 2;
    b = 0;
  } else {
    const m = /^([+-]?\d*)?n\s*(?:([+-])\s*(\d+))?$/.exec(s);
    if (m) {
      const coef = m[1];
      a =
        coef === undefined || coef === "" || coef === "+"
          ? 1
          : coef === "-"
            ? -1
            : Number.parseInt(coef, 10);
      b = m[2] ? Number.parseInt(m[2] + m[3], 10) : 0;
    } else if (/^[+-]?\d+$/.test(s)) {
      a = 0;
      b = Number.parseInt(s, 10);
    } else {
      p.fail();
    }
  }
  const matchesIndex = (i) =>
    a === 0 ? i === b : (i - b) / a >= 0 && (i - b) % a === 0;
  return { matchesIndex, of };
}

function nthTest(name, arg, p) {
  const { matchesIndex, of } = parseNth(arg, p);
  const ofType = name.endsWith("of-type");
  const fromEnd = name.includes("last");
  return (el, ctx) => {
    if (of && !of(el, ctx)) return false;
    let i = 1;
    const step = fromEnd ? nextElement : prevElement;
    for (let s = step(el); s; s = step(s)) {
      if (
        ofType
          ? s._localName === el._localName && s._ns === el._ns
          : of
            ? of(s, ctx)
            : true
      )
        i++;
    }
    return matchesIndex(i);
  };
}

function isFocused(el) {
  return el._doc._focused === el && el.isConnected;
}

function langOf(el) {
  for (let e = el; e; e = parentElement(e)) {
    const v = getAttr(e, "lang", "lang");
    if (v !== null) return v.toLowerCase();
  }
  return "";
}

function isLink(el) {
  return (
    (el._localName === "a" || el._localName === "area") &&
    el._ns === HTML_NS &&
    getAttr(el, "href", "href") !== null
  );
}

function isEditableField(el) {
  if (el._ns !== HTML_NS) return false;
  if (el._localName === "textarea") return true;
  if (el._localName !== "input") return false;
  return !NON_TEXT_INPUTS.has(el.type);
}
const NON_TEXT_INPUTS = new Set([
  "hidden",
  "range",
  "color",
  "checkbox",
  "radio",
  "file",
  "submit",
  "image",
  "reset",
  "button",
]);

function parsePseudoClass(p) {
  const name = p.ident();
  if (name === null) p.fail();
  const lname = name.toLowerCase();
  if (p.peek() === 40 /* ( */) {
    p.i++;
    let test;
    switch (lname) {
      case "not": {
        const list = anyOf(parseSelectorList(p));
        test = (el, ctx) => !list(el, ctx);
        break;
      }
      case "is":
      case "matches":
      case "where":
      case "-webkit-any": {
        const list = parseSelectorList(p, { forgiving: true });
        test = list.length ? anyOf(list) : NEVER;
        break;
      }
      case "has": {
        const list = parseSelectorList(p, { relative: true });
        test = (el, ctx) => {
          const inner = { scope: ctx.scope, anchor: el };
          for (const m of list) {
            if (m.leading === " " || m.leading === ">") {
              for (let n = el._first; n; n = nextInSubtree(n, el)) {
                if (n.nodeType === ELEMENT && m(n, inner)) return true;
              }
            } else {
              for (let s = el._next; s; s = s._next) {
                if (s.nodeType !== ELEMENT) continue;
                if (m(s, inner)) return true;
                for (let n = s._first; n; n = nextInSubtree(n, s)) {
                  if (n.nodeType === ELEMENT && m(n, inner)) return true;
                }
              }
            }
          }
          return false;
        };
        break;
      }
      case "nth-child":
      case "nth-last-child":
      case "nth-of-type":
      case "nth-last-of-type":
        test = nthTest(lname, p.balanced(), p);
        break;
      case "lang": {
        const langs = p
          .balanced()
          .split(",")
          .map((s) =>
            s
              .trim()
              .replace(/^["']|["']$/g, "")
              .toLowerCase(),
          );
        test = (el) => {
          const l = langOf(el);
          return langs.some((x) => l === x || l.startsWith(x + "-"));
        };
        break;
      }
      case "dir": {
        const dir = p.balanced().trim().toLowerCase();
        test = (el) => {
          for (let e = el; e; e = parentElement(e)) {
            const v = getAttr(e, "dir", "dir");
            if (v === "ltr" || v === "rtl") return v === dir;
          }
          return dir === "ltr";
        };
        break;
      }
      case "host":
      case "host-context":
      case "state":
        p.balanced();
        test = NEVER;
        break;
      default:
        p.fail();
    }
    p.skipWs();
    if (p.peek() !== 41) p.fail();
    p.i++;
    return test;
  }

  switch (lname) {
    case "first-child":
      return (el) => prevElement(el) === null;
    case "last-child":
      return (el) => nextElement(el) === null;
    case "only-child":
      return (el) => prevElement(el) === null && nextElement(el) === null;
    case "first-of-type":
      return (el) => {
        for (let s = prevElement(el); s; s = prevElement(s))
          if (s._localName === el._localName) return false;
        return true;
      };
    case "last-of-type":
      return (el) => {
        for (let s = nextElement(el); s; s = nextElement(s))
          if (s._localName === el._localName) return false;
        return true;
      };
    case "only-of-type":
      return (el) => {
        for (let s = prevElement(el); s; s = prevElement(s))
          if (s._localName === el._localName) return false;
        for (let s = nextElement(el); s; s = nextElement(s))
          if (s._localName === el._localName) return false;
        return true;
      };
    case "root":
      return (el) => el._parent !== null && el._parent.nodeType === 9;
    case "empty":
      return (el) => {
        for (let c = el._first; c; c = c._next) {
          const t = c.nodeType;
          if (
            t === ELEMENT ||
            ((t === TEXT || t === CDATA) && c._data.length > 0)
          )
            return false;
        }
        return true;
      };
    case "scope":
      return (el, ctx) =>
        ctx.scope
          ? el === ctx.scope
          : el._parent !== null && el._parent.nodeType === 9;
    case "checked":
      return (el) => {
        if (el._ns !== HTML_NS) return false;
        if (el._localName === "input") {
          const t = el.type;
          return (t === "checkbox" || t === "radio") && el.checked;
        }
        return el._localName === "option" && el.selected;
      };
    case "indeterminate":
      return (el) =>
        el._ns === HTML_NS &&
        ((el._localName === "input" &&
          el.type === "checkbox" &&
          el.indeterminate) ||
          (el._localName === "progress" &&
            getAttr(el, "value", "value") === null));
    case "disabled":
      return (el) => el._disabledState?.() === true;
    case "enabled":
      return (el) => el._disabledState?.() === false;
    case "required":
      return (el) =>
        isRequirable(el) && getAttr(el, "required", "required") !== null;
    case "optional":
      return (el) =>
        isRequirable(el) && getAttr(el, "required", "required") === null;
    case "read-write":
      return (el) => isReadWrite(el);
    case "read-only":
      return (el) => !isReadWrite(el);
    case "placeholder-shown":
      return (el) =>
        isEditableField(el) &&
        getAttr(el, "placeholder", "placeholder") !== null &&
        el.value === "";
    case "valid":
      return (el) =>
        el.validity?.valid === true ||
        (el._localName === "form" && !el._hasInvalid?.());
    case "invalid":
      return (el) =>
        el.validity?.valid === false ||
        (el._localName === "form" && !!el._hasInvalid?.());
    case "user-valid":
    case "user-invalid":
    case "in-range":
    case "out-of-range":
    case "default":
    case "autofill":
    case "-webkit-autofill":
      return NEVER;
    case "focus":
      return isFocused;
    case "focus-visible":
      return (el) => isFocused(el) && el._doc._focusVisible;
    case "focus-within":
      return (el) => {
        const f = el._doc._focused;
        if (!f?.isConnected) return false;
        for (let n = f; n; n = n._parent) if (n === el) return true;
        return false;
      };
    case "link":
    case "any-link":
    case "-webkit-any-link":
      return isLink;
    case "open":
      return (el) =>
        (el._localName === "details" || el._localName === "dialog") &&
        getAttr(el, "open", "open") !== null;
    case "popover-open":
      return (el) => !!el._popoverOpen;
    case "defined":
      return ALWAYS;
    case "hover":
    case "active":
    case "visited":
    case "target":
    case "target-within":
    case "current":
    case "past":
    case "future":
    case "playing":
    case "paused":
    case "modal":
    case "fullscreen":
    case "picture-in-picture":
    case "host":
      return NEVER;
    default:
      if (LEGACY_PSEUDO_ELEMENTS.has(lname)) return PSEUDO_ELEMENT;
      p.fail();
  }
}

function isRequirable(el) {
  const n = el._localName;
  return (
    el._ns === HTML_NS && (n === "input" || n === "select" || n === "textarea")
  );
}

function isReadWrite(el) {
  if (el._ns === HTML_NS) {
    if (el._localName === "textarea") {
      return (
        getAttr(el, "readonly", "readonly") === null &&
        el._disabledState() !== true
      );
    }
    if (el._localName === "input") {
      return (
        isEditableField(el) &&
        getAttr(el, "readonly", "readonly") === null &&
        el._disabledState() !== true
      );
    }
  }
  return !!el.isContentEditable;
}

function nextInSubtree(node, root) {
  if (node._first) return node._first;
  for (let n = node; n && n !== root; n = n._parent) {
    if (n._next) return n._next;
  }
  return null;
}

// --- Public API -----------------------------------------------------------

const cache = new Map();

/** Compiles a selector list; throws a SyntaxError DOMException if invalid. */
export function compile(selector) {
  let compiled = cache.get(selector);
  if (compiled !== undefined) return compiled;
  const p = new Parser(selector);
  p.skipWs();
  if (p.eof()) throw syntaxError(selector);
  const list = parseSelectorList(p);
  if (!p.eof()) throw syntaxError(selector);
  compiled = anyOf(list);
  if (cache.size > 5000) cache.clear();
  cache.set(selector, compiled);
  return compiled;
}

export function matchesSelector(el, compiled, scope = el) {
  return compiled(el, { scope, anchor: null });
}

export function querySelectorFrom(root, compiled) {
  const ctx = { scope: root.nodeType === ELEMENT ? root : null, anchor: null };
  for (let n = root._first; n; n = nextInSubtree(n, root)) {
    if (n.nodeType === ELEMENT && compiled(n, ctx)) return n;
  }
  return null;
}

export function querySelectorAllFrom(root, compiled) {
  const ctx = { scope: root.nodeType === ELEMENT ? root : null, anchor: null };
  const out = [];
  for (let n = root._first; n; n = nextInSubtree(n, root)) {
    if (n.nodeType === ELEMENT && compiled(n, ctx)) out.push(n);
  }
  return out;
}
