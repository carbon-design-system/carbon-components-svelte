// @ts-check
// Parse ANSI escape sequences in log text into styled runs.
//
// Only SGR (`ESC [ ... m`) changes the style. Every other escape is dropped,
// since a log viewer has no cursor to move: CSI sequences of any final byte,
// OSC strings (terminated by BEL or ST), and two-character escapes.

import { parseHex, relativeLuminance, toHex } from "./color-contrast.js";

/**
 * A color: `0` to `15` is a position in the 16-color palette, which the
 * stylesheet themes. A `#rrggbb` string is a 256-color or truecolor value.
 * `"text"` and `"background"` are the page's own colors, which reverse video
 * swaps in for a color that was never set.
 * @typedef {number | string} AnsiColor
 */

/**
 * The SGR attributes in effect. An absent field is the terminal default.
 * @typedef {Object} AnsiStyle
 * @property {AnsiColor} [fg]
 * @property {AnsiColor} [bg]
 * @property {boolean} [bold]
 * @property {boolean} [dim]
 * @property {boolean} [italic]
 * @property {boolean} [underline]
 * @property {boolean} [strike]
 * @property {boolean} [inverse]
 */

/**
 * @typedef {Object} AnsiRun
 * @property {string} text
 * @property {AnsiStyle | null} style The run's style, with reverse video
 * already applied, or `null` for the default style.
 */

const ESC = "\u001b";

// One escape sequence. Group 1 holds the parameters of a CSI sequence and
// group 2 its final byte; an OSC string or a two-character escape matches
// without either, and is dropped.
const ESCAPE =
  // biome-ignore lint/suspicious/noControlCharactersInRegex: matches ESC.
  /\u001b\[([0-9:;?<=>]*)[ -/]*([@-~])|\u001b\][^\u0007\u001b]*(?:\u0007|\u001b\\)?|\u001b[ -/]*[0-~]/g;

const COLON_TRUECOLOR = /(^|;)([34]8):2::/g;
const PARAMETER_SEPARATOR = /[;:]/;

/**
 * Whether `text` may hold an escape sequence.
 * @param {string} text
 * @returns {boolean}
 */
export function hasAnsi(text) {
  return text.includes(ESC);
}

/**
 * `text` without its escape sequences.
 * @param {string} text
 * @returns {string}
 */
export function stripAnsi(text) {
  return hasAnsi(text) ? text.replace(ESCAPE, "") : text;
}

/**
 * The `#rrggbb` color of a position in the 256-color palette above the first
 * 16: the 6x6x6 cube from `16`, then 24 grays from `232`.
 * @param {number} index
 * @returns {string}
 */
function paletteToHex(index) {
  /** @param {number} level */
  const cube = (level) => (level === 0 ? 0 : 55 + 40 * level);
  if (index >= 232) {
    const gray = 8 + 10 * (index - 232);
    return toHex([gray / 255, gray / 255, gray / 255]);
  }
  const offset = index - 16;
  return toHex([
    cube(Math.floor(offset / 36)) / 255,
    cube(Math.floor(offset / 6) % 6) / 255,
    cube(offset % 6) / 255,
  ]);
}

/**
 * @param {number} value
 * @returns {number}
 */
function clampChannel(value) {
  return Math.min(255, Math.max(0, Number.isFinite(value) ? value : 0));
}

/**
 * Read an extended color (`38` or `48`) from SGR parameters, whose first
 * entry follows the `38`/`48`.
 * @param {number[]} params
 * @param {number} start Where the sub-parameters begin.
 * @returns {{ color: AnsiColor | undefined, used: number }} The color, or
 * `undefined` when malformed, and how many parameters it took.
 */
function readExtendedColor(params, start) {
  const mode = params[start];
  if (mode === 5 && start + 1 < params.length) {
    const index = clampChannel(params[start + 1]);
    return {
      color: index < 16 ? index : paletteToHex(index),
      used: 2,
    };
  }
  if (mode === 2 && start + 3 < params.length) {
    return {
      color: toHex([
        clampChannel(params[start + 1]) / 255,
        clampChannel(params[start + 2]) / 255,
        clampChannel(params[start + 3]) / 255,
      ]),
      used: 4,
    };
  }
  return { color: undefined, used: Math.max(1, params.length - start) };
}

/**
 * Apply one SGR sequence to a style.
 * @param {AnsiStyle} state Not modified.
 * @param {string} raw The parameter string between `[` and `m`.
 * @returns {AnsiStyle}
 */
function applySgr(state, raw) {
  /** @type {AnsiStyle} */
  let next = { ...state };
  // `38:2::r:g:b` and `38;2;r;g;b` both occur; the colon form leaves an empty
  // colorspace slot. An empty parameter is 0.
  const params =
    raw === ""
      ? [0]
      : raw
          .replace(COLON_TRUECOLOR, "$1$2:2:")
          .split(PARAMETER_SEPARATOR)
          .map((p) => Number(p) || 0);

  for (let i = 0; i < params.length; i++) {
    const code = params[i];
    if (code === 0) next = {};
    else if (code === 1) next.bold = true;
    else if (code === 2) next.dim = true;
    else if (code === 3) next.italic = true;
    else if (code === 4 || code === 21) next.underline = true;
    else if (code === 7) next.inverse = true;
    else if (code === 9) next.strike = true;
    else if (code === 22) {
      next.bold = false;
      next.dim = false;
    } else if (code === 23) next.italic = false;
    else if (code === 24) next.underline = false;
    else if (code === 27) next.inverse = false;
    else if (code === 29) next.strike = false;
    else if (code >= 30 && code <= 37) next.fg = code - 30;
    else if (code >= 90 && code <= 97) next.fg = code - 90 + 8;
    else if (code >= 40 && code <= 47) next.bg = code - 40;
    else if (code >= 100 && code <= 107) next.bg = code - 100 + 8;
    else if (code === 39) next.fg = undefined;
    else if (code === 49) next.bg = undefined;
    else if (code === 38 || code === 48) {
      const { color, used } = readExtendedColor(params, i + 1);
      if (color !== undefined) {
        if (code === 38) next.fg = color;
        else next.bg = color;
      }
      i += used;
    }
  }

  return next;
}

/**
 * The style a run is drawn in: reverse video swaps the colors, and a color
 * that was never set becomes the page's own.
 * @param {AnsiStyle} state
 * @returns {AnsiStyle | null} `null` when it equals the default.
 */
function resolveStyle(state) {
  /** @type {AnsiStyle} */
  const style = {};
  if (state.inverse) {
    style.fg = state.bg ?? "background";
    style.bg = state.fg ?? "text";
  } else {
    if (state.fg !== undefined) style.fg = state.fg;
    if (state.bg !== undefined) style.bg = state.bg;
  }
  if (state.bold) style.bold = true;
  if (state.dim) style.dim = true;
  if (state.italic) style.italic = true;
  if (state.underline) style.underline = true;
  if (state.strike) style.strike = true;
  return Object.keys(style).length > 0 ? style : null;
}

/**
 * Split `text` into runs of one style. Each line starts from the default
 * style, so a color left open on one line does not color the next.
 *
 * @param {string} text One line.
 * @returns {AnsiRun[]}
 */
export function parseAnsi(text) {
  /** @type {AnsiStyle} */
  let state = {};
  /** @type {AnsiRun[]} */
  const runs = [];

  /** @param {string} chunk */
  function push(chunk) {
    if (chunk === "") return;
    runs.push({ text: chunk, style: resolveStyle(state) });
  }

  if (!hasAnsi(text)) {
    push(text);
    return runs;
  }

  let index = 0;
  for (const match of text.matchAll(ESCAPE)) {
    const at = /** @type {number} */ (match.index);
    push(text.slice(index, at));
    index = at + match[0].length;
    if (match[2] === "m") state = applySgr(state, match[1]);
  }
  push(text.slice(index));

  return runs;
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

  // Lighten on a dark background and darken on a light one.
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
