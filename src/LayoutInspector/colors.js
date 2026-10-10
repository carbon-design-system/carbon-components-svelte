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
 * The background actually behind `el`: its own and its ancestors'
 * background colors, composited from the first opaque one up, over white.
 * `source` is the element whose background is nearest; `image` is true if
 * a background image or gradient sits in between, which this cannot see,
 * so the result is unreliable.
 * @param {Element} el
 * @returns {{ color: Rgba; own: Rgba | null; source: Element | null; image: boolean }}
 */
export function effectiveBackground(el) {
  /** @type {Rgba[]} */
  const layers = [];
  /** @type {Element | null} */
  let source = null;
  let image = false;
  /** @type {Element | null} */
  let node = el;
  while (node) {
    const style = getComputedStyle(node);
    if (style.backgroundImage !== "none") image = true;
    const color = toRgba(normalizeColor(style.backgroundColor));
    if (color && color[3] > 0) {
      if (!source) source = node;
      layers.push(color);
      if (color[3] >= 1) break;
    }
    node = node.parentElement;
  }
  /** @type {Rgba} */
  let base = [255, 255, 255, 1];
  for (let i = layers.length - 1; i >= 0; i--) base = blend(layers[i], base);
  return { color: base, own: layers[0] ?? null, source, image };
}

/**
 * WCAG contrast check for the text of `el`. Large text (24px, or 18.66px
 * bold) needs 3:1 for AA and 4.5:1 for AAA; other text 4.5:1 and 7:1.
 * @param {Element} el
 */
export function textContrast(el) {
  const style = getComputedStyle(el);
  const bg = effectiveBackground(el);
  const fg = toRgba(normalizeColor(style.color)) ?? [0, 0, 0, 1];
  const ratio = contrastRatio(blend(fg, bg.color), bg.color);
  const size = Number.parseFloat(style.fontSize);
  const weight = Number.parseInt(style.fontWeight, 10) || 400;
  const large = size >= 24 || (size >= 18.66 && weight >= 700);
  return {
    ratio,
    aa: large ? 3 : 4.5,
    aaa: large ? 4.5 : 7,
    large,
    approximate: bg.image,
  };
}

/** @type {string[] | null} */
let tokenNames = null;

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
 * Map from normalized color to the Carbon token names that resolve to it
 * for `el`. Rebuilt only when the theme changes. Empty when the page has
 * no `--cds-*` custom properties, as with the single-theme CSS builds.
 * @param {Element} el
 */
function tokenMap(el) {
  if (!tokenNames) tokenNames = collectTokenNames();
  const style = getComputedStyle(el);
  const key = ["--cds-ui-background", "--cds-text-01", "--cds-interactive-01"]
    .map((n) => style.getPropertyValue(n).trim())
    .join("|");
  if (key === tokenCache.key) return tokenCache.map;
  /** @type {Map<string, string[]>} */
  const map = new Map();
  for (const name of tokenNames) {
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
  if (!tokenNames) tokenNames = collectTokenNames();
  return tokenNames.length > 0;
}

// Token name prefixes that fit each role, so a text color reads as
// `text-01` before `icon-01` or `ui-05`, which can share its value.
const ROLE_PREFIXES = {
  text: /^(text|link|icon|inverse-01|support|interactive|danger)/,
  background:
    /^(ui-0[12]|ui-background|background|layer|field|interactive|hover|active|selected|inverse-02|highlight|skeleton|overlay|disabled|button|danger)/,
  border: /^(ui-0[345]|border|interactive|focus|field|danger)/,
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
