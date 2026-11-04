export interface MapTarget {
  key: string;
  label: string;
  aliases?: ReadonlyArray<string>;
}

export interface AutoMapOptions {
  /** The lowest score that counts as a match. Defaults to 0.6. */
  threshold?: number;
}

export interface AutoMapResult {
  /** The target key for each source column, or `null`. */
  mapping: Array<string | null>;
  /** The match score for each source column (0 when unmatched). */
  scores: number[];
  reasons: Array<"exact" | "alias" | "similar" | null>;
}

/**
 * Lowercase, strip accents, split camelCase and drop punctuation:
 * "E-mail Address" and "emailAddress" become "e mail address" and
 * "email address".
 */
export function normalizeHeader(name: string): string;

/**
 * A 0 to 1 score for two header names: 1 for the same words in any spacing,
 * 0.95 for the same words in another order, then the better of the Dice
 * coefficient on character pairs and the edit distance, with a floor of
 * about 0.75 when one name holds the other's whole words.
 */
export function similarity(a: string, b: string): number;

/**
 * Match source headers to target fields. Each field takes at most one column
 * and each column at most one field, best scores first.
 */
export function autoMap(
  headers: ReadonlyArray<string>,
  fields: ReadonlyArray<MapTarget>,
  options?: AutoMapOptions,
): AutoMapResult;
