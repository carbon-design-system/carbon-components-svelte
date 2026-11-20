// @ts-check
// Color math for ColorPicker: parsing and formatting CSS colors, the HSV,
// RGB and HSL models, a spoken name, and WCAG contrast with alpha.

import { relativeLuminance } from "./color-contrast.js";

/**
 * Red, green and blue from 0 to 255 (fractions allowed), alpha from 0 to 1.
 * @typedef {{ r: number; g: number; b: number; a: number }} Rgba
 */

/**
 * Hue in degrees from 0 to 360, saturation and value from 0 to 100, alpha
 * from 0 to 1.
 * @typedef {{ h: number; s: number; v: number; a: number }} Hsva
 */

/**
 * Hue in degrees from 0 to 360, saturation and lightness from 0 to 100,
 * alpha from 0 to 1.
 * @typedef {{ h: number; s: number; l: number; a: number }} Hsla
 */

/** @typedef {"hex" | "rgb" | "hsl"} ColorFormat */

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Wrap a hue into `[0, 360)`.
 * @param {number} hue
 * @returns {number}
 */
export function wrapHue(hue) {
  return ((hue % 360) + 360) % 360;
}

const HEX = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const FUNCTION = /^(rgba?|hsla?)\(\s*([^)]*?)\s*\)$/i;
const NUMBER = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/i;
const DOUBLED_DIGIT = /./g;
const SEPARATORS = /[\s,/]+/;

/**
 * Read one number from a function argument, with its unit.
 * @param {string} token
 * @returns {{ value: number; unit: string } | null}
 */
function readToken(token) {
  const match = NUMBER.exec(token);
  if (!match) return null;
  const unit = token.slice(match[0].length).toLowerCase();
  return { value: Number(match[0]), unit };
}

/**
 * @param {string} token
 * @returns {number | null} alpha from 0 to 1
 */
function readAlpha(token) {
  const parsed = readToken(token);
  if (!parsed || (parsed.unit !== "" && parsed.unit !== "%")) return null;
  return clamp(parsed.unit === "%" ? parsed.value / 100 : parsed.value, 0, 1);
}

/**
 * @param {string} token
 * @returns {number | null} hue in degrees
 */
function readHue(token) {
  const parsed = readToken(token);
  if (!parsed) return null;
  switch (parsed.unit) {
    case "":
    case "deg":
      return wrapHue(parsed.value);
    case "turn":
      return wrapHue(parsed.value * 360);
    case "grad":
      return wrapHue(parsed.value * 0.9);
    case "rad":
      return wrapHue((parsed.value * 180) / Math.PI);
    default:
      return null;
  }
}

/**
 * Parse a CSS color: `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb()`,
 * `rgba()`, `hsl()`, `hsla()` (comma or space separated, a percent or
 * number alpha) and `transparent`. Returns `null` for anything else,
 * including named colors, `var()` and the newer color spaces.
 *
 * @param {string} color
 * @returns {Rgba | null}
 */
export function parseColor(color) {
  if (typeof color !== "string") return null;
  const text = color.trim();
  if (text.toLowerCase() === "transparent") return { r: 0, g: 0, b: 0, a: 0 };

  const hex = HEX.exec(text);
  if (hex) {
    let digits = hex[1];
    if (digits.length <= 4) {
      digits = digits.replace(DOUBLED_DIGIT, (digit) => digit + digit);
    }
    const channel = (/** @type {number} */ index) =>
      Number.parseInt(digits.slice(index * 2, index * 2 + 2), 16);
    return {
      r: channel(0),
      g: channel(1),
      b: channel(2),
      a: digits.length === 8 ? channel(3) / 255 : 1,
    };
  }

  const fn = FUNCTION.exec(text);
  if (!fn) return null;
  const args = fn[2].split(SEPARATORS).filter(Boolean);
  if (args.length !== 3 && args.length !== 4) return null;
  const a = args.length === 4 ? readAlpha(args[3]) : 1;
  if (a === null) return null;

  if (fn[1].toLowerCase().startsWith("rgb")) {
    const channels = args.slice(0, 3).map((token) => {
      const parsed = readToken(token);
      if (!parsed || (parsed.unit !== "" && parsed.unit !== "%")) return null;
      return clamp(
        parsed.unit === "%" ? parsed.value * 2.55 : parsed.value,
        0,
        255,
      );
    });
    if (channels.includes(null)) return null;
    const [r, g, b] = /** @type {number[]} */ (channels);
    return { r, g, b, a };
  }

  const h = readHue(args[0]);
  const s = readToken(args[1]);
  const l = readToken(args[2]);
  if (
    h === null ||
    !s ||
    !l ||
    (s.unit !== "" && s.unit !== "%") ||
    (l.unit !== "" && l.unit !== "%")
  ) {
    return null;
  }
  return hslaToRgba({
    h,
    s: clamp(s.value, 0, 100),
    l: clamp(l.value, 0, 100),
    a,
  });
}

/**
 * @param {Hsva} hsva
 * @returns {Rgba}
 */
export function hsvaToRgba({ h, s, v, a }) {
  const saturation = clamp(s, 0, 100) / 100;
  const value = clamp(v, 0, 100) / 100;
  /** @type {(n: number) => number} */
  const channel = (n) => {
    const k = (n + wrapHue(h) / 60) % 6;
    return (
      255 * (value - value * saturation * Math.max(0, Math.min(k, 4 - k, 1)))
    );
  };
  return { r: channel(5), g: channel(3), b: channel(1), a };
}

/**
 * Convert to HSV. A gray has no hue, so `hue` (default `0`) is kept.
 *
 * @param {Rgba} rgba
 * @param {number} [hue]
 * @returns {Hsva}
 */
export function rgbaToHsva({ r, g, b, a }, hue = 0) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const delta = max - Math.min(red, green, blue);
  let h = hue;
  if (delta > 0) {
    if (max === red) h = ((green - blue) / delta) % 6;
    else if (max === green) h = (blue - red) / delta + 2;
    else h = (red - green) / delta + 4;
    h = wrapHue(h * 60);
  }
  return { h, s: max === 0 ? 0 : (delta / max) * 100, v: max * 100, a };
}

/**
 * @param {Hsva} hsva
 * @returns {Hsla}
 */
export function hsvaToHsla({ h, s, v, a }) {
  const value = v / 100;
  const l = value * (1 - s / 100 / 2);
  const saturation = l === 0 || l === 1 ? 0 : (value - l) / Math.min(l, 1 - l);
  return { h, s: saturation * 100, l: l * 100, a };
}

/**
 * @param {Hsla} hsla
 * @returns {Hsva}
 */
export function hslaToHsva({ h, s, l, a }) {
  const lightness = l / 100;
  const saturation = s / 100;
  const v = lightness + saturation * Math.min(lightness, 1 - lightness);
  return { h, s: v === 0 ? 0 : 2 * (1 - lightness / v) * 100, v: v * 100, a };
}

/**
 * @param {Hsla} hsla
 * @returns {Rgba}
 */
export function hslaToRgba(hsla) {
  return hsvaToRgba(hslaToHsva(hsla));
}

/**
 * @param {number} value
 * @returns {number} the channel as an integer from 0 to 255
 */
export function to8Bit(value) {
  return Math.round(clamp(value, 0, 255));
}

/**
 * Alpha as a number from 0 to 1 with at most two decimals.
 * @param {number} alpha
 * @returns {number}
 */
function roundAlpha(alpha) {
  return Math.round(clamp(alpha, 0, 1) * 100) / 100;
}

/**
 * Whether two colors are the same once stored as 8-bit channels, which is
 * the precision of `#rrggbbaa`.
 * @param {Rgba} a
 * @param {Rgba} b
 * @returns {boolean}
 */
export function sameColor(a, b) {
  return (
    to8Bit(a.r) === to8Bit(b.r) &&
    to8Bit(a.g) === to8Bit(b.g) &&
    to8Bit(a.b) === to8Bit(b.b) &&
    to8Bit(a.a * 255) === to8Bit(b.a * 255)
  );
}

/**
 * Format as `#rrggbb`, or `#rrggbbaa` when not opaque.
 * @param {Rgba} rgba
 * @returns {string}
 */
export function formatHex({ r, g, b, a }) {
  const channels = [r, g, b];
  if (to8Bit(a * 255) !== 255) channels.push(a * 255);
  return `#${channels.map((c) => to8Bit(c).toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Format as `rgb(r, g, b)`, or `rgba(r, g, b, a)` when not opaque.
 * @param {Rgba} rgba
 * @returns {string}
 */
export function formatRgb({ r, g, b, a }) {
  const channels = `${to8Bit(r)}, ${to8Bit(g)}, ${to8Bit(b)}`;
  return a >= 1 ? `rgb(${channels})` : `rgba(${channels}, ${roundAlpha(a)})`;
}

/**
 * Format as `hsl(h, s%, l%)`, or `hsla(h, s%, l%, a)` when not opaque.
 * The three numbers are rounded to whole numbers.
 * @param {Hsla} hsla
 * @returns {string}
 */
export function formatHsl({ h, s, l, a }) {
  const parts = `${Math.round(wrapHue(h)) % 360}, ${Math.round(s)}%, ${Math.round(l)}%`;
  return a >= 1 ? `hsl(${parts})` : `hsla(${parts}, ${roundAlpha(a)})`;
}

/**
 * Serialize a color as a CSS string in `format`. HSL reads the HSV model,
 * not the RGB it rounds to, so a gray keeps its hue.
 *
 * @param {Hsva} hsva
 * @param {ColorFormat} format
 * @returns {string}
 */
export function formatColor(hsva, format) {
  if (format === "hsl") return formatHsl(hsvaToHsla(hsva));
  const rgba = hsvaToRgba(hsva);
  return format === "rgb" ? formatRgb(rgba) : formatHex(rgba);
}

/**
 * Composite `top` over an opaque or translucent `bottom`.
 * @param {Rgba} top
 * @param {Rgba} bottom
 * @returns {Rgba}
 */
function compositeOver(top, bottom) {
  const a = top.a + bottom.a * (1 - top.a);
  if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
  /** @type {(x: number, y: number) => number} */
  const mix = (x, y) => (x * top.a + y * bottom.a * (1 - top.a)) / a;
  return {
    r: mix(top.r, bottom.r),
    g: mix(top.g, bottom.g),
    b: mix(top.b, bottom.b),
    a,
  };
}

const WHITE = { r: 255, g: 255, b: 255, a: 1 };

/**
 * @param {Rgba} rgba An opaque color.
 * @returns {number}
 */
function luminance({ r, g, b }) {
  return relativeLuminance([r / 255, g / 255, b / 255]);
}

/**
 * WCAG contrast ratio of `foreground` against `background`, from 1 to 21.
 * A translucent background is laid over white first, and a translucent
 * foreground over that, so the ratio is for what the eye gets.
 *
 * @param {Rgba} foreground
 * @param {Rgba} background
 * @returns {number}
 */
export function colorContrast(foreground, background) {
  const base = compositeOver(background, WHITE);
  const top = compositeOver(foreground, base);
  const [hi, lo] = [luminance(top), luminance(base)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Black or white, whichever reads better on `rgba` (laid over white when
 * translucent). For a mark drawn on a color.
 *
 * @param {Rgba} rgba
 * @returns {"black" | "white"}
 */
export function readableOn(rgba) {
  const base = luminance(compositeOver(rgba, WHITE));
  return (base + 0.05) / 0.05 > 1.05 / (base + 0.05) ? "black" : "white";
}

/**
 * Hue ranges by name, in degrees. A name starts at the number before it.
 * @type {ReadonlyArray<readonly [number, string]>}
 */
const HUE_NAMES = [
  [15, "red"],
  [45, "orange"],
  [70, "yellow"],
  [165, "green"],
  [195, "teal"],
  [255, "blue"],
  [300, "purple"],
  [330, "magenta"],
  [345, "pink"],
  [360, "red"],
];

/**
 * The English name of a hue: `"blue"`, `"teal"`.
 * @param {number} hue
 * @returns {string}
 */
export function describeHue(hue) {
  const wrapped = wrapHue(hue);
  return (HUE_NAMES.find(([end]) => wrapped < end) ?? HUE_NAMES[0])[1];
}

/**
 * A spoken English name for a color, such as `"dark teal"`, `"light grayish
 * blue"`, `"brown"` or `"white"`. It is coarse by design: a hue family, a
 * lightness step, and a note when the color is washed out. Alpha is not
 * part of the name.
 *
 * @param {Hsva} hsva
 * @returns {string}
 */
export function describeColor({ h, s, v }) {
  const { s: saturation, l: lightness } = hsvaToHsla({ h, s, v, a: 1 });
  const light =
    lightness < 15
      ? "very dark"
      : lightness < 35
        ? "dark"
        : lightness > 90
          ? "very light"
          : lightness > 65
            ? "light"
            : "";
  if (lightness < 6) return "black";
  if (lightness > 96) return "white";
  if (saturation < 8) return light ? `${light} gray` : "gray";
  const hue = describeHue(h);
  const name = hue === "orange" && lightness < 40 ? "brown" : hue;
  const tone = saturation < 30 ? "grayish" : "";
  return [light, tone, name].filter(Boolean).join(" ");
}
