// @ts-check
// WCAG 2 relative luminance and contrast ratio for hex colors.

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * Parse a `#rgb` or `#rrggbb` color into channels from 0 to 1. Returns
 * `null` for any other value. A translucent color has no contrast until
 * you know what is behind it, so alpha forms are not accepted.
 * @param {string} color
 * @returns {[number, number, number] | null}
 */
export function parseHex(color) {
  if (typeof color !== "string" || !HEX.test(color)) return null;
  const digits =
    color.length === 4
      ? color
          .slice(1)
          .split("")
          .map((digit) => digit + digit)
      : [color.slice(1, 3), color.slice(3, 5), color.slice(5, 7)];
  return /** @type {[number, number, number]} */ (
    digits.map((pair) => Number.parseInt(pair, 16) / 255)
  );
}

/**
 * Format channels from 0 to 1 as a lowercase `#rrggbb` color.
 * @param {[number, number, number]} rgb
 * @returns {string}
 */
export function toHex(rgb) {
  return `#${rgb
    .map((channel) =>
      Math.round(Math.min(1, Math.max(0, channel)) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

/**
 * WCAG relative luminance of sRGB channels from 0 to 1.
 * @param {[number, number, number]} rgb
 * @returns {number}
 */
export function relativeLuminance(rgb) {
  const [r, g, b] = rgb.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * WCAG contrast ratio of two hex colors, from 1 to 21. Returns `null` when
 * either color is not `#rgb` or `#rrggbb`.
 * @param {string} a
 * @param {string} b
 * @returns {number | null}
 */
export function contrastRatio(a, b) {
  const rgbA = parseHex(a);
  const rgbB = parseHex(b);
  if (!rgbA || !rgbB) return null;
  const [hi, lo] = [relativeLuminance(rgbA), relativeLuminance(rgbB)].sort(
    (x, y) => y - x,
  );
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Move a `#rrggbb` color toward black or white until it reads against a
 * background, as a terminal's minimum contrast ratio does.
 *
 * @param {string} color
 * @param {number} backgroundLuminance WCAG relative luminance of the
 * background, from 0 to 1.
 * @param {number} [minRatio=4.5]
 * @returns {string} `color` when it already reads, otherwise the nearest
 * lighter (on a dark background) or darker (on a light one) shade that does.
 * Anything that is not `#rrggbb` is returned as is.
 */
export function ensureContrast(color, backgroundLuminance, minRatio = 4.5) {
  const rgb = parseHex(color);
  if (!rgb) return color;

  /** @param {number} luminance */
  const ratio = (luminance) => {
    const [hi, lo] =
      luminance > backgroundLuminance
        ? [luminance, backgroundLuminance]
        : [backgroundLuminance, luminance];
    return (hi + 0.05) / (lo + 0.05);
  };
  if (ratio(relativeLuminance(rgb)) >= minRatio) return color;

  const target = backgroundLuminance < 0.18 ? 1 : 0;

  // The hex a step lands on, rounded to 8 bits, since that is what is drawn.
  /** @param {number} t */
  const mix = (t) =>
    toHex(
      /** @type {[number, number, number]} */ (
        rgb.map((channel) => channel + (target - channel) * t)
      ),
    );
  /** @param {string} hex */
  const reads = (hex) =>
    ratio(
      relativeLuminance(
        /** @type {[number, number, number]} */ (parseHex(hex)),
      ),
    ) >= minRatio;

  // Binary search for the smallest step that reads, so the hue survives.
  let low = 0;
  let high = 1;
  for (let step = 0; step < 12; step++) {
    const mid = (low + high) / 2;
    if (reads(mix(mid))) high = mid;
    else low = mid;
  }
  return mix(high);
}
