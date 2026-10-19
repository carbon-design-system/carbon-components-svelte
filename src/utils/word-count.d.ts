/**
 * Count words in `value`.
 * Uses `Intl.Segmenter` word segments flagged `isWordLike`;
 * falls back to whitespace splitting.
 */
export function wordCount(value: string): number;

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
