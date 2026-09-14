// @ts-check

/**
 * @typedef {Object} InitialsOptions
 * @property {number} [max=2] Maximum number of initials returned.
 * @property {string} [locale] BCP 47 tag used for grapheme segmentation
 *   and upper casing (for example `"tr"` maps `i` to `İ`).
 */

// Constructing an `Intl.Segmenter` per call is the same trap fixed for
// `localeCompare` in DataTable; cache one per locale instead.
/** @type {Map<string, Intl.Segmenter>} */
const segmenters = new Map();

const hasSegmenter =
  typeof Intl !== "undefined" && typeof Intl.Segmenter === "function";

const WHITESPACE = /\s+/;

/**
 * @param {string | undefined} locale
 * @returns {Intl.Segmenter}
 */
function getSegmenter(locale) {
  const key = locale ?? "";
  let segmenter = segmenters.get(key);
  if (!segmenter) {
    segmenter = new Intl.Segmenter(locale, { granularity: "grapheme" });
    segmenters.set(key, segmenter);
  }
  return segmenter;
}

/**
 * The first user-perceived character of `word`.
 *
 * @param {string} word
 * @param {string | undefined} locale
 * @returns {string}
 */
function firstGrapheme(word, locale) {
  if (hasSegmenter) {
    for (const { segment } of getSegmenter(locale).segment(word)) {
      return segment;
    }
  }
  // Without `Intl.Segmenter`, fall back to the first code point (still
  // better than a UTF-16 code unit, though it can split a ZWJ sequence).
  return Array.from(word)[0];
}

/**
 * Derive initials from a full name: the first user-perceived character of
 * each whitespace-separated word, in order, capped at `max`, upper cased.
 *
 * @param {string | null | undefined} name
 * @param {InitialsOptions} [options]
 * @returns {string}
 */
export function getInitials(name, options = {}) {
  const { max = 2, locale } = options;
  if (!name || max <= 0) return "";

  const words = name.normalize("NFC").trim().split(WHITESPACE).filter(Boolean);

  const joined = words
    .slice(0, max)
    .map((word) => firstGrapheme(word, locale))
    .join("");

  return locale ? joined.toLocaleUpperCase(locale) : joined.toLocaleUpperCase();
}
