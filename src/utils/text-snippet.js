// @ts-check
import { graphemeCeil, graphemeFloor } from "./grapheme-boundary.js";
import { normalizeRanges } from "./text-match.js";

/**
 * @typedef {import("./text-match.js").TextRange} TextRange
 * @typedef {object} TextSnippetOptions
 * @property {number} [maxLength=120] - The most UTF-16 units the snippet may have, ellipses included.
 * @property {number} [context=24] - Units to keep on each side of a match.
 * @property {string} [ellipsis="…"]
 * @property {string} [separator] - Joins the windows of separate matches. Defaults to the ellipsis between spaces.
 * @typedef {object} TextSnippet
 * @property {string} text
 * @property {TextRange[]} ranges - The matches that fit, as offsets into `text`.
 * @property {boolean} truncated - Whether any of the source text was left out.
 */

const SPACE = /\s/;

/**
 * Earliest word start in `[from, limit]`, or the first grapheme boundary there.
 *
 * @param {string} text
 * @param {number} from
 * @param {number} limit - The cut may not pass this (the first match).
 * @returns {number}
 */
function snapStart(text, from, limit) {
  if (from <= 0) return 0;
  for (let i = from; i <= limit; i++) {
    if (i === 0 || (SPACE.test(text[i - 1]) && !SPACE.test(text[i] ?? ""))) {
      return i;
    }
  }
  return Math.min(graphemeCeil(text, from), limit);
}

/**
 * Latest word end in `[limit, from]`, or the last grapheme boundary there.
 *
 * @param {string} text
 * @param {number} from
 * @param {number} limit - The cut may not come before this (the last match end).
 * @returns {number}
 */
function snapEnd(text, from, limit) {
  if (from >= text.length) return text.length;
  for (let i = from; i >= limit; i--) {
    if (i === text.length || SPACE.test(text[i])) return i;
  }
  return Math.max(graphemeFloor(text, from), limit);
}

/**
 * @typedef {{ start: number, end: number, first: number, last: number, ranges: TextRange[] }} Window
 */

/**
 * Windows around `matches`, `context` wide, with those that nearly touch joined
 * and the edges moved in to word boundaries.
 *
 * @param {string} text
 * @param {TextRange[]} matches
 * @param {number} context
 * @param {number} gap - Windows closer than this are joined.
 * @returns {Window[]}
 */
function layoutWindows(text, matches, context, gap) {
  /** @type {Window[]} */
  const windows = [];
  for (const match of matches) {
    const start = Math.max(0, match.start - context);
    const end = Math.min(text.length, match.end + context);
    const previous = windows[windows.length - 1];
    if (previous && start <= previous.end + gap) {
      previous.end = Math.max(previous.end, end);
      previous.last = Math.max(previous.last, match.end);
      previous.ranges.push(match);
    } else {
      windows.push({
        start,
        end,
        first: match.start,
        last: match.end,
        ranges: [match],
      });
    }
  }
  for (const window of windows) {
    window.start = snapStart(text, window.start, window.first);
    window.end = snapEnd(text, window.end, window.last);
  }
  return windows;
}

/**
 * @param {string} text
 * @param {Window[]} windows
 * @param {number} ellipsisLength
 * @param {number} separatorLength
 * @returns {number}
 */
function layoutLength(text, windows, ellipsisLength, separatorLength) {
  let length = 0;
  for (const window of windows) length += window.end - window.start;
  length += (windows.length - 1) * separatorLength;
  if (windows[0].start > 0) length += ellipsisLength;
  if (windows[windows.length - 1].end < text.length) length += ellipsisLength;
  return length;
}

/**
 * Cut a long `text` down to the parts around its matches. Each match keeps
 * `context` units on both sides, edges move in to word boundaries (and to
 * grapheme boundaries inside a long unbroken word), and an ellipsis marks what
 * was cut. When several matches fit, their windows are joined; the first match
 * always shows.
 *
 * The result's `ranges` are offsets into the snippet, ready for `Highlight`.
 *
 * @param {string} text
 * @param {ReadonlyArray<TextRange> | null | undefined} ranges - Matches in `text`, as `matchText` returns.
 * @param {TextSnippetOptions} [options]
 * @returns {TextSnippet}
 */
export function textSnippet(text, ranges, options = {}) {
  const source = String(text ?? "");
  const { maxLength = 120, context = 24, ellipsis = "…" } = options;
  const separator = options.separator ?? ` ${ellipsis} `;
  const matches = normalizeRanges(source, ranges);

  if (source.length <= maxLength) {
    return { text: source, ranges: matches, truncated: false };
  }

  if (matches.length === 0) {
    const end = snapEnd(source, Math.max(0, maxLength - ellipsis.length), 0);
    return {
      text: `${source.slice(0, end).trimEnd()}${ellipsis}`,
      ranges: [],
      truncated: true,
    };
  }

  // The first match decides the context: shrink it until that window fits.
  let c = context;
  /** @type {Window[]} */
  let windows = layoutWindows(source, [matches[0]], c, separator.length);
  while (
    c > 0 &&
    layoutLength(source, windows, ellipsis.length, separator.length) > maxLength
  ) {
    c = Math.floor(c * 0.6);
    windows = layoutWindows(source, [matches[0]], c, separator.length);
  }

  if (
    layoutLength(source, windows, ellipsis.length, separator.length) > maxLength
  ) {
    // The match alone is longer than the room: show its head.
    const first = matches[0];
    const lead = first.start > 0 ? ellipsis : "";
    const room = Math.max(0, maxLength - lead.length - ellipsis.length);
    const end = Math.max(
      first.start,
      graphemeFloor(source, first.start + room),
    );
    const cut = source.slice(first.start, end);
    return {
      text: `${lead}${cut}${end < source.length ? ellipsis : ""}`,
      ranges: [{ start: lead.length, end: lead.length + cut.length }],
      truncated: true,
    };
  }

  for (let count = 2; count <= matches.length; count++) {
    const next = layoutWindows(
      source,
      matches.slice(0, count),
      c,
      separator.length,
    );
    if (
      layoutLength(source, next, ellipsis.length, separator.length) > maxLength
    ) {
      break;
    }
    windows = next;
  }

  let out = "";
  /** @type {TextRange[]} */
  const mapped = [];
  windows.forEach((window, index) => {
    if (index === 0) {
      if (window.start > 0) out += ellipsis;
    } else {
      out += separator;
    }
    const base = out.length - window.start;
    for (const range of window.ranges) {
      mapped.push({ start: base + range.start, end: base + range.end });
    }
    out += source.slice(window.start, window.end);
  });
  if (windows[windows.length - 1].end < source.length) out += ellipsis;

  return { text: out, ranges: mapped, truncated: true };
}
