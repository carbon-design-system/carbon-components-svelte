// @ts-check

const MARKS = /\p{M}+/gu;
const MINUS = /−/g;
const SEPARATORS = /[/_,()·]+/g;
const WHITESPACE = /\s+/;
const WORD_HYPHEN = /(\p{L})-(?=\p{L})/gu;
const OFFSET_QUERY = /^(?:utc|gmt)?([+-])(\d{0,2})(?::?(\d{0,2}))?$/;

/**
 * Lowercase `text` and drop its accents, so "Sao Paulo" finds "São Paulo".
 * @param {string} text
 * @returns {string}
 */
export function foldText(text) {
  return text.normalize("NFD").replace(MARKS, "").toLowerCase();
}

/**
 * Canonical form of a typed offset ("+5:30", "utc-8", "GMT+0530"). An hour
 * with no minutes ends in a colon, so "+1" finds "+01:00" and "+01:30" but
 * not "+10:00". Anything that is not an offset returns `null`.
 * @param {string} token A folded token.
 * @returns {string | null}
 */
export function canonicalOffsetQuery(token) {
  const match = OFFSET_QUERY.exec(token);
  if (!match) return null;
  const [, sign, hours, minutes] = match;
  if (hours === "") return sign;
  return `${sign}${hours.padStart(2, "0")}:${minutes ?? ""}`;
}

/**
 * Split a query into folded tokens. A token that reads as an offset is
 * replaced by its canonical form, which is how offsets are written in the
 * search text.
 * @param {string} query
 * @returns {string[]}
 */
export function parseQuery(query) {
  return foldText(query.replace(MINUS, "-").replace(SEPARATORS, " "))
    .replace(WORD_HYPHEN, "$1 ")
    .split(WHITESPACE)
    .filter(Boolean)
    .map((token) => canonicalOffsetQuery(token) ?? token);
}

/**
 * Build the text a query is matched against: folded, with each word set
 * apart by a space, and a space in front. A hyphen between letters splits a
 * word ("Port-au-Prince"), but one in front of a digit stays, since it is an
 * offset's sign.
 * @param {ReadonlyArray<string | undefined>} parts
 * @returns {string}
 */
export function searchText(parts) {
  return ` ${foldText(parts.join(" "))
    .replace(SEPARATORS, " ")
    .replace(WORD_HYPHEN, "$1 ")}`;
}

/**
 * Whether every token of a parsed query starts a word in `haystack`, so
 * "ist" finds "Istanbul" and not "Boa Vista". An offset starts a word too.
 * @param {string} haystack Text from `searchText`.
 * @param {ReadonlyArray<string>} tokens
 * @returns {boolean}
 */
export function matchesTokens(haystack, tokens) {
  for (let i = 0; i < tokens.length; i++) {
    if (!haystack.includes(` ${tokens[i]}`)) return false;
  }
  return true;
}

/**
 * A `shouldFilterItem` for list items that carry a folded `search` string.
 * The query is parsed once per string, not once per item.
 * @param {() => void} [prepare] Called before a non-empty query is matched,
 * to finish building the search text.
 * @returns {(item: { search: string }, query: string) => boolean}
 */
export function createSearchFilter(prepare) {
  let lastQuery = "";
  /** @type {string[]} */
  let tokens = [];
  return function shouldFilterItem(item, query) {
    if (query !== lastQuery) {
      lastQuery = query;
      tokens = parseQuery(query);
      if (tokens.length > 0) prepare?.();
    }
    return tokens.length === 0 || matchesTokens(item.search, tokens);
  };
}
