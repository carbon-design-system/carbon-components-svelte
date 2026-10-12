// @ts-check
// Firefox < 125 has no Intl.Segmenter; code-point iteration is still closer to
// user-perceived length than value.length (UTF-16 code units).

/** @type {Intl.Segmenter | null | undefined} */
let segmenter;

// The first `Intl.Segmenter` a page builds costs several milliseconds, so it
// is created on first use rather than when this module loads.
function getSegmenter() {
  if (segmenter === undefined) {
    segmenter =
      typeof Intl !== "undefined" && typeof Intl.Segmenter === "function"
        ? new Intl.Segmenter()
        : null;
  }
  return segmenter;
}

/**
 * Whether every UTF-16 code unit in `value` is its own grapheme. Nothing below
 * U+0300 combines or joins with its neighbor, except CR, which pairs with a
 * following LF. Such text needs no segmenter.
 *
 * @param {string} value
 * @returns {boolean}
 */
function isOneUnitPerGrapheme(value) {
  for (let index = 0; index < value.length; index++) {
    const code = value.charCodeAt(index);
    if (code >= 0x300 || code === 0x0d) return false;
  }
  return true;
}

/**
 * Count user-perceived characters (grapheme clusters) in `value`.
 *
 * @param {string} value
 * @returns {number}
 */
export function graphemeCount(value) {
  if (isOneUnitPerGrapheme(value)) return value.length;
  const segmenter = getSegmenter();
  if (segmenter) {
    let count = 0;
    for (const _ of segmenter.segment(value)) count++;
    return count;
  }
  return [...value].length;
}

/**
 * Truncate `value` to at most `max` grapheme clusters.
 * Returns `value` unchanged if `max` is not a finite, non-negative number.
 *
 * @param {string} value
 * @param {number} max
 * @returns {string}
 */
export function truncateGraphemes(value, max) {
  if (typeof max !== "number" || !Number.isFinite(max) || max < 0) {
    return value;
  }

  if (isOneUnitPerGrapheme(value)) return value.slice(0, max);
  const segmenter = getSegmenter();
  if (segmenter) {
    let count = 0;
    let result = "";
    for (const { segment } of segmenter.segment(value)) {
      if (count >= max) break;
      result += segment;
      count++;
    }
    return result;
  }

  return [...value].slice(0, max).join("");
}
