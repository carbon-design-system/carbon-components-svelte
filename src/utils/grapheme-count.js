// @ts-check
// Firefox < 125 has no Intl.Segmenter; code-point iteration is still closer to
// user-perceived length than value.length (UTF-16 code units).

const segmenter =
  typeof Intl !== "undefined" && typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter()
    : null;

/**
 * Count user-perceived characters (grapheme clusters) in `value`.
 *
 * @param {string} value
 * @returns {number}
 */
export function graphemeCount(value) {
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
