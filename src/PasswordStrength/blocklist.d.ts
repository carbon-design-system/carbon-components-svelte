/**
 * A blocklist answers one question: how common is this password? `rank`
 * returns a 1-based popularity rank for a lower-case word, or `undefined`
 * when the word is not on the list.
 */
export interface Blocklist {
  rank: (word: string) => number | undefined;
  size: number;
}

/** One slice of a ranked list. `words` is front-coded (see `encodeTier`). */
export interface BlocklistTier {
  /** Rank of the last word in the tier (10, 100, 1000, ...). */
  upTo: number;
  /** Front-coded, sorted, lower-case words. */
  words: string;
}

/** Front-code a list of words for a `BlocklistTier`. */
export function encodeTier(words: Iterable<string>): string;

/** Build a blocklist from ranked tiers. */
export function decodeBlocklist(tiers: BlocklistTier[]): Blocklist;

/** Build a blocklist from a plain list, most common first. */
export function createBlocklist(words: Iterable<string>): Blocklist;

/** Accept what the `blocklist` prop takes. */
export function toBlocklist(
  input: Blocklist | Iterable<string> | null | undefined,
): Blocklist | undefined;
