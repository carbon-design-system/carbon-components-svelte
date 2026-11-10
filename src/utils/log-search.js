// @ts-check
// Search a log, and cut a line into the pieces it is drawn in.

import { hasAnsi, parseAnsi } from "./ansi.js";
import { linkSegments } from "./link-segments.js";

/**
 * Most matches kept per line. A 20,000-character line of one repeated letter
 * would otherwise become 20,000 highlights and as many elements.
 */
export const MAX_MATCHES_PER_LINE = 200;

/**
 * Longest line searched for links. Link detection backtracks over a long run
 * of word characters, which a minified bundle or a base64 blob is made of.
 */
export const MAX_LINKIFY_LENGTH = 4000;

/**
 * @typedef {Object} LogMatcher
 * @property {(text: string) => Array<[start: number, end: number]>} ranges
 * Where the query matches in `text`, in order and without overlap.
 */

/**
 * Compile a search query.
 *
 * @param {Object} options
 * @param {string} options.query
 * @param {boolean} [options.regex=false] Read `query` as a regular expression.
 * @param {boolean} [options.caseSensitive=false]
 * @returns {LogMatcher | null | "invalid"} `null` for an empty query, and
 * `"invalid"` for a regular expression that does not parse.
 */
export function createMatcher({ query, regex = false, caseSensitive = false }) {
  if (query === "") return null;

  let pattern;
  try {
    pattern = new RegExp(
      regex ? query : query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      caseSensitive ? "g" : "gi",
    );
  } catch {
    return "invalid";
  }

  return {
    ranges(text) {
      /** @type {Array<[number, number]>} */
      const found = [];
      pattern.lastIndex = 0;
      for (
        let match = pattern.exec(text);
        match !== null && found.length < MAX_MATCHES_PER_LINE;
        match = pattern.exec(text)
      ) {
        // An empty match, such as `a*` between letters, marks nothing.
        if (match[0] === "") pattern.lastIndex++;
        else found.push([match.index, match.index + match[0].length]);
      }
      return found;
    },
  };
}

/**
 * The matches in a stream of lines, kept as lines are added and dropped.
 * Matches are numbered from the first, counting every occurrence in a line.
 *
 * @returns {{
 *   readonly total: number,
 *   reset: (matcher: LogMatcher | null, rows: ReadonlyArray<{ id: number, plain: string }>) => void,
 *   append: (rows: ReadonlyArray<{ id: number, plain: string }>) => void,
 *   trim: (firstId: number) => void,
 *   locate: (n: number) => { id: number, occurrence: number } | null,
 *   position: (id: number, occurrence: number) => number,
 *   firstFrom: (id: number) => number,
 * }}
 */
export function createSearchIndex() {
  /** @type {LogMatcher | null} */
  let matcher = null;
  /** @type {number[]} Ids of the lines that match, ascending. */
  let ids = [];
  /** @type {number[]} How many times each of those lines matches. */
  let counts = [];
  let total = 0;

  /** @param {ReadonlyArray<{ id: number, plain: string }>} rows */
  function scan(rows) {
    if (!matcher) return;
    for (const row of rows) {
      const found = matcher.ranges(row.plain).length;
      if (found === 0) continue;
      ids.push(row.id);
      counts.push(found);
      total += found;
    }
  }

  return {
    get total() {
      return total;
    },

    reset(next, rows) {
      matcher = next;
      ids = [];
      counts = [];
      total = 0;
      scan(rows);
    },

    append: scan,

    trim(firstId) {
      let drop = 0;
      while (drop < ids.length && ids[drop] < firstId) total -= counts[drop++];
      if (drop === 0) return;
      ids = ids.slice(drop);
      counts = counts.slice(drop);
    },

    locate(n) {
      if (n < 0 || n >= total) return null;
      let rest = n;
      for (let i = 0; i < ids.length; i++) {
        if (rest < counts[i]) return { id: ids[i], occurrence: rest };
        rest -= counts[i];
      }
      return null;
    },

    position(id, occurrence) {
      let before = 0;
      for (let i = 0; i < ids.length && ids[i] < id; i++) before += counts[i];
      return before + occurrence;
    },

    firstFrom(id) {
      let before = 0;
      for (let i = 0; i < ids.length && ids[i] < id; i++) before += counts[i];
      return before < total ? before : total - 1;
    },
  };
}

/**
 * Whether `text` is worth searching for links: it holds the start of one, and
 * is short enough for the search not to backtrack for long.
 * @param {string} text
 * @returns {boolean}
 */
function mayLink(text) {
  return (
    text.length <= MAX_LINKIFY_LENGTH &&
    (text.includes("://") || text.includes("mailto:") || text.includes("www."))
  );
}

/**
 * One piece of a line, drawn as one element: text in a single style, which
 * is a link or a match or neither.
 * @typedef {Object} LinePart
 * @property {string} text
 * @property {import("./ansi.js").AnsiStyle | null} style
 * @property {string} [href]
 * @property {0 | 1 | 2} mark `1` for a match, `2` for the current one.
 */

/**
 * Cut a line into the pieces it is drawn in: where its colors change, where
 * a link starts or ends, and where a match starts or ends.
 *
 * @param {Object} line
 * @param {string} line.text The line with its escape sequences.
 * @param {Object} [options]
 * @param {ReadonlyArray<[number, number]>} [options.ranges] Matches, in
 * offsets into the text without escape sequences.
 * @param {number} [options.current] Which of `ranges` is the current match.
 * @param {boolean} [options.links=true] Turn URLs into links.
 * @returns {LinePart[]}
 */
export function lineParts(
  { text },
  { ranges = [], current = -1, links = true } = {},
) {
  const runs = hasAnsi(text) ? parseAnsi(text) : [{ text, style: null }];
  /** @type {LinePart[]} */
  const parts = [];
  let offset = 0;
  let next = 0;

  for (const run of runs) {
    const segments =
      links && mayLink(run.text)
        ? linkSegments(run.text)
        : [{ text: run.text, href: undefined }];

    for (const segment of segments) {
      const end = offset + segment.text.length;
      let at = offset;

      while (next < ranges.length && ranges[next][0] < end) {
        const [from, to] = ranges[next];
        const start = Math.max(from, at);
        const stop = Math.min(to, end);
        if (start > at) {
          parts.push(piece(segment, run, at, start, offset, 0));
        }
        if (stop > start) {
          parts.push(
            piece(segment, run, start, stop, offset, next === current ? 2 : 1),
          );
        }
        at = Math.max(at, stop);
        // A match that runs on into the next segment stays pending.
        if (to > end) break;
        next++;
      }

      if (at < end) parts.push(piece(segment, run, at, end, offset, 0));
      offset = end;
    }
  }

  return parts;
}

/**
 * @param {{ text: string, href?: string }} segment
 * @param {{ style: import("./ansi.js").AnsiStyle | null }} run
 * @param {number} from
 * @param {number} to
 * @param {number} offset
 * @param {0 | 1 | 2} mark
 * @returns {LinePart}
 */
function piece(segment, run, from, to, offset, mark) {
  /** @type {LinePart} */
  const part = {
    text: segment.text.slice(from - offset, to - offset),
    style: run.style,
    mark,
  };
  if (segment.href) part.href = segment.href;
  return part;
}
