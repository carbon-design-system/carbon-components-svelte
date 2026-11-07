// @ts-check
// What `TokenSearch` offers at the caret, as pure functions. `suggestContext`
// reads the text around the caret and says whether it is on a key (an empty
// word, or the start of one) or on a value (after `key:`, in a list or the
// operand of a comparison), and which characters a choice replaces. The
// `*Items` functions rank the choices and `buildInsertion` writes one.

import { findKey, formatValue, tokenize, toTokenValue } from "./token-query.js";

/**
 * @typedef {import("./token-query.js").TokenKey} TokenKey
 * @typedef {import("./token-query.js").TokenValue} TokenValue
 */

/**
 * @typedef {Object} SuggestContext
 * @property {"key" | "value"} kind
 * @property {number} start First character a choice replaces.
 * @property {number} end Index after the last character a choice replaces.
 * @property {string} prefix The text between `start` and the caret.
 * @property {boolean} negated The word starts with `-`.
 * @property {boolean} [colon] For a key: a colon already follows it.
 * @property {string} [key] For a value: the key as typed.
 * @property {TokenKey} [def] For a value: the schema's entry for the key.
 * @property {string[]} [taken] For a value: the other values of the list.
 * @property {boolean} [operator] For a value: a comparison operator was typed.
 * @property {number} [pieceStart] For a value: where the whole piece starts, operator included.
 * @property {number} [pieceEnd] For a value: where the whole piece ends.
 */

const COMPARATOR = /^(>=|<=|>|<)/;
const FOLLOWS = /^[\s,]/;

/**
 * What the caret is on, or `null` where nothing is offered: inside a
 * phrase, in front of a `-`, or on a value of a key the schema does not know.
 * @param {string} text
 * @param {number} caret
 * @param {ReadonlyArray<TokenKey> | undefined} keys
 * @returns {SuggestContext | null}
 */
export function suggestContext(text, caret, keys) {
  const token = tokenize(text).find(
    (candidate) => caret >= candidate.start && caret <= candidate.end,
  );

  if (!token) {
    return {
      kind: "key",
      start: caret,
      end: caret,
      prefix: "",
      negated: false,
      colon: false,
    };
  }
  if (caret < token.bodyStart) return null;

  if (token.type === "text") {
    if (token.phrase) return null;
    return {
      kind: "key",
      start: token.bodyStart,
      end: token.end,
      prefix: text.slice(token.bodyStart, caret),
      negated: token.negated,
      colon: false,
    };
  }

  const keyEnd = token.keyEnd ?? token.end;
  if (caret <= keyEnd) {
    return {
      kind: "key",
      start: token.bodyStart,
      end: keyEnd,
      prefix: text.slice(token.bodyStart, caret),
      negated: token.negated,
      colon: true,
    };
  }

  const pieces = token.pieces ?? [];
  const piece = pieces.find(
    (candidate) => caret >= candidate.start && caret <= candidate.end,
  );
  if (!piece) return null;

  const def = findKey(keys, token.key ?? "");
  /** @type {SuggestContext} */
  const context = {
    kind: "value",
    start: piece.start,
    end: piece.end,
    prefix: "",
    negated: token.negated,
    key: token.key,
    def,
    taken: pieces
      .filter((other) => other !== piece && other.text !== "")
      .map((other) => other.text),
    operator: false,
    pieceStart: piece.start,
    pieceEnd: piece.end,
  };

  if (piece.quoted) {
    if (caret < piece.start + 1) return null;
    context.prefix = text.slice(piece.start + 1, caret);
    return context;
  }

  let start = piece.start;
  let end = piece.end;
  const operator = COMPARATOR.exec(text.slice(start, end));
  if (operator) {
    start += operator[1].length;
    context.operator = true;
    if (caret < start) return null;
  }
  const dots = text.slice(start, end).indexOf("..");
  if (dots !== -1) {
    context.operator = true;
    if (caret >= start + dots + 2) start += dots + 2;
    else end = start + dots;
  }
  context.start = start;
  context.end = end;
  context.prefix = text.slice(start, caret);
  return context;
}

/**
 * A row of the menu.
 * @typedef {Object} TokenSuggestion
 * @property {"key" | "value" | "preset" | "recent"} kind
 * @property {string} text What the row shows.
 * @property {string} value What a choice writes: a key (the colon is added), a value (quoted when needed), a whole piece for a `preset`, or a whole query for `recent`.
 * @property {string} [secondary] Muted text.
 * @property {boolean} [disabled]
 */

const ASCII = /^[\t\n\r -~]*$/;

/**
 * Lowercase and drop accents, so "jose" finds "José".
 * @param {string | undefined} text
 */
export function foldText(text) {
  if (!text) return "";
  if (ASCII.test(text)) return text.toLowerCase();
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

const WORD_EDGE = /[\s._\-@]/;

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

/** @type {WeakMap<object, { text: string[], secondary: string[] }>} */
const folded = new WeakMap();

/**
 * Items that match `query`, best first, at most `limit`: a prefix of the
 * text beats the start of a later word, which beats a substring, which beats
 * a match on `secondary` only. Ties keep the order of the list. A single
 * pass drops each hit into a bucket and stops once the best bucket is full,
 * and the folded copies are cached per array, so a keystroke on 10,000
 * users allocates little beyond the result.
 *
 * @template {{ text: string, secondary?: string, match?: string }} T
 * @param {ReadonlyArray<T>} items
 * @param {string} query
 * @param {number} [limit=8]
 * @returns {T[]}
 */
export function filterSuggestions(items, query, limit = 8) {
  const q = foldText(query.trim());
  if (!q) return items.slice(0, limit);

  let entry = folded.get(items);
  if (!entry) {
    entry = {
      text: items.map((item) => foldText(item.match ?? item.text)),
      secondary: items.map((item) => foldText(item.secondary)),
    };
    folded.set(items, entry);
  }
  /** @type {[T[], T[], T[], T[]]} */
  const buckets = [[], [], [], []];
  for (let i = 0; i < items.length; i++) {
    let bucket = rank(entry.text[i], q);
    if (bucket === -1) {
      const other = entry.secondary[i] ? rank(entry.secondary[i], q) : -1;
      if (other === -1) continue;
      bucket = 3;
    }
    buckets[bucket].push(items[i]);
    if (bucket === 0 && buckets[0].length >= limit) break;
  }
  return buckets.flat().slice(0, limit);
}

/**
 * The keys that match what has been typed of a key.
 * @param {ReadonlyArray<TokenKey>} keys
 * @param {string} prefix
 * @param {number} [limit=8]
 * @returns {TokenSuggestion[]}
 */
export function keyItems(keys, prefix, limit = 8) {
  return filterSuggestions(
    keys.map((def) => ({
      kind: /** @type {const} */ ("key"),
      text: def.label ?? def.key,
      value: def.key,
      secondary: def.description ?? `${def.key}:`,
      match: `${def.key} ${def.label ?? ""}`,
    })),
    prefix,
    limit,
  ).map(({ match: _match, ...row }) => row);
}

/**
 * The date shortcuts offered for a date key. `piece` ones write a whole
 * value, operator and all; the others are an operand.
 * @typedef {Object} DatePreset
 * @property {string} label
 * @property {string} value
 * @property {boolean} [operand] Written after an operator the user typed.
 */

/** @type {ReadonlyArray<DatePreset>} */
export const DEFAULT_DATE_PRESETS = [
  { label: "Today", value: "@today", operand: true },
  { label: "Yesterday", value: "@yesterday", operand: true },
  { label: "Last 7 days", value: ">=@today-7d" },
  { label: "Last 30 days", value: ">=@today-30d" },
  { label: "Last 90 days", value: ">=@today-90d" },
  { label: "Last year", value: ">=@today-1y" },
];

/**
 * Value rows for a key from its static `values`, minus those already in
 * the list. A date key adds the date shortcuts.
 * @param {TokenKey} def
 * @param {string} prefix
 * @param {{ taken?: ReadonlyArray<string>, operator?: boolean, limit?: number, presets?: ReadonlyArray<DatePreset> }} [options]
 * @returns {TokenSuggestion[]}
 */
export function valueItems(def, prefix, options = {}) {
  const { taken = [], operator = false, limit = 8 } = options;
  const used = new Set(taken.map((value) => value.toLowerCase()));

  /** @type {TokenSuggestion[]} */
  const rows = [];
  if (def.type === "date") {
    const presets = (options.presets ?? DEFAULT_DATE_PRESETS).filter(
      (preset) => !operator || preset.operand,
    );
    rows.push(
      ...filterSuggestions(
        presets.map((preset) => ({
          kind: /** @type {const} */ ("preset"),
          text: preset.label,
          value: preset.value,
          secondary: preset.value,
        })),
        prefix,
        limit,
      ),
    );
  }
  const values = (def.values ?? []).map(toTokenValue);
  rows.push(
    ...filterSuggestions(
      values
        .filter((entry) => !used.has(entry.value.toLowerCase()))
        .map((entry) => ({
          kind: /** @type {const} */ ("value"),
          text: entry.label ?? entry.value,
          value: entry.value,
          secondary: entry.description,
        })),
      prefix,
      limit,
    ),
  );
  return rows.slice(0, limit);
}

/**
 * Shape what a function source returned into rows.
 * @param {ReadonlyArray<string | TokenValue>} entries
 * @param {{ taken?: ReadonlyArray<string>, limit?: number }} [options]
 * @returns {TokenSuggestion[]}
 */
export function sourceItems(entries, options = {}) {
  const { taken = [], limit = 8 } = options;
  const used = new Set(taken.map((value) => value.toLowerCase()));
  return entries
    .map(toTokenValue)
    .filter((entry) => !used.has(entry.value.toLowerCase()))
    .slice(0, limit)
    .map((entry) => ({
      kind: /** @type {const} */ ("value"),
      text: entry.label ?? entry.value,
      value: entry.value,
      secondary: entry.description,
    }));
}

/**
 * Recent queries that contain `text`, newest first.
 * @param {ReadonlyArray<string>} queries
 * @param {string} text
 * @param {number} [limit=5]
 * @returns {TokenSuggestion[]}
 */
export function recentItems(queries, text, limit = 5) {
  const needle = foldText(text.trim());
  return queries
    .filter((query) => query !== "" && foldText(query).includes(needle))
    .slice(0, limit)
    .map((query) => ({ kind: "recent", text: query, value: query }));
}

/**
 * What a choice writes.
 * @typedef {Object} Insertion
 * @property {number} start Replace from here...
 * @property {number} end ...to here.
 * @property {string} insert The new text.
 * @property {number} caret Where the caret goes in the new text.
 * @property {boolean} reopen Whether the next menu should open at once: after a key, its values.
 */

/**
 * Write a choice into `text`.
 * @param {string} text The current text.
 * @param {SuggestContext} context
 * @param {TokenSuggestion} item
 * @returns {Insertion}
 */
export function buildInsertion(text, context, item) {
  if (item.kind === "recent") {
    return {
      start: 0,
      end: text.length,
      insert: item.value,
      caret: item.value.length,
      reopen: false,
    };
  }

  if (item.kind === "key") {
    const insert = context.colon ? item.value : `${item.value}:`;
    return {
      start: context.start,
      end: context.end,
      insert,
      caret: context.start + item.value.length + 1,
      reopen: true,
    };
  }

  // A preset is a whole piece, comparison included. A value is an operand
  // when a comparison was typed, else the whole piece.
  const whole = item.kind === "preset" && !context.operator;
  const start = whole ? (context.pieceStart ?? context.start) : context.start;
  const end = whole ? (context.pieceEnd ?? context.end) : context.end;
  const written = item.kind === "preset" ? item.value : formatValue(item.value);
  const next = text.slice(end);
  const space = next === "" ? " " : FOLLOWS.test(next) ? "" : " ";
  return {
    start,
    end,
    insert: written + space,
    caret: start + written.length + space.length,
    reopen: false,
  };
}
