// @ts-check
// Zero-dependency color math for the theme builder: parse a CSS color, convert
// to and from OKLCH, and measure WCAG 2 contrast and APCA lightness contrast.

/**
 * @typedef {{ r: number; g: number; b: number; a: number }} Rgba Channels
 * from 0 to 1.
 * @typedef {{ l: number; c: number; h: number }} Oklch Lightness from 0 to 1,
 * chroma from 0 to about 0.4, hue in degrees.
 */

const HEX = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const FUNC = /^rgba?\(\s*([^)]+?)\s*\)$/i;
const SEP = /[\s,/]+/;

/** @param {number} n */
const clamp01 = (n) => Math.min(1, Math.max(0, n));

/** @param {string} part */
function channel(part) {
  const n = Number.parseFloat(part);
  return part.endsWith("%") ? n / 100 : n / 255;
}

/** @param {string} part */
function alphaOf(part) {
  const n = Number.parseFloat(part);
  return part.endsWith("%") ? n / 100 : n;
}

/**
 * Parse `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb()` and `rgba()`.
 * Returns `null` for anything else (named colors, `var()`, gradients).
 * @param {string} value
 * @returns {Rgba | null}
 */
export function parseColor(value) {
  if (typeof value !== "string") return null;
  const text = value.trim();
  const hex = HEX.exec(text)?.[1];
  if (hex) {
    const full =
      hex.length <= 4 ? [...hex].map((digit) => digit + digit).join("") : hex;
    const byte = (/** @type {number} */ i) =>
      Number.parseInt(full.slice(i, i + 2), 16) / 255;
    return {
      r: byte(0),
      g: byte(2),
      b: byte(4),
      a: full.length === 8 ? byte(6) : 1,
    };
  }
  const body = FUNC.exec(text)?.[1];
  if (!body) return null;
  const parts = body.split(SEP).filter(Boolean);
  if (parts.length < 3 || parts.length > 4) return null;
  const [r, g, b] = parts.slice(0, 3).map(channel);
  const a = parts[3] === undefined ? 1 : alphaOf(parts[3]);
  if ([r, g, b, a].some((n) => Number.isNaN(n))) return null;
  return { r: clamp01(r), g: clamp01(g), b: clamp01(b), a: clamp01(a) };
}

/**
 * Format as `#rrggbb`, or `#rrggbbaa` when translucent.
 * @param {Rgba} color
 */
export function formatHex({ r, g, b, a }) {
  /** @param {number} n */
  const byte = (n) =>
    Math.round(clamp01(n) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${byte(r)}${byte(g)}${byte(b)}${a < 1 ? byte(a) : ""}`;
}

/** @param {number} c */
const toLinear = (c) =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
/** @param {number} c */
const toGamma = (c) =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;

/**
 * @param {Rgba} color
 * @returns {Oklch}
 */
export function toOklch({ r, g, b }) {
  const lr = toLinear(r);
  const lg = toLinear(g);
  const lb = toLinear(b);
  const l = Math.cbrt(
    0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb,
  );
  const m = Math.cbrt(
    0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb,
  );
  const s = Math.cbrt(
    0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb,
  );
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const c = Math.hypot(A, B);
  // Below this chroma the color is neutral and its hue is noise.
  if (c < 1e-4) return { l: L, c: 0, h: 0 };
  return { l: L, c, h: ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360 };
}

/**
 * Unclamped linear channels of an OKLCH color.
 * @param {Oklch} color
 * @returns {[number, number, number]}
 */
function toLinearRgb({ l: L, c, h }) {
  const A = c * Math.cos((h * Math.PI) / 180);
  const B = c * Math.sin((h * Math.PI) / 180);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

/** @param {[number, number, number]} rgb */
const inGamut = (rgb) => rgb.every((n) => n >= -1e-4 && n <= 1 + 1e-4);

/**
 * Convert to sRGB. A color outside the gamut loses chroma, not lightness or
 * hue, until it fits.
 * @param {Oklch} color
 * @returns {Rgba}
 */
export function fromOklch(color) {
  const l = clamp01(color.l);
  let c = Math.max(0, color.c);
  if (l >= 1 || l <= 0) c = 0;
  let rgb = toLinearRgb({ l, c, h: color.h });
  if (!inGamut(rgb)) {
    let lo = 0;
    let hi = c;
    for (let i = 0; i < 20; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(toLinearRgb({ l, c: mid, h: color.h }))) lo = mid;
      else hi = mid;
    }
    rgb = toLinearRgb({ l, c: lo, h: color.h });
  }
  const [r, g, b] = rgb.map((n) => toGamma(clamp01(n)));
  return { r, g, b, a: 1 };
}

/**
 * Distance in OKLab, scaled by 100. About 2 is the smallest difference most
 * people can see.
 * @param {Rgba} a
 * @param {Rgba} b
 */
export function deltaE(a, b) {
  /** @param {Rgba} color */
  const lab = (color) => {
    const { l, c, h } = toOklch(color);
    return [
      l,
      c * Math.cos((h * Math.PI) / 180),
      c * Math.sin((h * Math.PI) / 180),
    ];
  };
  const [l1, a1, b1] = lab(a);
  const [l2, a2, b2] = lab(b);
  return 100 * Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

/**
 * Put a translucent color over an opaque one.
 * @param {Rgba} top
 * @param {Rgba} bottom
 * @returns {Rgba}
 */
export function composite(top, bottom) {
  const a = top.a;
  return {
    r: top.r * a + bottom.r * (1 - a),
    g: top.g * a + bottom.g * (1 - a),
    b: top.b * a + bottom.b * (1 - a),
    a: 1,
  };
}

const WHITE = { r: 1, g: 1, b: 1, a: 1 };

/**
 * Resolve a pair to opaque colors: a translucent background goes over white,
 * a translucent foreground over the background.
 * @param {Rgba} fg
 * @param {Rgba} bg
 * @returns {[Rgba, Rgba]}
 */
function flatten(fg, bg) {
  const back = bg.a < 1 ? composite(bg, WHITE) : bg;
  return [fg.a < 1 ? composite(fg, back) : fg, back];
}

/**
 * WCAG 2 relative luminance.
 * @param {Rgba} color
 */
export function luminance({ r, g, b }) {
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * WCAG 2 contrast ratio, from 1 to 21.
 * @param {Rgba} fg
 * @param {Rgba} bg
 */
export function contrast(fg, bg) {
  const [front, back] = flatten(fg, bg);
  const [hi, lo] = [luminance(front), luminance(back)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** @param {Rgba} color */
function apcaY({ r, g, b }) {
  const y = 0.2126729 * r ** 2.4 + 0.7151522 * g ** 2.4 + 0.072175 * b ** 2.4;
  // biome-ignore lint/suspicious/noApproximativeNumericConstant: the APCA exponent, not the square root of 2.
  return y >= 0.022 ? y : y + (0.022 - y) ** 1.414;
}

/**
 * APCA lightness contrast Lc of text on a background (APCA-W3 0.0.98G), from
 * about -108 (light text on dark) to 106 (dark text on light). Advisory:
 * WCAG 2 is still the conformance baseline.
 * @param {Rgba} fg
 * @param {Rgba} bg
 */
export function apca(fg, bg) {
  const [front, back] = flatten(fg, bg);
  const yTxt = apcaY(front);
  const yBg = apcaY(back);
  if (Math.abs(yBg - yTxt) < 0.0005) return 0;
  if (yBg > yTxt) {
    const sapc = (yBg ** 0.56 - yTxt ** 0.57) * 1.14;
    return sapc < 0.1 ? 0 : (sapc - 0.027) * 100;
  }
  const sapc = (yBg ** 0.65 - yTxt ** 0.62) * 1.14;
  return sapc > -0.1 ? 0 : (sapc + 0.027) * 100;
}
