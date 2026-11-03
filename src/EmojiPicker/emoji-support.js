// @ts-check
// Which emoji the browser can draw. A new emoji is a blank or a box on a
// device whose font predates it, and a new sequence is a row of its parts, so
// the picker tests one or two emoji for each Unicode version and hides the
// versions after the first that fails. Cheap: about 40 small canvas draws,
// once for each page.

/**
 * @typedef {object} EmojiSupport
 * @property {number} version - The newest Unicode emoji version the browser draws. `Infinity` when nothing was tested.
 * @property {boolean} flags - Whether the flags of countries draw as flags. Windows draws them as two letters.
 */

/**
 * @typedef {(glyph: string) => boolean} EmojiRenderer
 */

/** Everything shown: what a server, and a browser with no canvas, reports. */
export const FULL_EMOJI_SUPPORT = {
  version: Number.POSITIVE_INFINITY,
  flags: true,
};

const COUNTRY_FLAG =
  /^[\u{1F1E6}-\u{1F1FF}]{2}$|^\u{1F3F4}[\u{E0020}-\u{E007F}]+$/u;
const JSDOM = /jsdom/i;

/** @type {WeakMap<object, EmojiSupport>} */
const detected = new WeakMap();

/**
 * Whether `glyph` is the flag of a country or region.
 * @param {string} glyph
 * @returns {boolean}
 */
export function isFlagGlyph(glyph) {
  return COUNTRY_FLAG.test(glyph);
}

/**
 * One or two emoji to test for each Unicode version in `items`, oldest
 * version first: the longest sequence of the version, which fails when the
 * font lacks its ligature, and the last emoji, which fails when it lacks the
 * emoji.
 * @param {ReadonlyArray<{ emoji: string; version: number }>} items
 * @returns {{ version: number; glyphs: string[] }[]}
 */
export function emojiProbes(items) {
  /** @type {Map<number, { longest: string; last: string }>} */
  const byVersion = new Map();
  for (const { emoji, version } of items) {
    const entry = byVersion.get(version);
    if (entry) {
      if (emoji.length > entry.longest.length) entry.longest = emoji;
      entry.last = emoji;
    } else byVersion.set(version, { longest: emoji, last: emoji });
  }
  return [...byVersion]
    .sort((a, b) => a[0] - b[0])
    .map(([version, { longest, last }]) => ({
      version,
      glyphs: longest === last ? [longest] : [longest, last],
    }));
}

/**
 * The newest version whose probes all draw and that follows only versions
 * that do. When even the oldest fails, the browser has no emoji font to
 * measure, and hiding all of them would leave nothing to choose.
 * @param {ReadonlyArray<{ version: number; glyphs: string[] }>} probes
 * @param {EmojiRenderer} render
 * @returns {number}
 */
export function newestDrawnVersion(probes, render) {
  let newest = 0;
  for (const { version, glyphs } of probes) {
    if (!glyphs.every((glyph) => render(glyph))) break;
    newest = version;
  }
  return newest === 0 ? Number.POSITIVE_INFINITY : newest;
}

/**
 * Draw `glyph` in black and in white. A color emoji font ignores the fill
 * and draws the same pixels, so a glyph that changes with the fill came from
 * a text font: a box, or the letters of a flag. A glyph that draws nothing
 * is not drawn either, and a sequence the font cannot join is wider than
 * one emoji.
 * @returns {EmojiRenderer | null}
 */
export function createCanvasRenderer() {
  if (typeof document === "undefined") return null;
  // jsdom reports `getContext` as not implemented, to the console.
  if (typeof navigator !== "undefined" && JSDOM.test(navigator.userAgent)) {
    return null;
  }
  const canvas = document.createElement("canvas");
  const width = 48;
  const height = 24;
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  context.font = "16px sans-serif";
  context.textBaseline = "top";
  const single = context.measureText("\u{1F600}").width;

  /** @param {string} glyph @param {string} fill */
  const draw = (glyph, fill) => {
    context.clearRect(0, 0, width, height);
    context.fillStyle = fill;
    context.fillText(glyph, 0, 0);
    return context.getImageData(0, 0, width, height).data;
  };

  return (glyph) => {
    if (context.measureText(glyph).width > single * 1.5) return false;
    const black = draw(glyph, "#000");
    const white = draw(glyph, "#fff");
    let inked = false;
    for (let at = 0; at < black.length; at++) {
      if (black[at] !== white[at]) return false;
      if (at % 4 === 3 && black[at] > 0) inked = true;
    }
    return inked;
  };
}

/**
 * Test what the browser draws, from the emoji in `items`.
 * @param {ReadonlyArray<{ emoji: string; version: number }>} items
 * @param {EmojiRenderer} [render] - Draws a glyph and says whether it came out as an emoji. Defaults to a canvas, and with none, nothing is hidden.
 * @returns {EmojiSupport}
 */
export function detectEmojiSupport(items, render) {
  const known = render ? undefined : detected.get(items);
  if (known) return known;
  const renderer = render ?? createCanvasRenderer();
  if (!renderer) return FULL_EMOJI_SUPPORT;
  /** @type {EmojiSupport} */
  const support = {
    version: newestDrawnVersion(emojiProbes(items), renderer),
    flags: renderer("\u{1F1FA}\u{1F1F8}"),
  };
  if (!render) detected.set(items, support);
  return support;
}

/**
 * The items the browser can draw, or `items` itself when it draws them all.
 * @template {{ emoji: string; version: number }} Item
 * @param {ReadonlyArray<Item>} items
 * @param {Partial<EmojiSupport>} support
 * @returns {ReadonlyArray<Item>}
 */
export function filterSupported(
  items,
  { version = Number.POSITIVE_INFINITY, flags = true } = {},
) {
  if (version === Number.POSITIVE_INFINITY && flags) return items;
  return items.filter(
    (item) => item.version <= version && (flags || !isFlagGlyph(item.emoji)),
  );
}
