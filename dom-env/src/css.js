// CSSStyleDeclaration and getComputedStyle.
//
// Declarations are stored as normalized strings in an ordered Map and only
// parsed when the backing `style` attribute changes and the declaration is
// read again. There's no full CSS value grammar: values are normalized the
// way tests observe them in jsdom (lowercase keywords and units, hex colors
// to rgb(), unitless 0 to 0px on lengths) and otherwise kept verbatim.
//
// getComputedStyle has no layout. Without stylesheets (the normal case in
// component tests) it resolves inline style, inheritance, and per-element
// defaults; with <style> elements it also applies matching rules.

import { compile, matchesSelector } from "./selector.js";
import { HTML_NS, INTERNAL, illegalConstructor, str, tag } from "./shared.js";

// --- Property names -----------------------------------------------------------

const PROPERTIES =
  `align-content align-items align-self all animation animation-delay animation-direction
animation-duration animation-fill-mode animation-iteration-count animation-name animation-play-state
animation-timing-function appearance aspect-ratio backdrop-filter backface-visibility background
background-attachment background-blend-mode background-clip background-color background-image
background-origin background-position background-position-x background-position-y background-repeat
background-size block-size border border-block border-block-end border-block-start border-bottom
border-bottom-color border-bottom-left-radius border-bottom-right-radius border-bottom-style
border-bottom-width border-collapse border-color border-end-end-radius border-end-start-radius
border-image border-inline border-inline-end border-inline-start border-left border-left-color
border-left-style border-left-width border-radius border-right border-right-color border-right-style
border-right-width border-spacing border-start-end-radius border-start-start-radius border-style
border-top border-top-color border-top-left-radius border-top-right-radius border-top-style
border-top-width border-width bottom box-shadow box-sizing break-after break-before break-inside
caption-side caret-color clear clip clip-path color color-scheme column-count column-gap column-rule
column-width columns contain container container-name container-type content content-visibility
counter-increment counter-reset cursor direction display empty-cells fill fill-opacity filter flex
flex-basis flex-direction flex-flow flex-grow flex-shrink flex-wrap float font font-family
font-feature-settings font-kerning font-size font-stretch font-style font-variant
font-variant-numeric font-weight gap grid grid-area grid-auto-columns grid-auto-flow grid-auto-rows
grid-column grid-column-end grid-column-gap grid-column-start grid-gap grid-row grid-row-end
grid-row-gap grid-row-start grid-template grid-template-areas grid-template-columns
grid-template-rows height hyphens inline-size inset inset-block inset-block-end inset-block-start
inset-inline inset-inline-end inset-inline-start isolation justify-content justify-items
justify-self left letter-spacing line-clamp line-height list-style list-style-image
list-style-position list-style-type margin margin-block margin-block-end margin-block-start
margin-bottom margin-inline margin-inline-end margin-inline-start margin-left margin-right
margin-top mask mask-image max-block-size max-height max-inline-size max-width min-block-size
min-height min-inline-size min-width mix-blend-mode object-fit object-position opacity order
outline outline-color outline-offset outline-style outline-width overflow overflow-anchor
overflow-wrap overflow-x overflow-y overscroll-behavior padding padding-block padding-block-end
padding-block-start padding-bottom padding-inline padding-inline-end padding-inline-start
padding-left padding-right padding-top page-break-after page-break-before page-break-inside
perspective perspective-origin place-content place-items place-self pointer-events position
quotes resize right rotate row-gap scale scroll-behavior scroll-margin scroll-padding
scroll-snap-align scroll-snap-type scrollbar-color scrollbar-gutter scrollbar-width shape-outside
stroke stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-opacity stroke-width
tab-size table-layout text-align text-align-last text-decoration text-decoration-color
text-decoration-line text-decoration-style text-decoration-thickness text-indent text-overflow
text-rendering text-shadow text-transform text-underline-offset top touch-action transform
transform-origin transform-style transition transition-delay transition-duration
transition-property transition-timing-function translate unicode-bidi user-select vertical-align
visibility white-space widows width will-change word-break word-spacing word-wrap writing-mode
z-index zoom -webkit-appearance -webkit-box-orient -webkit-line-clamp -webkit-font-smoothing
-webkit-tap-highlight-color -webkit-text-fill-color -webkit-transform -webkit-transition
-webkit-user-select -webkit-overflow-scrolling -moz-appearance -moz-osx-font-smoothing
-ms-overflow-style`
    .split(/\s+/)
    .filter(Boolean);

function camel(name) {
  return name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

/** `backgroundColor` / `WebkitTransform` / `cssFloat` -> dashed name. */
export function dashed(name) {
  if (name === "cssFloat") return "float";
  if (name.startsWith("--")) return name;
  if (/^(webkit|moz|ms)[A-Z]/.test(name)) name = "-" + name;
  else if (/^(Webkit|Moz|Ms)[A-Z]/.test(name))
    name = "-" + name[0].toLowerCase() + name.slice(1);
  return name.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());
}

// --- Value normalization -------------------------------------------------------

const LENGTH_PROPS = new Set(
  `width height min-width min-height max-width max-height top right bottom left inset inset-block
inset-inline inset-block-start inset-block-end inset-inline-start inset-inline-end margin margin-top
margin-right margin-bottom margin-left margin-block margin-inline margin-block-start margin-block-end
margin-inline-start margin-inline-end padding padding-top padding-right padding-bottom padding-left
padding-block padding-inline padding-block-start padding-block-end padding-inline-start
padding-inline-end gap row-gap column-gap grid-gap grid-row-gap grid-column-gap border-width
border-top-width border-right-width border-bottom-width border-left-width border-radius
border-top-left-radius border-top-right-radius border-bottom-left-radius border-bottom-right-radius
outline-width outline-offset letter-spacing word-spacing text-indent flex-basis font-size
block-size inline-size min-block-size min-inline-size max-block-size max-inline-size
scroll-margin scroll-padding`
    .split(/\s+/)
    .filter(Boolean),
);

// Properties whose values may contain case-sensitive identifiers or strings.
const CASE_SENSITIVE = new Set([
  "font-family",
  "font",
  "content",
  "quotes",
  "grid-template-areas",
  "grid-area",
  "grid-row",
  "grid-column",
  "grid-row-start",
  "grid-row-end",
  "grid-column-start",
  "grid-column-end",
  "grid-template",
  "grid",
  "animation",
  "animation-name",
  "counter-reset",
  "counter-increment",
  "list-style-type",
  "container-name",
  "container",
  "will-change",
  "transition-property",
  "font-feature-settings",
]);

const COLORS = (() => {
  const map = new Map();
  const data =
    "aliceblue:f0f8ff antiquewhite:faebd7 aqua:00ffff aquamarine:7fffd4 azure:f0ffff beige:f5f5dc bisque:ffe4c4 black:000000 blanchedalmond:ffebcd blue:0000ff blueviolet:8a2be2 brown:a52a2a burlywood:deb887 cadetblue:5f9ea0 chartreuse:7fff00 chocolate:d2691e coral:ff7f50 cornflowerblue:6495ed cornsilk:fff8dc crimson:dc143c cyan:00ffff darkblue:00008b darkcyan:008b8b darkgoldenrod:b8860b darkgray:a9a9a9 darkgreen:006400 darkgrey:a9a9a9 darkkhaki:bdb76b darkmagenta:8b008b darkolivegreen:556b2f darkorange:ff8c00 darkorchid:9932cc darkred:8b0000 darksalmon:e9967a darkseagreen:8fbc8f darkslateblue:483d8b darkslategray:2f4f4f darkslategrey:2f4f4f darkturquoise:00ced1 darkviolet:9400d3 deeppink:ff1493 deepskyblue:00bfff dimgray:696969 dimgrey:696969 dodgerblue:1e90ff firebrick:b22222 floralwhite:fffaf0 forestgreen:228b22 fuchsia:ff00ff gainsboro:dcdcdc ghostwhite:f8f8ff gold:ffd700 goldenrod:daa520 gray:808080 green:008000 greenyellow:adff2f grey:808080 honeydew:f0fff0 hotpink:ff69b4 indianred:cd5c5c indigo:4b0082 ivory:fffff0 khaki:f0e68c lavender:e6e6fa lavenderblush:fff0f5 lawngreen:7cfc00 lemonchiffon:fffacd lightblue:add8e6 lightcoral:f08080 lightcyan:e0ffff lightgoldenrodyellow:fafad2 lightgray:d3d3d3 lightgreen:90ee90 lightgrey:d3d3d3 lightpink:ffb6c1 lightsalmon:ffa07a lightseagreen:20b2aa lightskyblue:87cefa lightslategray:778899 lightslategrey:778899 lightsteelblue:b0c4de lightyellow:ffffe0 lime:00ff00 limegreen:32cd32 linen:faf0e6 magenta:ff00ff maroon:800000 mediumaquamarine:66cdaa mediumblue:0000cd mediumorchid:ba55d3 mediumpurple:9370db mediumseagreen:3cb371 mediumslateblue:7b68ee mediumspringgreen:00fa9a mediumturquoise:48d1cc mediumvioletred:c71585 midnightblue:191970 mintcream:f5fffa mistyrose:ffe4e1 moccasin:ffe4b5 navajowhite:ffdead navy:000080 oldlace:fdf5e6 olive:808000 olivedrab:6b8e23 orange:ffa500 orangered:ff4500 orchid:da70d6 palegoldenrod:eee8aa palegreen:98fb98 paleturquoise:afeeee palevioletred:db7093 papayawhip:ffefd5 peachpuff:ffdab9 peru:cd853f pink:ffc0cb plum:dda0dd powderblue:b0e0e6 purple:800080 rebeccapurple:663399 red:ff0000 rosybrown:bc8f8f royalblue:4169e1 saddlebrown:8b4513 salmon:fa8072 sandybrown:f4a460 seagreen:2e8b57 seashell:fff5ee sienna:a0522d silver:c0c0c0 skyblue:87ceeb slateblue:6a5acd slategray:708090 slategrey:708090 snow:fffafa springgreen:00ff7f steelblue:4682b4 tan:d2b48c teal:008080 thistle:d8bfd8 tomato:ff6347 turquoise:40e0d0 violet:ee82ee wheat:f5deb3 white:ffffff whitesmoke:f5f5f5 yellow:ffff00 yellowgreen:9acd32";
  for (const pair of data.split(" ")) {
    const [name, hex] = pair.split(":");
    map.set(name, hex);
  }
  return map;
})();

function hexToRgb(hex) {
  let h = hex;
  if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join("");
  const r = Number.parseInt(h.slice(0, 2), 16);
  const g = Number.parseInt(h.slice(2, 4), 16);
  const b = Number.parseInt(h.slice(4, 6), 16);
  if (h.length === 8) {
    const a =
      Math.round((Number.parseInt(h.slice(6, 8), 16) / 255) * 1000) / 1000;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  return `rgb(${r}, ${g}, ${b})`;
}

/** Replaces tokens outside of strings and url(). */
function mapOutsideStrings(value, re, fn) {
  if (!/["'(]/.test(value)) return value.replace(re, fn);
  let out = "";
  let i = 0;
  const chunks = value.split(
    /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|url\([^)]*\))/i,
  );
  for (const chunk of chunks) {
    out += i++ % 2 === 1 ? chunk : chunk.replace(re, fn);
  }
  return out;
}

const HEX_RE =
  /#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![0-9a-zA-Z])/g;
const UNIT_RE = /(\d)([a-zA-Z%]+)(?![\w(])/g;
const ZERO_RE = /(^|[\s(,])0(?=$|[\s),])/g;
const KEYWORD_RE = /^-?[a-zA-Z][a-zA-Z0-9-]*$/;

// --- calc() simplification, matching what tests observe in jsdom ---------------

const NUM_RE = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)(%|[a-z]+)?$/i;

function formatCalcNumber(n) {
  return String(Math.round(n * 1e6) / 1e6);
}

/** Evaluates a product of factors to a single { value, unit }, or null. */
function evalProduct(text) {
  const parts = [];
  let depth = 0;
  let cur = "";
  for (const ch of text) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (depth === 0 && (ch === "*" || ch === "/")) {
      parts.push(cur.trim(), ch);
      cur = "";
    } else cur += ch;
  }
  parts.push(cur.trim());
  let value = 1;
  let unit = "";
  for (let i = 0; i < parts.length; i += 2) {
    const op = i === 0 ? "*" : parts[i - 1];
    const factor = parts[i];
    let term;
    if (factor.startsWith("(") && factor.endsWith(")")) {
      const sum = evalSum(factor.slice(1, -1));
      if (!sum || sum.length !== 1) return null;
      term = sum[0];
    } else {
      const m = NUM_RE.exec(factor);
      if (!m) return null;
      term = { value: Number(m[1]), unit: (m[2] ?? "").toLowerCase() };
    }
    if (op === "*") {
      if (unit && term.unit) return null;
      value *= term.value;
      unit ||= term.unit;
    } else {
      if (term.unit || term.value === 0) return null;
      value /= term.value;
    }
  }
  return { value, unit };
}

/** Splits a calc() body into signed terms; null if it can't be evaluated. */
function evalSum(text) {
  if (
    /[a-z-]+\(/i.test(text.replace(/^\(|\)$/g, "")) &&
    /(var|env|min|max|clamp|attr)\(/i.test(text)
  ) {
    return null;
  }
  const terms = [];
  let depth = 0;
  let start = 0;
  let sign = 1;
  for (let i = 0; i <= text.length; i++) {
    const ch = text[i];
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    const atOp =
      depth === 0 &&
      (ch === "+" || ch === "-") &&
      i > 0 &&
      /\s/.test(text[i - 1]) &&
      /\s/.test(text[i + 1] ?? "");
    if (i === text.length || atOp) {
      const product = evalProduct(text.slice(start, i));
      if (!product) return null;
      product.value *= sign;
      terms.push(product);
      sign = ch === "-" ? -1 : 1;
      start = i + 1;
    }
  }
  return terms;
}

function simplifyCalcBody(body) {
  const terms = evalSum(body.trim());
  if (!terms) return null;
  let out = terms;
  if (terms.every((t) => t.unit === terms[0].unit)) {
    out = [
      { value: terms.reduce((a, t) => a + t.value, 0), unit: terms[0].unit },
    ];
  } else if (terms.length === 2 && terms[1].unit === "%") {
    out = [terms[1], terms[0]];
  }
  let str = "";
  out.forEach((t, i) => {
    const text = formatCalcNumber(Math.abs(t.value)) + t.unit;
    if (i === 0) str = (t.value < 0 ? "-" : "") + text;
    else str += (t.value < 0 ? " - " : " + ") + text;
  });
  return `calc(${str})`;
}

function simplifyCalc(v) {
  let out = "";
  let i = 0;
  while (i < v.length) {
    const at = v.toLowerCase().indexOf("calc(", i);
    if (at === -1) {
      out += v.slice(i);
      break;
    }
    out += v.slice(i, at);
    let depth = 0;
    let j = at + 4;
    for (; j < v.length; j++) {
      if (v[j] === "(") depth++;
      else if (v[j] === ")" && --depth === 0) break;
    }
    const body = v.slice(at + 5, j);
    out +=
      simplifyCalcBody(body) ?? `calc(${body.trim().replace(/\s+/g, " ")})`;
    i = j + 1;
  }
  return out;
}

/** Normalizes a specified value; returns null when it would be rejected. */
export function normalizeValue(prop, value) {
  let v = value.trim();
  if (v === "") return "";
  if (prop.startsWith("--")) return v;
  const sensitive = CASE_SENSITIVE.has(prop);
  if (KEYWORD_RE.test(v)) {
    if (!sensitive) v = v.toLowerCase();
  } else if (!sensitive) {
    v = mapOutsideStrings(v, UNIT_RE, (_, d, unit) => d + unit.toLowerCase());
  }
  if (v.includes("#"))
    v = mapOutsideStrings(v, HEX_RE, (_, hex) => hexToRgb(hex));
  if (v.includes("calc(")) v = simplifyCalc(v);
  if (LENGTH_PROPS.has(prop)) {
    v = v.replace(ZERO_RE, "$10px");
    // A bare non-zero number is not a length.
    if (/^-?\d*\.?\d+$/.test(v)) return null;
  }
  if (prop === "flex") {
    if (/^\d*\.?\d+$/.test(v)) return `${v} 1 0%`;
    if (v === "auto") return "1 1 auto";
    if (v === "none") return "0 0 auto";
  }
  return v;
}

/** Computed-value transforms on top of the specified value. */
function computeValue(prop, v) {
  if (prop.startsWith("--") || v === "") return v;
  let out = v;
  if (!CASE_SENSITIVE.has(prop)) {
    out = mapOutsideStrings(out, /\b([a-z]+)\b/g, (word) => {
      if (word === "transparent") return "rgba(0, 0, 0, 0)";
      const hex = COLORS.get(word);
      return hex && isColorish(prop) ? hexToRgb(hex) : word;
    });
  }
  // jsdom resolves rem only on these lengths (not logical/2-axis shorthands).
  if (LENGTH_PROPS.has(prop) && !UNRESOLVED_LENGTHS.has(prop)) {
    out = mapOutsideStrings(
      out,
      /(-?\d*\.?\d+)rem\b/g,
      (_, n) => `${trimNumber(Number.parseFloat(n) * 16)}px`,
    );
  }
  return out;
}

const UNRESOLVED_LENGTHS = new Set([
  "margin-block",
  "margin-inline",
  "padding-block",
  "padding-inline",
  "gap",
  "grid-gap",
  "border-radius",
  "inset",
  "inset-block",
  "inset-inline",
]);

function trimNumber(n) {
  return String(Math.round(n * 1000) / 1000);
}

function isColorish(prop) {
  return (
    prop === "color" ||
    prop.endsWith("-color") ||
    prop === "background" ||
    prop.startsWith("border") ||
    prop.startsWith("outline") ||
    prop === "fill" ||
    prop === "stroke" ||
    prop === "box-shadow" ||
    prop === "text-shadow" ||
    prop === "text-decoration" ||
    prop === "column-rule"
  );
}

// --- Shorthands (read side only) -------------------------------------------------

const BOX = { top: 0, right: 1, bottom: 2, left: 3 };
const SHORTHAND_OF = new Map();
for (const base of ["margin", "padding"]) {
  for (const side of Object.keys(BOX))
    SHORTHAND_OF.set(`${base}-${side}`, [base, BOX[side]]);
}
for (const side of Object.keys(BOX))
  SHORTHAND_OF.set(side, ["inset", BOX[side]]);
SHORTHAND_OF.set("overflow-x", ["overflow", 0, "pair"]);
SHORTHAND_OF.set("overflow-y", ["overflow", 1, "pair"]);
SHORTHAND_OF.set("row-gap", ["gap", 0, "pair"]);
SHORTHAND_OF.set("column-gap", ["gap", 1, "pair"]);

function splitTopLevel(v) {
  const out = [];
  let depth = 0;
  let cur = "";
  for (const ch of v) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (depth === 0 && /\s/.test(ch)) {
      if (cur) out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  if (cur) out.push(cur);
  return out;
}

function fromShorthand(value, index, kind) {
  const parts = splitTopLevel(value);
  if (kind === "pair") return parts[index] ?? parts[0] ?? "";
  // 1-4 value box shorthand.
  const [a, b = a, c = a, d = b] = parts;
  return [a, b, c, d][index] ?? "";
}

// --- CSSStyleDeclaration ----------------------------------------------------------

function parseDeclarations(text) {
  const decls = new Map();
  if (!text) return decls;
  // Split on semicolons outside parentheses/strings.
  let depth = 0;
  let quote = null;
  let start = 0;
  const parts = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      if (ch === "\\") i++;
      else if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === "(") depth++;
    else if (ch === ")") depth--;
    else if (ch === ";" && depth === 0) {
      parts.push(text.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(text.slice(start));
  for (const part of parts) {
    const colon = part.indexOf(":");
    if (colon === -1) continue;
    let name = part.slice(0, colon).trim();
    if (!name) continue;
    if (!name.startsWith("--")) name = name.toLowerCase();
    let raw = part.slice(colon + 1);
    let important = false;
    const m = /!\s*important\s*$/i.exec(raw);
    if (m) {
      important = true;
      raw = raw.slice(0, m.index);
    }
    const value = normalizeValue(name, raw);
    if (value === null || value === "") continue;
    decls.delete(name);
    decls.set(name, { value, important });
  }
  return decls;
}

function serializeDeclarations(decls) {
  let out = "";
  for (const [name, { value, important }] of decls) {
    out +=
      (out ? " " : "") +
      name +
      ": " +
      value +
      (important ? " !important;" : ";");
  }
  return out;
}

export class CSSStyleDeclaration {
  constructor(token, owner = null) {
    if (token !== INTERNAL) illegalConstructor();
    this._owner = owner;
    this._decls = null;
    this._parsedFrom = null;
    this._computedFor = null;
    this._pseudo = null;
    this._indexed = 0;
  }

  /** Current declarations, re-parsed if the style attribute changed. */
  _map() {
    const owner = this._owner;
    if (owner) {
      const text = owner._getAttrRaw("style");
      if (this._decls === null || text !== this._parsedFrom) {
        this._decls = parseDeclarations(text ?? "");
        this._parsedFrom = text;
        this._syncIndices();
      }
    } else if (this._decls === null) {
      this._decls = new Map();
    }
    return this._decls;
  }

  _syncIndices() {
    const names = [...this._decls.keys()];
    for (let i = 0; i < names.length; i++) {
      Object.defineProperty(this, i, {
        value: names[i],
        configurable: true,
        enumerable: true,
      });
    }
    for (let i = names.length; i < this._indexed; i++) delete this[i];
    this._indexed = names.length;
  }

  _commit() {
    this._syncIndices();
    const owner = this._owner;
    if (!owner) return;
    const text = serializeDeclarations(this._decls);
    this._parsedFrom = text;
    owner._setAttrFromStyle(text);
  }

  _readonlyCheck() {
    if (this._computedFor) {
      throw new DOMException(
        "Failed to execute on 'CSSStyleDeclaration': These styles are computed, and therefore read-only.",
        "NoModificationAllowedError",
      );
    }
  }

  get cssText() {
    if (this._computedFor) return "";
    return serializeDeclarations(this._map());
  }
  set cssText(v) {
    this._readonlyCheck();
    this._decls = parseDeclarations(v === null ? "" : str(v));
    this._commit();
  }
  get length() {
    return this._computedFor ? 0 : this._map().size;
  }
  item(index) {
    if (this._computedFor) return "";
    const names = [...this._map().keys()];
    return names[index >>> 0] ?? "";
  }
  get parentRule() {
    return null;
  }

  getPropertyValue(property) {
    const name = normalizeName(property);
    if (this._computedFor)
      return computedProperty(this._computedFor, name, this._pseudo);
    return specifiedProperty(this._map(), name);
  }

  getPropertyPriority(property) {
    if (this._computedFor) return "";
    return this._map().get(normalizeName(property))?.important
      ? "important"
      : "";
  }

  setProperty(property, value, priority = "") {
    this._readonlyCheck();
    const name = normalizeName(property);
    if (value === null || value === undefined || str(value) === "") {
      this.removeProperty(name);
      return;
    }
    const normalized = normalizeValue(name, str(value));
    if (normalized === null || normalized === "") return;
    const p = str(priority).toLowerCase();
    if (p !== "" && p !== "important") return;
    const decls = this._map();
    const important = p === "important";
    const existing = decls.get(name);
    if (existing) {
      if (existing.value === normalized && existing.important === important)
        return;
      existing.value = normalized;
      existing.important = important;
    } else {
      decls.set(name, { value: normalized, important });
    }
    this._commit();
  }

  removeProperty(property) {
    this._readonlyCheck();
    const name = normalizeName(property);
    const decls = this._map();
    const old = specifiedProperty(decls, name);
    if (decls.delete(name)) this._commit();
    return old;
  }
}
tag(CSSStyleDeclaration);

function normalizeName(property) {
  const p = str(property);
  return p.startsWith("--") ? p : p.toLowerCase();
}

function specifiedProperty(decls, name) {
  const d = decls.get(name);
  if (d) return d.value;
  const sh = SHORTHAND_OF.get(name);
  if (sh) {
    const base = decls.get(sh[0]);
    if (base) return fromShorthand(base.value, sh[1], sh[2]);
  }
  return "";
}

// Accessors for every known property, in both camelCase and dashed form.
function defineAccessor(key, name) {
  if (Object.hasOwn(CSSStyleDeclaration.prototype, key)) return;
  Object.defineProperty(CSSStyleDeclaration.prototype, key, {
    get() {
      return this.getPropertyValue(name);
    },
    set(v) {
      this.setProperty(name, v);
    },
    configurable: true,
    enumerable: true,
  });
}
for (const name of PROPERTIES) {
  defineAccessor(name, name);
  defineAccessor(camel(name), name);
  if (name.startsWith("-webkit-"))
    defineAccessor("webkit" + camel(name.slice(7)), name);
}
defineAccessor("cssFloat", "float");

// --- Computed style -----------------------------------------------------------

const INHERITED = new Set(
  `color visibility pointer-events cursor font font-family font-size font-style font-variant font-weight
line-height letter-spacing word-spacing text-align text-indent text-transform white-space direction
list-style list-style-type list-style-position quotes caret-color fill stroke fill-opacity stroke-opacity
stroke-width writing-mode text-shadow word-break overflow-wrap hyphens tab-size user-select
-webkit-user-select`
    .split(/\s+/)
    .filter(Boolean),
);

const DISPLAY = new Map();
for (const n of `html body address blockquote center div figure figcaption footer form header hr legend
listing main p plaintext pre xmp search details summary article aside h1 h2 h3 h4 h5 h6 hgroup nav section
dir dd dl dt menu ol ul fieldset optgroup frameset dialog`.split(/\s+/)) {
  if (n) DISPLAY.set(n, "block");
}
for (const n of "head script style title meta link base template noscript datalist param area".split(
  " ",
)) {
  DISPLAY.set(n, "none");
}
for (const n of "input button select textarea meter progress marquee".split(
  " ",
))
  DISPLAY.set(n, "inline-block");
DISPLAY.set("li", "list-item");
DISPLAY.set("table", "table");
DISPLAY.set("caption", "table-caption");
DISPLAY.set("colgroup", "table-column-group");
DISPLAY.set("col", "table-column");
DISPLAY.set("thead", "table-header-group");
DISPLAY.set("tbody", "table-row-group");
DISPLAY.set("tfoot", "table-footer-group");
DISPLAY.set("tr", "table-row");
DISPLAY.set("td", "table-cell");
DISPLAY.set("th", "table-cell");
DISPLAY.set("ruby", "ruby");
DISPLAY.set("rt", "ruby-text");
DISPLAY.set("slot", "contents");

// Computed defaults as jsdom reports them (not always the CSS initial value).
const INITIAL = {
  width: "auto",
  height: "auto",
  top: "auto",
  right: "auto",
  bottom: "auto",
  left: "auto",
  "z-index": "auto",
  position: "static",
  float: "none",
  clear: "none",
  "overflow-x": "visible",
  "overflow-y": "visible",
  opacity: "1",
  transform: "none",
  visibility: "visible",
  "pointer-events": "auto",
  color: "rgb(0, 0, 0)",
  "background-color": "rgba(0, 0, 0, 0)",
  "font-size": "16px",
  "font-style": "normal",
  "font-weight": "normal",
  "line-height": "normal",
  "letter-spacing": "normal",
  cursor: "auto",
  "box-sizing": "content-box",
  content: "normal",
  margin: "0",
  "margin-top": "0",
  "margin-right": "0",
  "margin-bottom": "0",
  "margin-left": "0",
  padding: "0",
  "padding-top": "0",
  "padding-right": "0",
  "padding-bottom": "0",
  "padding-left": "0",
  "min-width": "auto",
  "min-height": "auto",
  "max-width": "none",
  "max-height": "none",
  "flex-direction": "row",
  "flex-wrap": "nowrap",
  "flex-grow": "0",
  "flex-shrink": "1",
  "flex-basis": "auto",
  "justify-content": "normal",
  "align-items": "normal",
  "table-layout": "auto",
  direction: "ltr",
  "user-select": "auto",
  "text-transform": "none",
  "outline-style": "none",
  "border-top-style": "none",
  "border-right-style": "none",
  "border-bottom-style": "none",
  "border-left-style": "none",
  "list-style-type": "disc",
  resize: "none",
  "animation-name": "none",
  "object-fit": "fill",
  order: "0",
};

function defaultDisplay(el) {
  if (el._ns !== HTML_NS)
    return el._localName === "svg" || el._ns === null ? "inline" : "inline";
  const name = el._localName;
  if (name === "input" && el.getAttribute("type")?.toLowerCase() === "hidden")
    return "none";
  if (name === "dialog" && !el.hasAttribute("open")) return "none";
  return DISPLAY.get(name) ?? "inline";
}

/** Matching declarations from <style> sheets, lowest priority first. */
function sheetDeclarations(el) {
  const doc = el._doc;
  const sheets = doc._styleSheets?.();
  if (!sheets || sheets.length === 0) return null;
  const matched = [];
  let order = 0;
  for (const sheet of sheets) {
    for (const rule of sheet._rules()) {
      order++;
      for (const sel of rule.selectors) {
        let compiled;
        try {
          compiled = compile(sel.text);
        } catch {
          continue;
        }
        if (matchesSelector(el, compiled, null)) {
          matched.push({
            specificity: sel.specificity,
            order,
            decls: rule.decls,
          });
          break;
        }
      }
    }
  }
  if (matched.length === 0) return null;
  matched.sort((a, b) => a.specificity - b.specificity || a.order - b.order);
  const out = new Map();
  const important = new Map();
  for (const m of matched) {
    for (const [k, d] of m.decls)
      (d.important ? important : out).set(k, d.value);
  }
  for (const [k, v] of important) out.set(k, v);
  return { normal: out, important };
}

function cascadedValue(el, name) {
  const inline =
    el._style?._map() ?? (el._getAttrRaw("style") ? el.style._map() : null);
  const fromSheets = sheetDeclarations(el);
  const sheetImportant = fromSheets?.important;
  if (sheetImportant?.has(name)) {
    const inl = inline?.get(name);
    if (!inl?.important) return sheetImportant.get(name);
  }
  if (inline) {
    const v = specifiedProperty(inline, name);
    if (v) return v;
  }
  if (fromSheets) {
    const v = fromSheets.normal.get(name);
    if (v) return v;
    const sh = SHORTHAND_OF.get(name);
    if (sh) {
      const base = fromSheets.normal.get(sh[0]);
      if (base) return fromShorthand(base, sh[1], sh[2]);
    }
  }
  return "";
}

const KEYWORDS = new Set([
  "inherit",
  "initial",
  "unset",
  "revert",
  "revert-layer",
]);

export function computedProperty(el, name, pseudo) {
  if (pseudo) {
    if (name === "content") return "normal";
    if (name === "display") return "block";
    return INITIAL[name] ?? "";
  }
  let v = cascadedValue(el, name);
  const inherits = INHERITED.has(name) || name.startsWith("--");
  if (v === "inherit" || ((v === "" || v === "unset") && inherits)) {
    const parent = el._parent;
    if (parent && parent.nodeType === 1)
      return computedProperty(parent, name, null);
    v = "";
  }
  if (KEYWORDS.has(v)) v = "";
  if (name === "display") {
    if (el.hasAttribute("hidden") && el._ns === HTML_NS && v === "")
      return "none";
    return v || defaultDisplay(el);
  }
  if (v === "") return INITIAL[name] ?? "";
  return computeValue(name, v);
}

export function getComputedStyle(el, pseudo) {
  if (el?.nodeType !== 1) {
    throw new TypeError(
      "Failed to execute 'getComputedStyle' on 'Window': parameter 1 is not of type 'Element'.",
    );
  }
  const decl = new CSSStyleDeclaration(INTERNAL, null);
  decl._computedFor = el;
  decl._pseudo = pseudo ? str(pseudo) : null;
  return decl;
}

// --- Style sheets (for <style> elements) ------------------------------------------

function specificityOf(selector) {
  // Rough a-b-c specificity, packed into one number.
  const s = selector
    .replace(/"[^"]*"|'[^']*'/g, "")
    .replace(/:(not|is|has)\(/g, "(");
  const ids = (s.match(/#[\w-]+/g) ?? []).length;
  const classes = (s.match(/\.[\w-]+|\[[^\]]*\]|:(?!:)[\w-]+/g) ?? []).length;
  const types = (s.match(/(^|[\s>+~(])[a-zA-Z][\w-]*/g) ?? []).length;
  return ids * 10000 + classes * 100 + types;
}

/** Parses top-level style rules; @media blocks are flattened, other at-rules skipped. */
export function parseStyleSheet(text) {
  const rules = [];
  const src = text.replace(/\/\*[\s\S]*?\*\//g, "");
  let i = 0;
  const parseBlock = (end) => {
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
      if (
        prelude.startsWith("@media") ||
        prelude.startsWith("@supports") ||
        prelude.startsWith("@layer")
      ) {
        const save = i;
        i = open + 1;
        parseBlock(j - 1);
        i = Math.max(j, save);
        continue;
      }
      if (!prelude.startsWith("@")) {
        const decls = parseDeclarations(src.slice(open + 1, j - 1));
        const selectors = prelude
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((s) => ({ text: s, specificity: specificityOf(s) }));
        rules.push({ selectors, decls });
      }
      i = j;
    }
  };
  parseBlock(src.length);
  return rules;
}
