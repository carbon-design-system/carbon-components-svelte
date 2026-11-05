// @ts-check

/**
 * Color helpers for LayoutInspector: normalizing CSS colors, naming them
 * with Carbon theme tokens, and WCAG contrast.
 * @typedef {[number, number, number, number]} Rgba
 * @typedef {"text" | "background" | "border"} ColorRole
 */

/** @type {CanvasRenderingContext2D | null | undefined} */
let ctx;

const SENTINEL = "#010203";

/**
 * Normalizes any CSS color to the canvas form: `#rrggbb` when opaque,
 * `rgba(r, g, b, a)` otherwise. Returns `null` for values that are not
 * colors, such as `1rem` or `var(--x)`.
 * @param {string} value
 * @returns {string | null}
 */
export function normalizeColor(value) {
  const v = value.trim();
  if (!v) return null;
  if (ctx === undefined) {
    ctx = document.createElement("canvas").getContext("2d");
  }
  if (!ctx) return null;
  ctx.fillStyle = SENTINEL;
  ctx.fillStyle = v;
  const out = String(ctx.fillStyle);
  if (out === SENTINEL && v.toLowerCase() !== SENTINEL) return null;
  return out;
}

/**
 * @param {string | null} normalized output of `normalizeColor`
 * @returns {Rgba | null}
 */
export function toRgba(normalized) {
  if (!normalized) return null;
  if (normalized.startsWith("#")) {
    const n = Number.parseInt(normalized.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
  }
  const parts = normalized.match(/[\d.]+/g)?.map(Number);
  if (!parts || parts.length < 3) return null;
  return [parts[0], parts[1], parts[2], parts[3] ?? 1];
}

/**
 * @param {Rgba} rgba
 */
export function toHex([r, g, b, a]) {
  const hex = `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;
  return a < 1 ? `${hex} ${Math.round(a * 100)}%` : hex;
}

/**
 * Composites `top` over an opaque `bottom`.
 * @param {Rgba} top
 * @param {Rgba} bottom
 * @returns {Rgba}
 */
export function blend(top, bottom) {
  const a = top[3];
  return [
    top[0] * a + bottom[0] * (1 - a),
    top[1] * a + bottom[1] * (1 - a),
    top[2] * a + bottom[2] * (1 - a),
    1,
  ];
}

/** @param {Rgba} rgba */
function luminance([r, g, b]) {
  const f = (/** @type {number} */ c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/**
 * WCAG 2 contrast ratio between two opaque colors.
 * @param {Rgba} a
 * @param {Rgba} b
 */
export function contrastRatio(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * @typedef {{ color: Rgba; own: Rgba | null; source: Element | null; image: boolean }} Background
 * @typedef {Map<Element, Background>} BackgroundCache
 */

/** Unscaled 2D transforms, such as `none` or a translate. */
const MATRIX = /^matrix\(([^,]+),([^,]+),([^,]+),([^,]+),/;

/**
 * Whether a pseudo-element shows at all. Components hide an unselected
 * fill with opacity, a zero scale, or a clip, and keep its color.
 * @param {CSSStyleDeclaration} style
 */
function paints(style) {
  if (style.display === "none" || style.visibility !== "visible") return false;
  if (Number.parseFloat(style.opacity) < 0.5) return false;
  if (style.clipPath !== "none") return false;
  const matrix = style.transform.replace(/\s/g, "").match(MATRIX);
  if (matrix) {
    const [a, b, c, d] = matrix.slice(1).map(Number);
    if (Math.hypot(a, b) < 0.5 || Math.hypot(c, d) < 0.5) return false;
  }
  return true;
}

/**
 * Background color of a `::before` or `::after` that covers `el`. Some
 * components paint their fill there, such as a selected
 * `ContentSwitcher` button, so the element's own background reads as
 * transparent.
 * @param {Element} el
 * @returns {Rgba | null}
 */
function pseudoBackground(el) {
  for (const pseudo of ["::before", "::after"]) {
    const style = getComputedStyle(el, pseudo);
    if (style.content === "none" || style.content === "normal") continue;
    if (!paints(style)) continue;
    const color = toRgba(normalizeColor(style.backgroundColor));
    if (!color || color[3] === 0) continue;
    // Measured against the padding box, which an `inset: 0` pseudo fills.
    if (
      Number.parseFloat(style.width) >= el.clientWidth - 1 &&
      Number.parseFloat(style.height) >= el.clientHeight - 1
    ) {
      return color;
    }
  }
  return null;
}

/** @type {Background} */
const PAGE = {
  color: [255, 255, 255, 1],
  own: null,
  source: null,
  image: false,
};

/**
 * The background actually behind `el`: its own and its ancestors'
 * background colors, composited from the first opaque one up, over white.
 * `source` is the element whose background is nearest; `image` is true if
 * a background image or gradient sits in between, which this cannot see,
 * so the result is unreliable. Pass one `cache` to a whole page scan, so
 * shared ancestors are read once.
 * @param {Element} el
 * @param {BackgroundCache} [cache]
 * @returns {Background}
 */
export function effectiveBackground(el, cache) {
  const hit = cache?.get(el);
  if (hit) return hit;
  const style = getComputedStyle(el);
  const image = style.backgroundImage !== "none";
  const color = toRgba(normalizeColor(style.backgroundColor));
  const box = color && color[3] > 0 ? color : null;
  const layer = pseudoBackground(el);
  /** @type {Rgba | null} */
  let own = box;
  if (layer) own = layer[3] >= 1 || !box ? layer : blend(layer, box);
  /** @type {Background} */
  let result;
  if (own && own[3] >= 1) {
    result = { color: own, own, source: el, image };
  } else {
    const below = el.parentElement
      ? effectiveBackground(el.parentElement, cache)
      : PAGE;
    result = {
      color: own ? blend(own, below.color) : below.color,
      own: own ?? below.own,
      source: own ? el : below.source,
      image: image || below.image,
    };
  }
  cache?.set(el, result);
  return result;
}

/**
 * WCAG contrast check for the text of `el`. Large text (24px, or 18.66px
 * bold) needs 3:1 for AA and 4.5:1 for AAA; other text 4.5:1 and 7:1.
 * `text` and `background` are the opaque colors compared, and `source` is
 * the element whose background is nearest.
 * @param {Element} el
 * @param {BackgroundCache} [cache]
 */
export function textContrast(el, cache) {
  const style = getComputedStyle(el);
  const bg = effectiveBackground(el, cache);
  const fg = toRgba(normalizeColor(style.color)) ?? [0, 0, 0, 1];
  const text = blend(fg, bg.color);
  const ratio = contrastRatio(text, bg.color);
  const size = Number.parseFloat(style.fontSize);
  const weight = Number.parseInt(style.fontWeight, 10) || 400;
  const large = size >= 24 || (size >= 18.66 && weight >= 700);
  return {
    ratio,
    aa: large ? 3 : 4.5,
    aaa: large ? 4.5 : 7,
    large,
    approximate: bg.image,
    text,
    background: bg.color,
    source: bg.source,
  };
}

/** @type {string[] | null} */
let tokenNames = null;
let sheetCount = -1;

/**
 * Every `--cds-*` custom property declared in the page's stylesheets.
 * Cross-origin sheets cannot be read and are skipped.
 */
function collectTokenNames() {
  /** @type {Set<string>} */
  const names = new Set();
  /** @param {CSSRuleList} rules */
  const walk = (rules) => {
    for (const rule of rules) {
      const style = /** @type {CSSStyleRule} */ (rule).style;
      if (style) {
        for (let i = 0; i < style.length; i++) {
          if (style[i].startsWith("--cds-")) names.add(style[i]);
        }
      }
      const nested = /** @type {CSSGroupingRule} */ (rule).cssRules;
      if (nested) walk(nested);
    }
  };
  for (const sheet of document.styleSheets) {
    try {
      walk(sheet.cssRules);
    } catch {
      // Cross-origin stylesheet.
    }
  }
  return [...names];
}

/** @type {{ key: string; map: Map<string, string[]> }} */
let tokenCache = { key: "", map: new Map() };

/**
 * Token names, collected again when a stylesheet is added or removed,
 * such as a theme loaded after the inspector opened.
 */
function currentTokenNames() {
  if (!tokenNames || document.styleSheets.length !== sheetCount) {
    sheetCount = document.styleSheets.length;
    tokenNames = collectTokenNames();
    tokenCache = { key: "", map: new Map() };
  }
  return tokenNames;
}

/**
 * Map from normalized color to the Carbon token names that resolve to it
 * for `el`. Rebuilt only when the theme changes. Empty when the page has
 * no `--cds-*` custom properties, as with the single-theme CSS builds.
 * @param {Element} el
 */
function tokenMap(el) {
  const names = currentTokenNames();
  const style = getComputedStyle(el);
  const key = ["--cds-background", "--cds-text-primary", "--cds-interactive"]
    .map((n) => style.getPropertyValue(n).trim())
    .join("|");
  if (key === tokenCache.key) return tokenCache.map;
  /** @type {Map<string, string[]>} */
  const map = new Map();
  for (const name of names) {
    const color = normalizeColor(style.getPropertyValue(name));
    if (!color) continue;
    const list = map.get(color);
    const short = name.slice("--cds-".length);
    if (list) list.push(short);
    else map.set(color, [short]);
  }
  tokenCache = { key, map };
  return map;
}

/** Whether the page has any theme tokens to name colors with. */
export function hasTokens() {
  return currentTokenNames().length > 0;
}

// Token name prefixes that fit each role, so a text color reads as
// `text-primary` before `icon-primary` or `border-inverse`, which can
// share its value.
const ROLE_PREFIXES = {
  text: /^(text|link|icon|support|interactive)/,
  background:
    /^(background|layer|field|highlight|overlay|skeleton|button|interactive|support|toggle|notification)/,
  border: /^(border|focus|interactive|support|field)/,
};

/**
 * Token names for `color` as used in `role`, best fit first.
 * @param {Element} el
 * @param {string} color any CSS color
 * @param {ColorRole} role
 */
export function colorTokens(el, color, role) {
  const normalized = normalizeColor(color);
  if (!normalized) return [];
  const names = tokenMap(el).get(normalized) ?? [];
  const fit = ROLE_PREFIXES[role];
  return [...names].sort((a, b) => Number(fit.test(b)) - Number(fit.test(a)));
}

// Theme tokens meant for text, for a contrast fix suggestion.
const TEXT_TOKEN = /^(text|link)-/;

/**
 * The text token that passes `needs` against `background` and is closest
 * to the current text color, or `null` when no theme token passes. Reads
 * the theme tokens that resolve for `el`.
 * @param {Element} el
 * @param {Rgba} text current text color
 * @param {Rgba} background opaque background
 * @param {number} needs contrast ratio to reach
 * @returns {{ token: string; hex: string; ratio: number } | null}
 */
export function suggestTextToken(el, text, background, needs) {
  /** @type {{ token: string; hex: string; ratio: number; distance: number } | null} */
  let best = null;
  for (const [color, names] of tokenMap(el)) {
    const name = names.find((n) => TEXT_TOKEN.test(n));
    if (!name) continue;
    const rgba = toRgba(color);
    if (!rgba || rgba[3] < 1) continue;
    const ratio = contrastRatio(rgba, background);
    if (ratio < needs) continue;
    const distance = Math.hypot(
      rgba[0] - text[0],
      rgba[1] - text[1],
      rgba[2] - text[2],
    );
    if (!best || distance < best.distance) {
      best = { token: name, hex: toHex(rgba), ratio, distance };
    }
  }
  return best
    ? {
        token: best.token,
        hex: best.hex,
        ratio: Math.floor(best.ratio * 100) / 100,
      }
    : null;
}
