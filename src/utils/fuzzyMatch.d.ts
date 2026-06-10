export type FuzzyMatch = {
  /** Whether `query` matches `text` at or above the threshold. */
  matched: boolean;
  /** Normalized match quality from `0` to `1`; higher is better. `0` for an empty query. */
  score: number;
  /** Ascending character indices in `text` that matched `query`. */
  indices: number[];
};

export type FuzzyMatchOptions = {
  /**
   * Minimum normalized `score` (0-1) required to match. `0` (default) accepts
   * any match. Raise toward `1` to require stronger matches: roughly `0.5`
   * requires a contiguous substring (excluding scattered subsequences), `0.7`
   * requires a word-boundary substring, and `0.9` requires a prefix.
   * @default 0
   */
  threshold?: number;
  /**
   * Match case-sensitively.
   * @default false
   */
  caseSensitive?: boolean;
};

/** Fuzzy match of `query` against `text`. Pass `options` to tune sensitivity. */
export function fuzzyMatch(
  text: string,
  query: string,
  options?: FuzzyMatchOptions,
): FuzzyMatch;

/** Split `text` into consecutive matched/unmatched segments from `indices`. */
export function highlightSegments(
  text: string,
  indices: number[],
): Array<{ text: string; match: boolean }>;
