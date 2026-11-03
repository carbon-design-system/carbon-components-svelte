// @ts-check
// Search over the items of a picker: a label, and optional keywords. Built
// for thousands of items, so the text of each item is normalized once, in
// `createPickerIndex`, and a keystroke only scans it.

/**
 * @typedef {Object} PickerSearchItem
 * @property {string} id
 * @property {string} label
 * @property {ReadonlyArray<string>} [keywords]
 */

/**
 * @template {PickerSearchItem} Item
 * @typedef {Object} PickerIndexEntry
 * @property {Item} item
 * @property {string} text - The label, lowercase, without accents.
 * @property {string[]} words - The words of `text`.
 * @property {string} keywords - The keywords joined by a space.
 * @property {string[]} keywordWords
 */

/**
 * Lowercase `text` and drop accents, so "cafe" finds "Café".
 * @param {string} text
 * @returns {string}
 */
export function normalizeSearchText(text) {
  return text.normalize("NFD").replace(MARKS, "").toLowerCase();
}

const NON_WORD = /[^\p{L}\p{N}]+/u;
const MARKS = /\p{M}/gu;
const SPACE = /\s+/;

/** @param {string} text */
function splitWords(text) {
  return text.split(NON_WORD).filter(Boolean);
}

/**
 * Normalize the text of `items` for `searchPickerIndex`.
 *
 * @template {PickerSearchItem} Item
 * @param {ReadonlyArray<Item>} items
 * @returns {PickerIndexEntry<Item>[]}
 */
export function createPickerIndex(items) {
  return items.map((item) => {
    const text = normalizeSearchText(item.label);
    const keywords = (item.keywords ?? []).map(normalizeSearchText);
    return {
      item,
      text,
      words: splitWords(text),
      keywords: keywords.join(" "),
      keywordWords: keywords.flatMap(splitWords),
    };
  });
}

/**
 * How well `token` matches an entry: lower is better, `-1` for no match.
 * A label that starts with it wins over a word in the label that does, then
 * a label that holds it, then the keywords.
 *
 * @param {PickerIndexEntry<any>} entry
 * @param {string} token
 * @returns {number}
 */
function scoreToken(entry, token) {
  if (entry.text === token) return 0;
  if (entry.text.startsWith(token)) return 1;
  if (entry.words.some((word) => word.startsWith(token))) return 2;
  if (entry.text.includes(token)) return 3;
  if (entry.keywordWords.some((word) => word.startsWith(token))) return 4;
  if (entry.keywords.includes(token)) return 5;
  return -1;
}

/**
 * The items that match every word of `query`, best match first, and in the
 * order of `index` among equal matches. An empty query matches everything,
 * in order.
 *
 * @template {PickerSearchItem} Item
 * @param {ReadonlyArray<PickerIndexEntry<Item>>} index
 * @param {string} query
 * @returns {Item[]}
 */
export function searchPickerIndex(index, query) {
  const tokens = normalizeSearchText(query).split(SPACE).filter(Boolean);
  if (tokens.length === 0) return index.map((entry) => entry.item);

  /** @type {{ item: Item, score: number, at: number }[]} */
  const matches = [];
  for (let at = 0; at < index.length; at++) {
    const entry = index[at];
    let score = 0;
    for (const token of tokens) {
      const part = scoreToken(entry, token);
      if (part < 0) {
        score = -1;
        break;
      }
      score += part;
    }
    if (score >= 0) matches.push({ item: entry.item, score, at });
  }
  matches.sort((a, b) => a.score - b.score || a.at - b.at);
  return matches.map((match) => match.item);
}
