/**
 * Count words in `value`.
 * Uses `Intl.Segmenter` word segments flagged `isWordLike`;
 * falls back to whitespace splitting.
 */
export function wordCount(value: string): number;

/**
 * Return the prefix of `value` that contains at most `max` words.
 * Keeps the whitespace that follows the last kept word.
 * Returns `value` unchanged if `max` is not a finite, non-negative number.
 */
export function truncateWords(value: string, max: number): string;

/**
 * Decide how to handle inserting `data` over the selection `start`..`end`
 * of `current` when at most `max` words are allowed.
 *
 * - `"allow"`: let the browser insert `data` unchanged.
 * - `"block"`: prevent the insertion.
 * - `{ insert }`: prevent the insertion and insert this truncated text instead.
 */
export function wordLimitAction(
  current: string,
  start: number,
  end: number,
  data: string,
  max: number,
): "allow" | "block" | { insert: string };
