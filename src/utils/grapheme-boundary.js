// @ts-check
import { getSegmenter } from "./grapheme-count.js";

/**
 * Whether every UTF-16 code unit in `text` is its own grapheme. Nothing below
 * U+0300 combines or joins with its neighbor, except CR, which pairs with a
 * following LF. Cutting such text anywhere is safe.
 *
 * @param {string} text
 * @returns {boolean}
 */
export function isOneUnitPerGrapheme(text) {
  for (let index = 0; index < text.length; index++) {
    const code = text.charCodeAt(index);
    if (code >= 0x300 || code === 0x0d) return false;
  }
  return true;
}

// Extenders for the fallback used where there is no `Intl.Segmenter`: combining
// marks, joiners, variation selectors, emoji skin tones and tag characters.
const MARK = /^\p{M}/u;

/**
 * Whether `code` (the code point that begins a string) extends the grapheme
 * before it, without `Intl.Segmenter`.
 *
 * @param {string} char
 * @returns {boolean}
 */
function extendsGrapheme(char) {
  const code = /** @type {number} */ (char.codePointAt(0));
  return (
    MARK.test(char) ||
    code === 0x200c ||
    code === 0x200d ||
    (code >= 0xfe00 && code <= 0xfe0f) ||
    (code >= 0x1f3fb && code <= 0x1f3ff) ||
    (code >= 0xe0020 && code <= 0xe007f)
  );
}
const REGIONAL = /^[\u{1f1e6}-\u{1f1ff}]/u;

/**
 * @param {string} text
 * @param {number} index
 * @returns {number} Start of the code point that contains `index`.
 */
function codePointStart(text, index) {
  const code = text.charCodeAt(index);
  if (code >= 0xdc00 && code <= 0xdfff && index > 0) {
    const prev = text.charCodeAt(index - 1);
    if (prev >= 0xd800 && prev <= 0xdbff) return index - 1;
  }
  return index;
}

/**
 * Whether `index` is between two graphemes, without `Intl.Segmenter`. Handles
 * surrogate pairs, combining marks, ZWJ sequences, emoji modifiers and flags.
 *
 * @param {string} text
 * @param {number} index
 * @returns {boolean}
 */
function isBoundaryFallback(text, index) {
  if (index <= 0 || index >= text.length) return true;
  if (codePointStart(text, index) !== index) return false;
  if (text[index - 1] === "\r" && text[index] === "\n") return false;
  const next = String.fromCodePoint(text.codePointAt(index) ?? 0);
  if (extendsGrapheme(next)) return false;
  // After a joiner the next code point belongs to the same sequence.
  if (text.charCodeAt(index - 1) === 0x200d) return false;
  if (REGIONAL.test(next)) {
    // Regional indicators pair up: a flag ends after every second one.
    let count = 0;
    for (let i = index; i > 0;) {
      const start = codePointStart(text, i - 1);
      if (!REGIONAL.test(text.slice(start, i))) break;
      count++;
      i = start;
    }
    return count % 2 === 0;
  }
  return true;
}

/**
 * Whether `index` falls between graphemes of `text` (0 and `text.length` do).
 *
 * @param {string} text
 * @param {number} index
 * @returns {boolean}
 */
export function isGraphemeBoundary(text, index) {
  if (index <= 0 || index >= text.length) return true;
  if (isOneUnitPerGrapheme(text)) return true;
  const segmenter = getSegmenter();
  if (!segmenter) return isBoundaryFallback(text, index);
  return segmenter.segment(text).containing(index)?.index === index;
}

/**
 * Nearest grapheme boundary at or before `index`.
 *
 * @param {string} text
 * @param {number} index
 * @returns {number}
 */
export function graphemeFloor(text, index) {
  if (index <= 0) return 0;
  if (index >= text.length) return text.length;
  if (isOneUnitPerGrapheme(text)) return index;
  const segmenter = getSegmenter();
  if (segmenter)
    return segmenter.segment(text).containing(index)?.index ?? index;
  let i = index;
  while (i > 0 && !isBoundaryFallback(text, i)) i--;
  return i;
}

/**
 * Nearest grapheme boundary at or after `index`.
 *
 * @param {string} text
 * @param {number} index
 * @returns {number}
 */
export function graphemeCeil(text, index) {
  if (index <= 0) return 0;
  if (index >= text.length) return text.length;
  if (isOneUnitPerGrapheme(text)) return index;
  const segmenter = getSegmenter();
  if (segmenter) {
    const found = segmenter.segment(text).containing(index);
    if (!found) return index;
    return found.index === index ? index : found.index + found.segment.length;
  }
  let i = index;
  while (i < text.length && !isBoundaryFallback(text, i)) i++;
  return i;
}
