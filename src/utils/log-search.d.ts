import type { AnsiStyle } from "./ansi.js";

/** Most matches kept per line. */
export const MAX_MATCHES_PER_LINE: number;

/** Longest line searched for links. */
export const MAX_LINKIFY_LENGTH: number;

export interface LogMatcher {
  /** Where the query matches in `text`, in order and without overlap. */
  ranges(text: string): Array<[start: number, end: number]>;
}

/**
 * Compile a search query. `null` for an empty query, and `"invalid"` for a
 * regular expression that does not parse.
 */
export function createMatcher(options: {
  query: string;
  regex?: boolean;
  caseSensitive?: boolean;
}): LogMatcher | null | "invalid";

/**
 * The matches in a stream of lines, kept as lines are added and dropped.
 * Matches are numbered from the first, counting every occurrence in a line.
 */
export function createSearchIndex(): {
  readonly total: number;
  reset(
    matcher: LogMatcher | null,
    rows: ReadonlyArray<{ id: number; plain: string }>,
  ): void;
  append(rows: ReadonlyArray<{ id: number; plain: string }>): void;
  trim(firstId: number): void;
  locate(n: number): { id: number; occurrence: number } | null;
  position(id: number, occurrence: number): number;
  firstFrom(id: number): number;
};

/**
 * One piece of a line, drawn as one element: text in a single style, which
 * is a link or a match or neither.
 */
export interface LinePart {
  text: string;
  style: AnsiStyle | null;
  href?: string;
  /** `1` for a match, `2` for the current one. */
  mark: 0 | 1 | 2;
}

/**
 * Cut a line into the pieces it is drawn in: where its colors change, where
 * a link starts or ends, and where a match starts or ends.
 */
export function lineParts(
  line: { text: string },
  options?: {
    ranges?: ReadonlyArray<[number, number]>;
    current?: number;
    links?: boolean;
  },
): LinePart[];
