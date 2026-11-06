// @ts-check
import { BoundedFifoCache } from "./bounded-fifo-cache.js";
import {
  graphemeCeil,
  graphemeFloor,
  isOneUnitPerGrapheme,
} from "./grapheme-boundary.js";

/**
 * @typedef {{ start: number, end: number }} TextRange
 * @typedef {"substring" | "word-start" | "prefix"} TextMatchMode
 * @typedef {object} TextMatchOptions
 * @property {TextMatchMode} [mode="substring"]
 * @property {boolean} [caseSensitive=false]
 * @property {boolean} [ignoreDiacritics=true]
 * @property {"any" | "all"} [terms="any"]
 * @property {boolean} [split=true]
 */

// Marks that search treats as optional: the combining diacritics, Hebrew points,
// Arabic harakat and the tatweel. Marks of Indic and other scripts carry vowels
// and stay.
const STRIP_RANGES = [
  [0x300, 0x36f],
  [0x591, 0x5bd],
  [0x5bf, 0x5bf],
  [0x5c1, 0x5c2],
  [0x5c4, 0x5c5],
  [0x5c7, 0x5c7],
  [0x610, 0x61a],
  [0x640, 0x640],
  [0x64b, 0x65f],
  [0x670, 0x670],
  [0x6d6, 0x6dc],
  [0x6df, 0x6e4],
  [0x6e7, 0x6e8],
  [0x6ea, 0x6ed],
  [0x1ab0, 0x1aff],
  [0x1dc0, 0x1dff],
  [0x20d0, 0x20ff],
  [0xfe20, 0xfe2f],
];

/**
 * @param {string} value
 * @returns {string} `value` without the marks search treats as optional.
 */
function stripMarks(value) {
  let out = "";
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (
      code < 0x300 ||
      !STRIP_RANGES.some(([lo, hi]) => code >= lo && code <= hi)
    ) {
      out += value[i];
    }
  }
  return out;
}

// Letters with no canonical decomposition that readers still type as the base.
/** @type {Record<string, string>} */
const LETTER_FOLD = {
  ø: "o",
  ł: "l",
  đ: "d",
  ð: "d",
  ħ: "h",
  ŧ: "t",
  æ: "ae",
  œ: "oe",
};
const LETTER_FOLD_PATTERN = /[øłđðħŧæœ]/g;

const NON_ASCII = /[\u0080-\uffff]/;
const WHITESPACE = /\s+/;
const IS_MARK = /^\p{M}/u;
const WORD_CHAR_BEFORE = /[\p{L}\p{N}]$/u;

/**
 * @param {boolean} caseSensitive
 * @param {boolean} ignoreDiacritics
 */
function configIndex(caseSensitive, ignoreDiacritics) {
  return (caseSensitive ? 1 : 0) + (ignoreDiacritics ? 2 : 0);
}

/** One cache per fold configuration; the fold of a string never changes. */
const CLUSTER_CACHES = [0, 1, 2, 3].map(() => new BoundedFifoCache(2048));
const TEXT_CACHES = [0, 1, 2, 3].map(() => new BoundedFifoCache(20000));

/**
 * Fold a base character with its combining marks for matching.
 *
 * @param {string} cluster
 * @param {boolean} caseSensitive
 * @param {boolean} ignoreDiacritics
 * @returns {string}
 */
function foldCluster(cluster, caseSensitive, ignoreDiacritics) {
  const cache = CLUSTER_CACHES[configIndex(caseSensitive, ignoreDiacritics)];
  const cached = cache.get(cluster);
  if (cached !== undefined) return cached;
  // NFKC/NFKD also fold full-width forms, ligatures and superscripts.
  let folded = cluster.normalize(ignoreDiacritics ? "NFKD" : "NFKC");
  // Upper then lower is a full case fold: ß -> ss, ı -> i, ς -> σ, ſ -> s.
  if (!caseSensitive) folded = folded.toUpperCase().toLowerCase();
  if (ignoreDiacritics) {
    folded = stripMarks(folded);
    if (!caseSensitive) {
      folded = folded.replace(LETTER_FOLD_PATTERN, (ch) => LETTER_FOLD[ch]);
    }
  }
  cache.set(cluster, folded);
  return folded;
}

/**
 * @typedef {object} FoldedText
 * @property {string} folded
 * @property {Uint32Array | null} starts - Per folded UTF-16 unit, where its source cluster starts. `null` when folding kept every offset.
 * @property {Uint32Array | null} ends - Per folded unit, where its source cluster ends.
 */

/**
 * @param {string} text
 * @param {boolean} caseSensitive
 * @param {boolean} ignoreDiacritics
 * @returns {FoldedText}
 */
function foldWithMap(text, caseSensitive, ignoreDiacritics) {
  if (!NON_ASCII.test(text)) {
    return {
      folded: caseSensitive ? text : text.toLowerCase(),
      starts: null,
      ends: null,
    };
  }
  const cache = TEXT_CACHES[configIndex(caseSensitive, ignoreDiacritics)];
  const hit = cache.get(text);
  if (hit) return hit;

  let folded = "";
  // The map is only built once a cluster folds to a different length. Until
  // then folded offsets are source offsets, which is the case for most text.
  /** @type {number[] | null} */
  let starts = null;
  /** @type {number[] | null} */
  let ends = null;
  const length = text.length;
  let index = 0;
  while (index < length) {
    // A run of ASCII folds in one call. A letter with a mark after it is not
    // part of the run: it folds with its mark.
    let runEnd = index;
    while (
      runEnd < length &&
      text.charCodeAt(runEnd) < 0x80 &&
      !(runEnd + 1 < length && text.charCodeAt(runEnd + 1) >= 0x300)
    ) {
      runEnd++;
    }
    if (runEnd > index) {
      const run = text.slice(index, runEnd);
      if (starts && ends) {
        for (let k = index; k < runEnd; k++) {
          starts.push(k);
          ends.push(k + 1);
        }
      }
      folded += caseSensitive ? run : run.toLowerCase();
      index = runEnd;
      continue;
    }

    const clusterStart = index;
    const code = /** @type {number} */ (text.codePointAt(index));
    index += code > 0xffff ? 2 : 1;
    // Take the combining marks that follow, so "e" + U+0301 folds as one unit.
    while (index < length && text.charCodeAt(index) >= 0x300) {
      const next = String.fromCodePoint(
        /** @type {number} */ (text.codePointAt(index)),
      );
      if (!IS_MARK.test(next)) break;
      index += next.length;
    }
    const out = foldCluster(
      text.slice(clusterStart, index),
      caseSensitive,
      ignoreDiacritics,
    );
    if (!starts && out.length !== index - clusterStart) {
      starts = [];
      ends = [];
      for (let k = 0; k < folded.length; k++) {
        starts.push(k);
        ends.push(k + 1);
      }
    }
    if (starts && ends) {
      for (let k = 0; k < out.length; k++) {
        starts.push(clusterStart);
        ends.push(index);
      }
    }
    folded += out;
  }
  /** @type {FoldedText} */
  const result = {
    folded,
    starts: starts && Uint32Array.from(starts),
    ends: ends && Uint32Array.from(ends),
  };
  cache.set(text, result);
  return result;
}

/**
 * The form of `text` that search compares: case-folded, with diacritics and
 * width variants folded. Use it to build a search key; offsets into the result
 * do not map to `text` (use `matchText` for ranges).
 *
 * @param {string} text
 * @param {Pick<TextMatchOptions, "caseSensitive" | "ignoreDiacritics">} [options]
 * @returns {string}
 */
export function foldText(text, options = {}) {
  const { caseSensitive = false, ignoreDiacritics = true } = options;
  return foldWithMap(String(text ?? ""), caseSensitive, ignoreDiacritics)
    .folded;
}

/**
 * Sort `ranges` and join those that overlap or touch.
 *
 * @param {ReadonlyArray<TextRange>} ranges
 * @returns {TextRange[]}
 */
export function mergeRanges(ranges) {
  if (ranges.length === 0) return [];
  const sorted = ranges
    .slice()
    .sort((a, b) => a.start - b.start || a.end - b.end);
  /** @type {TextRange[]} */
  const merged = [{ start: sorted[0].start, end: sorted[0].end }];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const range = sorted[i];
    if (range.start <= last.end) {
      if (range.end > last.end) last.end = range.end;
    } else {
      merged.push({ start: range.start, end: range.end });
    }
  }
  return merged;
}

/**
 * Make ranges safe to render against `text`: clamp to its length, drop empty
 * ones, widen each to whole graphemes (a match inside an emoji or a base letter
 * with its marks covers all of it), and merge.
 *
 * @param {string} text
 * @param {ReadonlyArray<TextRange> | null | undefined} ranges
 * @returns {TextRange[]}
 */
export function normalizeRanges(text, ranges) {
  if (!ranges || ranges.length === 0) return [];
  const length = text.length;
  const trivial = isOneUnitPerGrapheme(text);
  /** @type {TextRange[]} */
  const clean = [];
  for (const range of ranges) {
    let start = Math.max(0, Math.min(length, Math.floor(range.start)));
    let end = Math.max(0, Math.min(length, Math.floor(range.end)));
    if (!(end > start)) continue;
    if (!trivial) {
      start = graphemeFloor(text, start);
      end = graphemeCeil(text, end);
    }
    clean.push({ start, end });
  }
  return mergeRanges(clean);
}

/**
 * Turn ascending character indices (as `fuzzyMatch` returns) into ranges.
 *
 * @param {ReadonlyArray<number> | null | undefined} indices
 * @returns {TextRange[]}
 */
export function indicesToRanges(indices) {
  if (!indices || indices.length === 0) return [];
  /** @type {TextRange[]} */
  const ranges = [];
  // A custom matcher may hand them back unsorted.
  const sorted = indices.some((index, i) => i > 0 && index < indices[i - 1])
    ? indices.slice().sort((a, b) => a - b)
    : indices;
  let start = sorted[0];
  let end = start + 1;
  for (let i = 1; i < sorted.length; i++) {
    const index = sorted[i];
    if (index === end) {
      end++;
    } else if (index > end) {
      ranges.push({ start, end });
      start = index;
      end = index + 1;
    }
  }
  ranges.push({ start, end });
  return ranges;
}

/**
 * Cut `text` into runs at the edges of `ranges`. The runs concatenate back to
 * `text`.
 *
 * @param {string} text
 * @param {ReadonlyArray<TextRange>} ranges - Normalized (sorted, disjoint).
 * @returns {Array<{ text: string, match: boolean }>}
 */
export function splitByRanges(text, ranges) {
  if (ranges.length === 0) return text ? [{ text, match: false }] : [];
  /** @type {Array<{ text: string, match: boolean }>} */
  const parts = [];
  let cursor = 0;
  for (const { start, end } of ranges) {
    if (start > cursor) {
      parts.push({ text: text.slice(cursor, start), match: false });
    }
    parts.push({ text: text.slice(start, end), match: true });
    cursor = end;
  }
  if (cursor < text.length) {
    parts.push({ text: text.slice(cursor), match: false });
  }
  return parts;
}

/**
 * @param {string} folded
 * @param {number} index
 * @returns {boolean}
 */
function startsWord(folded, index) {
  if (index === 0) return true;
  return !WORD_CHAR_BEFORE.test(folded.slice(Math.max(0, index - 2), index));
}

/**
 * @param {string | ReadonlyArray<string> | null | undefined} query
 * @param {boolean} caseSensitive
 * @param {boolean} ignoreDiacritics
 * @param {boolean} split
 * @returns {string[]}
 */
function foldTerms(query, caseSensitive, ignoreDiacritics, split) {
  /** @type {string[]} */
  const terms = [];
  const list = Array.isArray(query) ? query : [query];
  for (const raw of list) {
    if (raw == null) continue;
    const folded = foldText(String(raw), { caseSensitive, ignoreDiacritics });
    // Fold before splitting: U+3000 and U+00A0 become plain spaces.
    const pieces =
      Array.isArray(query) || !split
        ? [folded.trim()]
        : folded.split(WHITESPACE);
    for (const piece of pieces) {
      if (piece && !terms.includes(piece)) terms.push(piece);
    }
  }
  return terms;
}

/**
 * Compile `query` once and match many texts against it. Reuse the matcher
 * across a list: the query is folded and split once, not per item.
 *
 * @param {string | ReadonlyArray<string> | null | undefined} query - A string is split on whitespace into terms (unless `split` is `false`); an array is a list of terms or phrases used as-is.
 * @param {TextMatchOptions} [options]
 * @returns {(text: string) => TextRange[]}
 */
export function createTextMatcher(query, options = {}) {
  const {
    mode = "substring",
    caseSensitive = false,
    ignoreDiacritics = true,
    terms: termMode = "any",
    split = true,
  } = options;
  const terms = foldTerms(query, caseSensitive, ignoreDiacritics, split);
  if (terms.length === 0) return () => [];
  const requireAll = termMode === "all";

  return (text) => {
    const source = String(text ?? "");
    if (source === "") return [];
    const { folded, starts, ends } = foldWithMap(
      source,
      caseSensitive,
      ignoreDiacritics,
    );
    /** @type {TextRange[]} */
    const found = [];
    for (const term of terms) {
      let any = false;
      if (mode === "prefix") {
        if (folded.startsWith(term)) {
          found.push({ start: 0, end: term.length });
          any = true;
        }
      } else {
        let from = 0;
        let index = folded.indexOf(term, from);
        while (index !== -1) {
          if (mode === "substring" || startsWord(folded, index)) {
            found.push({ start: index, end: index + term.length });
            any = true;
            from = index + term.length;
          } else {
            from = index + 1;
          }
          index = folded.indexOf(term, from);
        }
      }
      if (!any && requireAll) return [];
    }
    if (found.length === 0) return [];
    return finish(source, found, starts, ends);
  };
}

/**
 * Map ranges over the folded text back to the original string and clean them.
 *
 * @param {string} source
 * @param {TextRange[]} found
 * @param {Uint32Array | null} starts
 * @param {Uint32Array | null} ends
 * @returns {TextRange[]}
 */
function finish(source, found, starts, ends) {
  if (!starts || !ends) return normalizeRanges(source, found);
  return normalizeRanges(
    source,
    found.map((range) => ({
      start: starts[range.start],
      end: ends[range.end - 1],
    })),
  );
}

/** @type {string} */
let lastKey = "";
/** @type {((text: string) => TextRange[]) | null} */
let lastMatcher = null;

/**
 * Find where `query` occurs in `text`. Matching ignores case and diacritics and
 * treats full-width, ligature and compatibility forms as their plain letters,
 * and the ranges are offsets into the original `text` (UTF-16 units, on grapheme
 * boundaries), so they apply to `text` as the user sees it.
 *
 * Calls with the same query and options reuse one compiled matcher. To match a
 * list, call `createTextMatcher` once and apply it to each item.
 *
 * @param {string} text
 * @param {string | ReadonlyArray<string> | null | undefined} query
 * @param {TextMatchOptions} [options]
 * @returns {TextRange[]} Sorted, disjoint ranges. Empty when nothing matches.
 */
export function matchText(text, query, options = {}) {
  const key = `${Array.isArray(query) ? `a${query.join("\u0000")}` : `s${query ?? ""}`}\u0001${options.mode ?? ""}${options.caseSensitive ? 1 : 0}${options.ignoreDiacritics === false ? 0 : 1}${options.terms ?? ""}${options.split === false ? 0 : 1}`;
  if (key !== lastKey || !lastMatcher) {
    lastMatcher = createTextMatcher(query, options);
    lastKey = key;
  }
  return lastMatcher(text);
}

/**
 * @typedef {object} FuzzyTextMatch
 * @property {boolean} matched - Whether `query` matches `text` at or above `threshold`.
 * @property {number} score - Quality from 0 to 1; higher is better. 0 for an empty query.
 * @property {TextRange[]} ranges - What to highlight, as offsets into the original text.
 */

// The tiers match `fuzzyMatch`, so a score from either ranks alike.
const QUALITY = {
  exact: 1,
  prefix: 0.9,
  wordStart: 0.7,
  midWord: 0.5,
  subsequenceBase: 0.2,
  subsequenceSpan: 0.2,
};

/**
 * @typedef {object} FuzzyTextOptions
 * @property {number} [threshold=0]
 * @property {boolean} [caseSensitive=false]
 * @property {boolean} [ignoreDiacritics=true]
 */

/**
 * Compile a fuzzy `query` to match many texts. A contiguous occurrence wins
 * (a prefix, then a word start, then the earliest); otherwise the characters
 * match as a subsequence, narrowed to the tightest window.
 *
 * @param {string} query
 * @param {FuzzyTextOptions} [options]
 * @returns {(text: string) => FuzzyTextMatch}
 */
export function createFuzzyTextMatcher(query, options = {}) {
  const {
    threshold = 0,
    caseSensitive = false,
    ignoreDiacritics = true,
  } = options;
  const needle = foldText(String(query ?? "").trim(), {
    caseSensitive,
    ignoreDiacritics,
  });
  if (needle === "") return () => ({ matched: true, score: 0, ranges: [] });
  const letters = [...needle];

  return (text) => {
    const source = String(text ?? "");
    const { folded, starts, ends } = foldWithMap(
      source,
      caseSensitive,
      ignoreDiacritics,
    );

    // Best contiguous occurrence.
    let bestIndex = -1;
    let bestRank = -1;
    let index = folded.indexOf(needle);
    while (index !== -1) {
      const rank = index === 0 ? 3 : startsWord(folded, index) ? 2 : 1;
      if (rank > bestRank) {
        bestRank = rank;
        bestIndex = index;
        if (rank === 3) break;
      }
      index = folded.indexOf(needle, index + 1);
    }

    /** @type {TextRange[]} */
    let found = [];
    let score = 0;
    if (bestIndex === -1) {
      // Forward pass finds where the match ends; the backward pass walks
      // from there to the tightest start.
      let position = 0;
      let last = -1;
      for (const letter of letters) {
        const at = folded.indexOf(letter, position);
        if (at === -1) return { matched: false, score: 0, ranges: [] };
        last = at;
        position = at + letter.length;
      }
      /** @type {number[]} */
      const at = new Array(letters.length);
      let limit = last;
      for (let i = letters.length - 1; i >= 0; i--) {
        // The final letter sits at `last`; earlier ones end at or before the next.
        const place =
          i === letters.length - 1
            ? last
            : folded.lastIndexOf(letters[i], limit - letters[i].length);
        at[i] = place;
        limit = place;
      }
      let adjacent = 0;
      for (let i = 0; i < letters.length; i++) {
        const start = at[i];
        const end = start + letters[i].length;
        const previous = found[found.length - 1];
        if (previous && previous.end === start) {
          previous.end = end;
          adjacent++;
        } else {
          found.push({ start, end });
        }
      }
      score =
        letters.length <= 1
          ? QUALITY.subsequenceBase
          : QUALITY.subsequenceBase +
            (QUALITY.subsequenceSpan * adjacent) / (letters.length - 1);
    } else {
      found = [{ start: bestIndex, end: bestIndex + needle.length }];
      score =
        bestRank === 3
          ? needle.length === folded.length
            ? QUALITY.exact
            : QUALITY.prefix
          : bestRank === 2
            ? QUALITY.wordStart
            : QUALITY.midWord;
    }
    return {
      matched: score >= threshold,
      score,
      ranges: finish(source, found, starts, ends),
    };
  };
}

/**
 * Fuzzy-match `query` against `text`, ignoring case and diacritics, and return
 * the score and what to highlight. Unlike `fuzzyMatch`, the ranges are offsets
 * into the original text, so they stay correct for `İ`, `ß`, combining marks and
 * astral characters.
 *
 * @param {string} text
 * @param {string} query
 * @param {FuzzyTextOptions} [options]
 * @returns {FuzzyTextMatch}
 */
export function fuzzyMatchText(text, query, options = {}) {
  return createFuzzyTextMatcher(query, options)(text);
}
