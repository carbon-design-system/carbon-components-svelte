// Carbon token lookup for preview elements: which `--cds-*` custom property
// an element's colors come from, plus WCAG contrast math for the a11y channel.
// Exact when a matching CSS rule declares `var(--cds-…)` for the property;
// otherwise falls back to tokens whose current value equals the computed one.

const HEX = /^#([\da-f]{3,8})$/i;
const RGB =
  /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/i;
const TOKEN_VAR = /var\(\s*(--cds-[\w-]+)/;
const COLOR_PROPS = [
  ["color", "color"],
  ["background-color", "background"],
  ["border-bottom-color", "border"],
  ["fill", "fill"],
  ["outline-color", "outline"],
];

/** [r, g, b, a] from a hex or rgb()/rgba() string, or null. */
export function parseColor(value) {
  const text = String(value ?? "").trim();
  const hex = HEX.exec(text);
  if (hex) {
    let h = hex[1];
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join("");
    const n = Number.parseInt(h.slice(0, 6), 16);
    const a = h.length === 8 ? Number.parseInt(h.slice(6), 16) / 255 : 1;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, a];
  }
  const rgb = RGB.exec(text);
  if (rgb) {
    const alpha =
      rgb[4] === undefined
        ? 1
        : rgb[4].endsWith("%")
          ? Number.parseFloat(rgb[4]) / 100
          : Number(rgb[4]);
    return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3]), alpha];
  }
  if (text === "transparent") return [0, 0, 0, 0];
  return null;
}

export function colorKey(value) {
  const c = parseColor(value);
  return c && c[3] > 0
    ? `${c[0]},${c[1]},${c[2]},${Math.round(c[3] * 100)}`
    : null;
}

/** WCAG relative luminance. */
export function luminance([r, g, b]) {
  const channel = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(foreground, background) {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** Composite a translucent color over an opaque background. */
export function blend([r, g, b, a], [br, bg, bb]) {
  return [r * a + br * (1 - a), g * a + bg * (1 - a), b * a + bb * (1 - a), 1];
}

/** WCAG large text: ≥ 24px, or ≥ 18.66px and bold. */
export function isLargeText(fontSizePx, fontWeight) {
  return fontSizePx >= 24 || (fontSizePx >= 18.66 && Number(fontWeight) >= 700);
}

/**
 * @param {Document} doc
 */
export function createTokenIndex(doc) {
  let theme;
  /** @type {Map<string, string[]>} color key → token names */
  let byValue = new Map();
  /** @type {{ selector: string; prop: string; token: string }[]} */
  let declarations = [];
  const cache = new WeakMap();

  function rules(sheet) {
    try {
      return sheet.cssRules ? [...sheet.cssRules] : [];
    } catch {
      return []; // cross-origin sheet without CORS
    }
  }

  function walk(list, visit) {
    for (const rule of list) {
      if (rule.cssRules && !rule.selectorText) walk([...rule.cssRules], visit);
      else if (rule.style) visit(rule);
    }
  }

  function build() {
    theme = doc.documentElement.getAttribute("theme");
    const names = new Set();
    declarations = [];
    for (const sheet of doc.styleSheets) {
      walk(rules(sheet), (rule) => {
        for (const prop of rule.style) {
          if (prop.startsWith("--cds-")) names.add(prop);
        }
        for (const [prop] of COLOR_PROPS) {
          const value = rule.style.getPropertyValue(prop);
          const m = value && TOKEN_VAR.exec(value);
          if (m && rule.selectorText) {
            declarations.push({
              selector: rule.selectorText,
              prop,
              token: m[1],
            });
          }
        }
      });
    }
    const root = doc.defaultView.getComputedStyle(doc.documentElement);
    byValue = new Map();
    for (const name of names) {
      const key = colorKey(root.getPropertyValue(name));
      if (!key) continue;
      const list = byValue.get(key);
      if (list) list.push(name);
      else byValue.set(key, [name]);
    }
  }

  function ensure() {
    if (
      theme === undefined ||
      theme !== doc.documentElement.getAttribute("theme")
    )
      build();
  }

  /** Token per color property: exact from a matching rule, else candidates by value. */
  function tokensFor(element) {
    ensure();
    const cached = cache.get(element);
    if (cached && cached.theme === theme) return cached.result;
    const style = doc.defaultView.getComputedStyle(element);
    const result = {};
    for (const [prop, label] of COLOR_PROPS) {
      const value = style.getPropertyValue(prop);
      const key = colorKey(value);
      if (!key) continue;
      // Last matching rule whose token resolves (on this element, so theme
      // scopes count) to the color actually painted. That skips :hover and
      // other state rules that don't apply right now.
      let exact;
      for (const d of declarations) {
        if (d.prop !== prop) continue;
        try {
          if (!element.matches(d.selector)) continue;
        } catch {
          continue;
        }
        if (colorKey(style.getPropertyValue(d.token)) === key) exact = d.token;
      }
      const candidates = byValue.get(key) ?? [];
      const token = exact ?? (candidates[0] && `≈${candidates[0]}`);
      if (token)
        result[label] = { token, value, alternatives: candidates.length - 1 };
    }
    cache.set(element, { theme, result });
    return result;
  }

  return { tokensFor, invalidate: () => (theme = undefined) };
}
