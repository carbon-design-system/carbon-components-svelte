/** A span of a string: UTF-16 offsets, `end` exclusive. */
export type TextRange = {
  start: number;
  end: number;
};

/**
 * Where a match may begin.
 * - `"substring"`: anywhere.
 * - `"word-start"`: at the start of the text or after a character that is not a
 *   letter or number.
 * - `"prefix"`: at the start of the text only.
 */
export type TextMatchMode = "substring" | "word-start" | "prefix";

export type TextMatchOptions = {
  /**
   * Where a match may begin.
   * @default "substring"
   */
  mode?: TextMatchMode;
  /**
   * Match case-sensitively.
   * @default false
   */
  caseSensitive?: boolean;
  /**
   * Treat `e`, `é` and `ê` alike (also `ø` as `o`, Arabic hamza forms and
   * Hebrew points). Full-width and ligature forms fold either way.
   * @default true
   */
  ignoreDiacritics?: boolean;
  /**
   * With a multi-term query, `"all"` returns nothing unless every term occurs.
   * @default "any"
   */
  terms?: "any" | "all";
  /**
   * Split a string query on whitespace into terms.
   * @default true
   */
  split?: boolean;
};

export type FuzzyTextOptions = {
  /**
   * Minimum `score` (0 to 1) that counts as a match. About `0.5` requires a
   * contiguous substring, `0.7` a word-start substring, `0.9` a prefix.
   * @default 0
   */
  threshold?: number;
  /**
   * Match case-sensitively.
   * @default false
   */
  caseSensitive?: boolean;
  /**
   * Treat `e`, `é` and `ê` alike.
   * @default true
   */
  ignoreDiacritics?: boolean;
};

export type FuzzyTextMatch = {
  /** Whether `query` matches `text` at or above `threshold`. */
  matched: boolean;
  /** Quality from `0` to `1`; higher is better. `0` for an empty query. */
  score: number;
  /** What to highlight, as offsets into the original text. */
  ranges: TextRange[];
};

/**
 * The form of `text` that search compares: case-folded, with diacritics and
 * width variants folded. Offsets into the result do not map to `text`.
 */
export function foldText(
  text: string,
  options?: Pick<TextMatchOptions, "caseSensitive" | "ignoreDiacritics">,
): string;

/** Sort `ranges` and join those that overlap or touch. */
export function mergeRanges(ranges: ReadonlyArray<TextRange>): TextRange[];

/**
 * Make ranges safe to render against `text`: clamp to its length, drop empty
 * ones, widen each to whole graphemes, and merge.
 */
export function normalizeRanges(
  text: string,
  ranges: ReadonlyArray<TextRange> | null | undefined,
): TextRange[];

/** Turn character indices (as `fuzzyMatch` returns) into ranges. */
export function indicesToRanges(
  indices: ReadonlyArray<number> | null | undefined,
): TextRange[];

/**
 * Cut `text` into runs at the edges of normalized `ranges`. The runs
 * concatenate back to `text`.
 */
export function splitByRanges(
  text: string,
  ranges: ReadonlyArray<TextRange>,
): Array<{ text: string; match: boolean }>;

/**
 * Compile `query` once and match many texts against it. A string is split on
 * whitespace into terms (unless `split` is `false`); an array is a list of
 * terms or phrases used as-is.
 */
export function createTextMatcher(
  query: string | ReadonlyArray<string> | null | undefined,
  options?: TextMatchOptions,
): (text: string) => TextRange[];

/**
 * Find where `query` occurs in `text`, ignoring case and diacritics. The ranges
 * are offsets into the original `text`, on grapheme boundaries.
 */
export function matchText(
  text: string,
  query: string | ReadonlyArray<string> | null | undefined,
  options?: TextMatchOptions,
): TextRange[];

/** Compile a fuzzy `query` to match many texts. */
export function createFuzzyTextMatcher(
  query: string,
  options?: FuzzyTextOptions,
): (text: string) => FuzzyTextMatch;

/**
 * Fuzzy-match `query` against `text`, ignoring case and diacritics, and return
 * the score and what to highlight.
 */
export function fuzzyMatchText(
  text: string,
  query: string,
  options?: FuzzyTextOptions,
): FuzzyTextMatch;
