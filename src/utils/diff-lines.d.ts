/**
 * A dependency-free sequence diff: Myers' O(ND) algorithm in linear space,
 * after the trims git and GNU diff make. Words inside a changed line use the
 * same engine.
 */

/**
 * A run of difference. Both ranges are half-open. The elements of
 * `a[aStart, aEnd)` are replaced by `b[bStart, bEnd)`; either side may be empty.
 */
export type DiffBlock = {
  aStart: number;
  aEnd: number;
  bStart: number;
  bEnd: number;
};

export type DiffSequenceOptions = {
  /** Compare strings with all whitespace removed. */
  ignoreWhitespace?: boolean;
  /**
   * Edit steps one split may take before it settles for a good split over
   * the best one. The diff stays valid, but may be longer than the shortest.
   * @default 4096
   */
  maxCost?: number;
  /** Never settle: always the shortest diff. */
  minimal?: boolean;
};

/** Default for `maxCost`, the limit GNU diff uses at this scale. */
export const DEFAULT_MAX_COST: number;

/**
 * Where two sequences differ. Strings (lines, words) are compared by value.
 * Common leading and trailing elements are trimmed, elements that occur on
 * one side only are marked without a search, and only what remains goes
 * through Myers' algorithm.
 *
 * @returns The differences in order. Empty when the sequences match.
 */
export function diffSequence(
  a: ArrayLike<string>,
  b: ArrayLike<string>,
  options?: DiffSequenceOptions,
): DiffBlock[];

export type DiffInlineOptions = {
  /**
   * Skip lines longer than this many characters. Highlights inside a
   * minified line say nothing and cost the most.
   * @default 1000
   */
  maxLength?: number;
  /**
   * Skip a pair of lines that share less than this share of their non-space
   * characters, so a rewritten line gets no speckled highlight.
   * @default 0.25
   */
  minSimilarity?: number;
};

/**
 * The words that changed between two versions of a line, as character ranges.
 *
 * @returns Flat `[start, end, ...]` UTF-16 offsets into each line, or `null`
 * when the lines are too long or too different for word highlights to help.
 */
export function diffInline(
  oldText: string,
  newText: string,
  options?: DiffInlineOptions,
): { old: number[]; new: number[] } | null;
