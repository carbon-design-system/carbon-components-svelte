// @ts-check

const segmenter = new Intl.Segmenter(undefined, { granularity: "word" });

/**
 * Split `value` into consecutive segments flagged as word-like or not.
 *
 * @param {string} value
 * @returns {{ segment: string; isWordLike: boolean }[]}
 */
function segmentWords(value) {
  return Array.from(segmenter.segment(value), ({ segment, isWordLike }) => ({
    segment,
    isWordLike: !!isWordLike,
  }));
}

/**
 * Count words in `value`.
 * Uses `Intl.Segmenter` word segments flagged `isWordLike`.
 *
 * @param {string} value
 * @returns {number}
 */
export function wordCount(value) {
  let count = 0;
  for (const { isWordLike } of segmenter.segment(value)) {
    if (isWordLike) count++;
  }
  return count;
}

/**
 * Return the prefix of `value` that contains at most `max` words.
 * Keeps the whitespace that follows the last kept word.
 *
 * @param {string} value
 * @param {number} max - Greater than 0.
 * @returns {string}
 */
function truncateWords(value, max) {
  let count = 0;
  let result = "";
  for (const { segment, isWordLike } of segmentWords(value)) {
    if (isWordLike) {
      if (count >= max) break;
      count++;
    }
    result += segment;
  }
  return result;
}

/**
 * Decide how to handle inserting `data` over the selection `start`..`end`
 * of `current` when at most `max` words are allowed.
 *
 * - `"allow"`: let the browser insert `data` unchanged.
 * - `"block"`: prevent the insertion.
 * - `{ insert }`: prevent the insertion and insert this truncated text instead.
 *
 * @param {string} current
 * @param {number} start
 * @param {number} end
 * @param {string} data
 * @param {number} max
 * @returns {"allow" | "block" | { insert: string }}
 */
export function wordLimitAction(current, start, end, data, max) {
  const kept = current.slice(0, start) + current.slice(end);
  const compose = (/** @type {string} */ text) =>
    kept.slice(0, start) + text + kept.slice(start);

  if (wordCount(compose(data)) <= max) return "allow";

  const room = max - wordCount(kept);
  if (room > 0) {
    const insert = truncateWords(data, room);
    if (insert && wordCount(compose(insert)) <= max) return { insert };
  }

  // At or over the cap: only allow input that adds no words, such as
  // whitespace or edits while the value is already over the limit.
  return wordCount(compose(data)) <= wordCount(current) ? "allow" : "block";
}
