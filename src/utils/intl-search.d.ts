/** Lowercase `text` and drop its accents. */
export function foldText(text: string): string;

/**
 * Canonical form of a typed offset ("+5:30", "utc-8"), or `null` when the
 * token is not an offset.
 */
export function canonicalOffsetQuery(token: string): string | null;

/** Split a query into folded tokens, with offsets in their canonical form. */
export function parseQuery(query: string): string[];

/**
 * The text a query is matched against: folded, words set apart, and a space
 * in front.
 */
export function searchText(parts: ReadonlyArray<string | undefined>): string;

/** Whether every token starts a word in `haystack`. */
export function matchesTokens(
  haystack: string,
  tokens: ReadonlyArray<string>,
): boolean;

/**
 * A `shouldFilterItem` for items that carry a folded `search` string.
 * `prepare` runs before a non-empty query is matched.
 */
export function createSearchFilter(
  prepare?: () => void,
): (item: { search: string }, query: string) => boolean;
