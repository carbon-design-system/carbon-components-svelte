// @ts-check
// Ranks a synchronous list against a query without sorting the whole list:
// a single pass drops each hit into one of four buckets, and the pass stops
// as soon as the best bucket holds enough. Folded copies of the text are
// built once per list, so a keystroke on 10,000 users does no allocation
// beyond the result.

/**
 * @typedef {Object} MentionItem
 * @property {string | number} id
 * @property {string} text
 * @property {string} [secondary]
 * @property {string} [insertText]
 * @property {boolean} [disabled]
 */

const ASCII = /^[\t\n\r -~]*$/;

/** @type {WeakMap<ReadonlyArray<MentionItem>, { text: string[], secondary: string[] }>} */
const folded = new WeakMap();

/**
 * Lowercase and drop accents, so "jose" finds "José".
 * @param {string | undefined} text
 */
export function foldText(text) {
  if (!text) return "";
  // Most text is ASCII, which has nothing to decompose.
  if (ASCII.test(text)) return text.toLowerCase();
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * @param {ReadonlyArray<MentionItem>} items
 */
function foldItems(items) {
  let entry = folded.get(items);
  if (!entry) {
    entry = {
      text: items.map((item) => foldText(item.text)),
      secondary: items.map((item) => foldText(item.secondary)),
    };
    folded.set(items, entry);
  }
  return entry;
}

const WORD_EDGE = /[\s._\-@]/;

/**
 * Build the folded copies of `items` ahead of the first query, so the first
 * key typed after the trigger does not pay for them.
 * @param {ReadonlyArray<MentionItem>} items
 */
export function warmMentionItems(items) {
  foldItems(items);
}

/**
 * 0 for a prefix, 1 for the start of a later word, 2 for anywhere else,
 * -1 for no match.
 * @param {string} haystack
 * @param {string} query
 */
function rank(haystack, query) {
  const at = haystack.indexOf(query);
  if (at === -1) return -1;
  if (at === 0) return 0;
  return WORD_EDGE.test(haystack[at - 1]) ? 1 : 2;
}

/**
 * Items that match `query`, best first, at most `limit`. A prefix of the
 * text beats the start of a later word, which beats a substring, which
 * beats a match on `secondary` only. Ties keep the order of `items`.
 * The list is read, never mutated. Replace the array to refresh the cache.
 *
 * @template {MentionItem} T
 * @param {ReadonlyArray<T>} items
 * @param {string} query
 * @param {number} [limit=10]
 * @returns {T[]}
 */
export function filterMentionItems(items, query, limit = 10) {
  const q = foldText(query.trim());
  if (!q) return items.slice(0, limit);

  const { text, secondary } = foldItems(items);
  /** @type {[T[], T[], T[], T[]]} */
  const buckets = [[], [], [], []];

  for (let i = 0; i < items.length; i++) {
    let bucket = rank(text[i], q);
    if (bucket === -1) {
      const other = secondary[i] ? rank(secondary[i], q) : -1;
      if (other === -1) continue;
      bucket = 3;
    }
    buckets[bucket].push(items[i]);
    if (bucket === 0 && buckets[0].length >= limit) break;
  }

  return buckets.flat().slice(0, limit);
}
