// @ts-check

/**
 * A blocklist answers one question: how common is this password? `rank`
 * returns a 1-based popularity rank for a lower-case word, or `undefined`
 * when the word is not on the list.
 *
 * @typedef {object} Blocklist
 * @property {(word: string) => number | undefined} rank
 * @property {number} size
 */

/**
 * One slice of a ranked list. `words` is front-coded (see `encodeTier`).
 *
 * @typedef {object} BlocklistTier
 * @property {number} upTo - Rank of the last word in the tier (100, 1000, ...).
 * @property {string} words - Front-coded, sorted, lower-case words.
 */

const MAX_PREFIX = 60;
const PREFIX_BASE = 48;

/**
 * Front-code a list of words: sort, then replace each word's prefix shared
 * with the previous one by one character holding the prefix length. Sorting
 * and sharing prefixes make a 10k list gzip about 40% smaller than a
 * rank-ordered one.
 *
 * @param {Iterable<string>} words
 * @returns {string}
 */
export function encodeTier(words) {
  const sorted = [...new Set([...words].map((w) => w.toLowerCase()))].sort();
  let prev = "";
  const out = [];
  for (const word of sorted) {
    let i = 0;
    while (
      i < prev.length &&
      i < word.length &&
      i < MAX_PREFIX &&
      prev[i] === word[i]
    ) {
      i++;
    }
    out.push(String.fromCharCode(PREFIX_BASE + i) + word.slice(i));
    prev = word;
  }
  return out.join("\n");
}

/**
 * @param {string} encoded
 * @returns {string[]}
 */
function decodeTier(encoded) {
  const words = [];
  let prev = "";
  for (const line of encoded.split("\n")) {
    if (!line) continue;
    const word =
      prev.slice(0, line.charCodeAt(0) - PREFIX_BASE) + line.slice(1);
    words.push(word);
    prev = word;
  }
  return words;
}

/**
 * Build a blocklist from ranked tiers. Every word in a tier gets the tier's
 * geometric-mean rank: the guess count of a tier's words only matters to
 * within a factor of a few.
 *
 * @param {BlocklistTier[]} tiers
 * @returns {Blocklist}
 */
export function decodeBlocklist(tiers) {
  /** @type {Map<string, number>} */
  const ranks = new Map();
  let start = 1;
  for (const tier of tiers) {
    const rank = Math.max(1, Math.round(Math.sqrt(start * tier.upTo)));
    for (const word of decodeTier(tier.words)) {
      if (!ranks.has(word)) ranks.set(word, rank);
    }
    start = tier.upTo + 1;
  }
  return { rank: (word) => ranks.get(word), size: ranks.size };
}

/**
 * Build a blocklist from a plain list. Words are ranked by their position, so
 * pass them most common first.
 *
 * @param {Iterable<string>} words
 * @returns {Blocklist}
 */
export function createBlocklist(words) {
  /** @type {Map<string, number>} */
  const ranks = new Map();
  let n = 0;
  for (const word of words) {
    n++;
    const key = word.toLowerCase();
    if (!ranks.has(key)) ranks.set(key, n);
  }
  return { rank: (word) => ranks.get(word), size: ranks.size };
}

/**
 * Accept what the `blocklist` prop takes.
 *
 * @param {Blocklist | Iterable<string> | null | undefined} input
 * @returns {Blocklist | undefined} `undefined` for no list (use the default).
 */
export function toBlocklist(input) {
  if (!input) return undefined;
  if (typeof (/** @type {Blocklist} */ (input).rank) === "function") {
    return /** @type {Blocklist} */ (input);
  }
  return createBlocklist(/** @type {Iterable<string>} */ (input));
}
