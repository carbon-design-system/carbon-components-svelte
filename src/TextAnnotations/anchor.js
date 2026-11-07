/**
 * Text-quote anchoring, as in Hypothesis and the W3C Web Annotation
 * `TextQuoteSelector`: an annotation stores the offsets it was made at, the
 * text it covered (`quote`) and a little text on each side (`prefix`,
 * `suffix`). When the text changes, the offsets are checked first, then the
 * quote is searched for, then a close match to it.
 *
 * Pure: strings in, offsets out, no DOM. Offsets are UTF-16 code units into
 * the text of the container, which is the text nodes in document order.
 */

export const CONTEXT_LENGTH = 32;

// A quote longer than this is matched approximately by its head and tail,
// which keeps the edit-distance table small.
const FUZZY_LIMIT = 240;
const FUZZY_PART = 120;
// How far from the old offset an approximate match is searched for first.
const FUZZY_WINDOW = 800;
// The most table cells the whole-text approximate search may fill.
const FUZZY_CELLS = 6_000_000;

/**
 * @typedef {object} TextRange
 * @property {number} start
 * @property {number} end
 */

/**
 * @typedef {object} TextAnchor
 * @property {TextRange} range
 * @property {string} quote
 * @property {string} [prefix]
 * @property {string} [suffix]
 */

/**
 * @typedef {"exact" | "moved" | "fuzzy" | "orphaned"} AnchorStatus
 */

/**
 * @typedef {object} AnchorResult
 * @property {number} start
 * @property {number} end
 * @property {AnchorStatus} status
 */

/**
 * Describe the text between two offsets as an anchor.
 * @param {string} text
 * @param {number} start
 * @param {number} end
 * @param {{ context?: number }} [options]
 * @returns {Required<TextAnchor>}
 */
export function createAnchor(text, start, end, options = {}) {
  const context = options.context ?? CONTEXT_LENGTH;
  const from = clampOffset(Math.min(start, end), text);
  const to = clampOffset(Math.max(start, end), text);
  return {
    range: { start: from, end: to },
    quote: text.slice(from, to),
    prefix: text.slice(Math.max(0, from - context), from),
    suffix: text.slice(to, to + context),
  };
}

/**
 * Where an anchor sits in `text` now. `exact` when the offsets still hold
 * its quote, `moved` when the quote is somewhere else, `fuzzy` when only a
 * close match to it is left, and `orphaned` when nothing is.
 * @param {string} text
 * @param {TextAnchor} anchor
 * @param {{ maxDistance?: number }} [options] The share of the quote that may differ, from 0 to 1. Default 0.3.
 * @returns {AnchorResult}
 */
export function locateAnchor(text, anchor, options = {}) {
  const { quote } = anchor;
  const { start, end } = anchor.range;
  if (!quote) return orphaned(start);

  if (text.slice(start, end) === quote) {
    return { start, end, status: "exact" };
  }

  const hit = bestExactHit(text, anchor);
  if (hit !== -1) {
    return { start: hit, end: hit + quote.length, status: "moved" };
  }

  const found = approximateHit(
    text,
    anchor,
    options.maxDistance === undefined ? 0.3 : options.maxDistance,
  );
  if (found) return { ...found, status: "fuzzy" };
  return orphaned(start);
}

/**
 * @param {number} start
 * @returns {AnchorResult}
 */
function orphaned(start) {
  return { start, end: start, status: "orphaned" };
}

/**
 * Anchor several annotations to `text`. The result is in the order given.
 * @param {string} text
 * @param {ReadonlyArray<TextAnchor>} anchors
 * @param {{ maxDistance?: number }} [options]
 * @returns {AnchorResult[]}
 */
export function locateAnchors(text, anchors, options = {}) {
  return anchors.map((anchor) => locateAnchor(text, anchor, options));
}

/** @param {number} offset @param {string} text */
function clampOffset(offset, text) {
  return Math.max(0, Math.min(text.length, Math.floor(offset) || 0));
}

/**
 * The occurrence of the quote that best fits the anchor, or -1. An
 * occurrence scores by the context it shares and by how near it is to the
 * old offset.
 * @param {string} text
 * @param {TextAnchor} anchor
 */
function bestExactHit(text, anchor) {
  const { quote, prefix = "", suffix = "" } = anchor;
  const { start } = anchor.range;
  let best = -1;
  let bestScore = -1;
  let at = text.indexOf(quote);
  const contextLength = prefix.length + suffix.length;
  while (at !== -1) {
    const before = text.slice(Math.max(0, at - prefix.length), at);
    const after = text.slice(
      at + quote.length,
      at + quote.length + suffix.length,
    );
    const shared =
      commonSuffixLength(before, prefix) + commonPrefixLength(after, suffix);
    const context = contextLength ? shared / contextLength : 0;
    const nearness = 1 - Math.min(1, Math.abs(at - start) / (text.length || 1));
    // Context decides between occurrences; nearness breaks a tie.
    const score = context * 2 + nearness;
    if (score > bestScore) {
      bestScore = score;
      best = at;
    }
    at = text.indexOf(quote, at + 1);
  }
  return best;
}

/** @param {string} a @param {string} b */
function commonPrefixLength(a, b) {
  const max = Math.min(a.length, b.length);
  let i = 0;
  while (i < max && a.charCodeAt(i) === b.charCodeAt(i)) i++;
  return i;
}

/** @param {string} a @param {string} b */
function commonSuffixLength(a, b) {
  const max = Math.min(a.length, b.length);
  let i = 0;
  while (
    i < max &&
    a.charCodeAt(a.length - 1 - i) === b.charCodeAt(b.length - 1 - i)
  ) {
    i++;
  }
  return i;
}

/**
 * @param {string} text
 * @param {TextAnchor} anchor
 * @param {number} maxDistance
 * @returns {TextRange | null}
 */
function approximateHit(text, anchor, maxDistance) {
  const { quote } = anchor;
  const { start } = anchor.range;
  // Too short to tell an edit from a different word.
  if (quote.length < 4 || maxDistance <= 0) return null;

  if (quote.length > FUZZY_LIMIT) {
    return approximateLong(text, quote, start, maxDistance);
  }
  return approximateIn(text, quote, start, maxDistance);
}

/**
 * Match the head and tail of a long quote, then take the span between.
 * @param {string} text
 * @param {string} quote
 * @param {number} start
 * @param {number} maxDistance
 * @returns {TextRange | null}
 */
function approximateLong(text, quote, start, maxDistance) {
  const head = approximateIn(
    text,
    quote.slice(0, FUZZY_PART),
    start,
    maxDistance,
  );
  if (!head) return null;
  const tailLength = quote.length - FUZZY_PART;
  const tail = approximateIn(
    text,
    quote.slice(-FUZZY_PART),
    head.start + tailLength,
    maxDistance,
  );
  if (!tail || tail.end <= head.start) return null;
  const span = tail.end - head.start;
  if (span < quote.length * 0.5 || span > quote.length * 1.5) return null;
  return { start: head.start, end: tail.end };
}

/**
 * Search near `around` first, then the whole text.
 * @param {string} text
 * @param {string} pattern
 * @param {number} around
 * @param {number} maxDistance
 * @returns {TextRange | null}
 */
function approximateIn(text, pattern, around, maxDistance) {
  const allowed = Math.floor(pattern.length * maxDistance);
  const pad = Math.max(FUZZY_WINDOW, pattern.length);
  const from = Math.max(0, around - pad);
  const to = Math.min(text.length, around + pattern.length + pad);
  const near = sellers(text, from, to, pattern, allowed, around);
  if (near) return near;
  if (from === 0 && to === text.length) return null;
  if (text.length * pattern.length > FUZZY_CELLS) return null;
  return sellers(text, 0, text.length, pattern, allowed, around);
}

/**
 * Approximate substring search (Sellers): the substring of
 * `text[from, to)` closest to `pattern` by edit distance, if within
 * `allowed` edits. Each cell remembers where its alignment starts, so the
 * match comes back as a range. Ties go to the match nearest `around`.
 * @param {string} text
 * @param {number} from
 * @param {number} to
 * @param {string} pattern
 * @param {number} allowed
 * @param {number} around
 * @returns {TextRange | null}
 */
function sellers(text, from, to, pattern, allowed, around) {
  const m = pattern.length;
  let cost = new Int32Array(m + 1);
  let origin = new Int32Array(m + 1);
  let nextCost = new Int32Array(m + 1);
  let nextOrigin = new Int32Array(m + 1);
  for (let i = 0; i <= m; i++) {
    cost[i] = i;
    origin[i] = from;
  }
  let bestCost = allowed + 1;
  /** @type {TextRange | null} */
  let best = null;
  for (let j = from; j < to; j++) {
    const c = text.charCodeAt(j);
    nextCost[0] = 0;
    nextOrigin[0] = j + 1;
    for (let i = 1; i <= m; i++) {
      let value = cost[i - 1] + (pattern.charCodeAt(i - 1) === c ? 0 : 1);
      let source = origin[i - 1];
      const skipText = cost[i] + 1;
      if (skipText < value) {
        value = skipText;
        source = origin[i];
      }
      const skipPattern = nextCost[i - 1] + 1;
      if (skipPattern < value) {
        value = skipPattern;
        source = nextOrigin[i - 1];
      }
      nextCost[i] = value;
      nextOrigin[i] = source;
    }
    const end = j + 1;
    const value = nextCost[m];
    if (value <= allowed && end > nextOrigin[m]) {
      const start = nextOrigin[m];
      if (
        !best ||
        value < bestCost ||
        (value === bestCost && isCloser(start, end, best, around, m))
      ) {
        bestCost = value;
        best = { start, end };
      }
    }
    [cost, nextCost] = [nextCost, cost];
    [origin, nextOrigin] = [nextOrigin, origin];
  }
  return best;
}

/**
 * Whether a match of equal cost is a better pick: nearer the old offset,
 * then closer to the pattern's length.
 * @param {number} start
 * @param {number} end
 * @param {TextRange} best
 * @param {number} around
 * @param {number} length
 */
function isCloser(start, end, best, around, length) {
  const distance = Math.abs(start - around);
  const bestDistance = Math.abs(best.start - around);
  if (distance !== bestDistance) return distance < bestDistance;
  return (
    Math.abs(end - start - length) < Math.abs(best.end - best.start - length)
  );
}
