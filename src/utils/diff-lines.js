// @ts-check
// A dependency-free sequence diff: Myers' O(ND) algorithm in linear space
// (the divide and conquer of GNU diff), after the trims git and GNU diff make:
// common ends first, then every element that has no twin on the other side.
// Words inside a changed line use the same engine.

/**
 * A run of difference. Both ranges are half-open. The elements of
 * `a[aStart, aEnd)` are replaced by `b[bStart, bEnd)`; either side may be empty.
 *
 * @typedef {Object} DiffBlock
 * @property {number} aStart
 * @property {number} aEnd
 * @property {number} bStart
 * @property {number} bEnd
 */

/**
 * @typedef {Object} DiffSequenceOptions
 * @property {boolean} [ignoreWhitespace] Compare strings with all whitespace removed.
 * @property {number} [maxCost] Edit steps one split may take before it settles
 * for a good split over the best one. The diff stays valid, but may be longer than
 * the shortest. Defaults to 4096, which bounds the worst case near 100 ms.
 * @property {boolean} [minimal] Never settle: always the shortest diff.
 */

/** Default for `maxCost`, the limit GNU diff uses at this scale. */
export const DEFAULT_MAX_COST = 4096;

const OFFSET_MAX = 0x7fffffff;
const WHITESPACE = /\s+/g;

/**
 * @typedef {Object} Split
 * @property {number} xmid
 * @property {number} ymid
 * @property {boolean} loMinimal
 * @property {boolean} hiMinimal
 */

/**
 * Find where the shortest path through `xv[xoff, xlim)` against `yv[yoff, ylim)`
 * crosses its middle, searching from both corners at once. Past `maxCost`
 * steps it returns the point that has made the most progress.
 *
 * @param {Int32Array} xv
 * @param {Int32Array} yv
 * @param {number} xoff
 * @param {number} xlim
 * @param {number} yoff
 * @param {number} ylim
 * @param {boolean} minimal
 * @param {Int32Array} fd Furthest-reaching x per forward diagonal.
 * @param {Int32Array} bd Furthest-reaching x per backward diagonal.
 * @param {number} base Index of diagonal 0 in `fd` and `bd`.
 * @param {number} maxCost
 * @param {Split} out
 */
function findSplit(
  xv,
  yv,
  xoff,
  xlim,
  yoff,
  ylim,
  minimal,
  fd,
  bd,
  base,
  maxCost,
  out,
) {
  const dmin = xoff - ylim;
  const dmax = xlim - yoff;
  const fmid = xoff - yoff;
  const bmid = xlim - ylim;
  let fmin = fmid;
  let fmax = fmid;
  let bmin = bmid;
  let bmax = bmid;
  const odd = ((fmid - bmid) & 1) !== 0;

  fd[base + fmid] = xoff;
  bd[base + bmid] = xlim;

  for (let cost = 1; ; cost++) {
    if (fmin > dmin) fd[base + --fmin - 1] = -1;
    else ++fmin;
    if (fmax < dmax) fd[base + ++fmax + 1] = -1;
    else --fmax;

    for (let d = fmax; d >= fmin; d -= 2) {
      const tlo = fd[base + d - 1];
      const thi = fd[base + d + 1];
      const x0 = tlo < thi ? thi : tlo + 1;
      let x = x0;
      let y = x0 - d;
      while (x < xlim && y < ylim && xv[x] === yv[y]) {
        x++;
        y++;
      }
      fd[base + d] = x;
      if (odd && bmin <= d && d <= bmax && bd[base + d] <= x) {
        out.xmid = x;
        out.ymid = y;
        out.loMinimal = out.hiMinimal = true;
        return;
      }
    }

    if (bmin > dmin) bd[base + --bmin - 1] = OFFSET_MAX;
    else ++bmin;
    if (bmax < dmax) bd[base + ++bmax + 1] = OFFSET_MAX;
    else --bmax;

    for (let d = bmax; d >= bmin; d -= 2) {
      const tlo = bd[base + d - 1];
      const thi = bd[base + d + 1];
      const x0 = tlo < thi ? tlo : thi - 1;
      let x = x0;
      let y = x0 - d;
      while (xoff < x && yoff < y && xv[x - 1] === yv[y - 1]) {
        x--;
        y--;
      }
      bd[base + d] = x;
      if (!odd && fmin <= d && d <= fmax && x <= fd[base + d]) {
        out.xmid = x;
        out.ymid = y;
        out.loMinimal = out.hiMinimal = true;
        return;
      }
    }

    if (minimal || cost < maxCost) continue;

    // Gone well past the call of duty: split at the diagonal that has come
    // furthest from either corner. The halves are no longer known minimal.
    let fxybest = -1;
    let fxbest = 0;
    for (let d = fmax; d >= fmin; d -= 2) {
      let x = Math.min(fd[base + d], xlim);
      let y = x - d;
      if (ylim < y) {
        x = ylim + d;
        y = ylim;
      }
      if (fxybest < x + y) {
        fxybest = x + y;
        fxbest = x;
      }
    }
    let bxybest = OFFSET_MAX;
    let bxbest = 0;
    for (let d = bmax; d >= bmin; d -= 2) {
      let x = Math.max(xoff, bd[base + d]);
      let y = x - d;
      if (y < yoff) {
        x = yoff + d;
        y = yoff;
      }
      if (x + y < bxybest) {
        bxybest = x + y;
        bxbest = x;
      }
    }
    if (xlim + ylim - bxybest < fxybest - (xoff + yoff)) {
      out.xmid = fxbest;
      out.ymid = fxybest - fxbest;
      out.loMinimal = true;
      out.hiMinimal = false;
    } else {
      out.xmid = bxbest;
      out.ymid = bxybest - bxbest;
      out.loMinimal = false;
      out.hiMinimal = true;
    }
    return;
  }
}

/**
 * Mark the elements of `xv` and `yv` that no common subsequence keeps.
 *
 * @param {Int32Array} xv
 * @param {Int32Array} yv
 * @param {Uint8Array} changedX
 * @param {Uint8Array} changedY
 * @param {number} maxCost
 * @param {boolean} minimal
 */
function markChanged(xv, yv, changedX, changedY, maxCost, minimal) {
  const diagonals = xv.length + yv.length + 3;
  const fd = new Int32Array(diagonals);
  const bd = new Int32Array(diagonals);
  const base = yv.length + 1;
  /** @type {Split} */
  const split = { xmid: 0, ymid: 0, loMinimal: false, hiMinimal: false };

  // An explicit stack: a run of uneven splits would reach thousands of frames.
  /** @type {number[]} */
  const stack = [0, xv.length, 0, yv.length, minimal ? 1 : 0];
  while (stack.length) {
    const flag = /** @type {number} */ (stack.pop());
    let ylim = /** @type {number} */ (stack.pop());
    let yoff = /** @type {number} */ (stack.pop());
    let xlim = /** @type {number} */ (stack.pop());
    let xoff = /** @type {number} */ (stack.pop());

    while (xoff < xlim && yoff < ylim && xv[xoff] === yv[yoff]) {
      xoff++;
      yoff++;
    }
    while (xoff < xlim && yoff < ylim && xv[xlim - 1] === yv[ylim - 1]) {
      xlim--;
      ylim--;
    }

    if (xoff === xlim) {
      while (yoff < ylim) changedY[yoff++] = 1;
    } else if (yoff === ylim) {
      while (xoff < xlim) changedX[xoff++] = 1;
    } else {
      findSplit(
        xv,
        yv,
        xoff,
        xlim,
        yoff,
        ylim,
        flag === 1,
        fd,
        bd,
        base,
        maxCost,
        split,
      );
      stack.push(
        split.xmid,
        xlim,
        split.ymid,
        ylim,
        split.hiMinimal ? 1 : 0,
        xoff,
        split.xmid,
        yoff,
        split.ymid,
        split.loMinimal ? 1 : 0,
      );
    }
  }
}

/**
 * Where two sequences differ.
 *
 * Strings (lines, words) are compared by value. Common leading and trailing
 * elements are trimmed, elements that occur on one side only are marked
 * without a search, and only what remains goes through Myers' algorithm, so
 * scattered edits in a long file cost about as much as the edits.
 *
 * @param {ArrayLike<string>} a
 * @param {ArrayLike<string>} b
 * @param {DiffSequenceOptions} [options]
 * @returns {DiffBlock[]} The differences in order. Empty when the sequences match.
 */
export function diffSequence(a, b, options = {}) {
  const { ignoreWhitespace = false, maxCost = DEFAULT_MAX_COST } = options;
  const n = a.length;
  const m = b.length;

  /** @param {string} value */
  const key = (value) =>
    ignoreWhitespace ? value.replace(WHITESPACE, "") : value;

  let prefix = 0;
  while (prefix < n && prefix < m && key(a[prefix]) === key(b[prefix]))
    prefix++;
  let suffix = 0;
  while (
    suffix < n - prefix &&
    suffix < m - prefix &&
    key(a[n - 1 - suffix]) === key(b[m - 1 - suffix])
  ) {
    suffix++;
  }

  const aEnd = n - suffix;
  const bEnd = m - suffix;
  if (prefix === aEnd && prefix === bEnd) return [];

  /** @type {Map<string, number>} */
  const ids = new Map();
  const midN = aEnd - prefix;
  const midM = bEnd - prefix;
  const aIds = new Int32Array(midN);
  const bIds = new Int32Array(midM);
  /** @type {number[]} */
  const countA = [];
  /** @type {number[]} */
  const countB = [];

  /**
   * @param {string} value
   * @param {number[]} own
   * @param {number[]} other
   */
  const idOf = (value, own, other) => {
    const k = key(value);
    let id = ids.get(k);
    if (id === undefined) {
      id = ids.size;
      ids.set(k, id);
      own.push(0);
      other.push(0);
    }
    own[id]++;
    return id;
  };
  for (let i = 0; i < midN; i++) aIds[i] = idOf(a[prefix + i], countA, countB);
  for (let j = 0; j < midM; j++) bIds[j] = idOf(b[prefix + j], countB, countA);

  // An element with no twin can never be kept, so it need not be searched.
  const keptA = new Int32Array(midN);
  const keptB = new Int32Array(midM);
  let reducedN = 0;
  let reducedM = 0;
  const changedA = new Uint8Array(midN);
  const changedB = new Uint8Array(midM);
  for (let i = 0; i < midN; i++) {
    if (countB[aIds[i]] === 0) changedA[i] = 1;
    else keptA[reducedN++] = i;
  }
  for (let j = 0; j < midM; j++) {
    if (countA[bIds[j]] === 0) changedB[j] = 1;
    else keptB[reducedM++] = j;
  }

  const xv = new Int32Array(reducedN);
  const yv = new Int32Array(reducedM);
  for (let i = 0; i < reducedN; i++) xv[i] = aIds[keptA[i]];
  for (let j = 0; j < reducedM; j++) yv[j] = bIds[keptB[j]];

  const reducedChangedX = new Uint8Array(reducedN);
  const reducedChangedY = new Uint8Array(reducedM);
  markChanged(
    xv,
    yv,
    reducedChangedX,
    reducedChangedY,
    maxCost,
    Boolean(options.minimal),
  );
  for (let i = 0; i < reducedN; i++) {
    if (reducedChangedX[i]) changedA[keptA[i]] = 1;
  }
  for (let j = 0; j < reducedM; j++) {
    if (reducedChangedY[j]) changedB[keptB[j]] = 1;
  }

  /** @type {DiffBlock[]} */
  const blocks = [];
  let i = 0;
  let j = 0;
  while (i < midN || j < midM) {
    if (i < midN && j < midM && !changedA[i] && !changedB[j]) {
      i++;
      j++;
      continue;
    }
    const startA = i;
    const startB = j;
    while (i < midN && changedA[i]) i++;
    while (j < midM && changedB[j]) j++;
    // Equal kept counts make this unreachable; a stuck cursor must still end.
    if (i === startA && j === startB) {
      i = midN;
      j = midM;
    }
    blocks.push({
      aStart: prefix + startA,
      aEnd: prefix + i,
      bStart: prefix + startB,
      bEnd: prefix + j,
    });
  }
  return blocks;
}

// Words, runs of space, and single marks. Letters and digits of any script
// join, so `fooBar` is one word and `a.b` is three tokens.
const TOKEN = /[\p{L}\p{N}_]+|\s+|[^\p{L}\p{N}_\s]/gu;
const BLANK = /^\s*$/;
const NON_SPACE = /\S/g;

/**
 * @typedef {Object} DiffInlineOptions
 * @property {number} [maxLength] Skip lines longer than this many characters.
 * Highlights inside a minified line say nothing and cost the most. Defaults to 1000.
 * @property {number} [minSimilarity] Skip a pair of lines that share less than
 * this share of their non-space characters, so a rewritten line gets no
 * speckled highlight. Defaults to 0.25.
 */

/**
 * Merge ranges whose gap is only space, and drop empty ones.
 * @param {string} text
 * @param {number[]} ranges Flat `[start, end, ...]`, ordered.
 * @returns {number[]}
 */
function mergeRanges(text, ranges) {
  /** @type {number[]} */
  const merged = [];
  for (let i = 0; i < ranges.length; i += 2) {
    const start = ranges[i];
    const end = ranges[i + 1];
    if (end <= start) continue;
    const last = merged.length - 1;
    if (last >= 0 && BLANK.test(text.slice(merged[last], start))) {
      merged[last] = end;
    } else {
      merged.push(start, end);
    }
  }
  return merged;
}

/**
 * The words that changed between two versions of a line, as character ranges.
 *
 * @param {string} oldText
 * @param {string} newText
 * @param {DiffInlineOptions} [options]
 * @returns {{ old: number[]; new: number[] } | null} Flat `[start, end, ...]`
 * UTF-16 offsets into each line, or `null` when the lines are too long or too
 * different for word highlights to help.
 */
export function diffInline(oldText, newText, options = {}) {
  const { maxLength = 1000, minSimilarity = 0.25 } = options;
  if (oldText.length > maxLength || newText.length > maxLength) return null;

  const a = oldText.match(TOKEN) || [];
  const b = newText.match(TOKEN) || [];
  const blocks = diffSequence(a, b, { maxCost: 512 });

  /** @param {string[]} tokens */
  const starts = (tokens) => {
    const out = [0];
    for (let i = 0; i < tokens.length; i++) out.push(out[i] + tokens[i].length);
    return out;
  };
  const aStarts = starts(a);
  const bStarts = starts(b);
  /** @type {number[]} */
  const oldRanges = [];
  /** @type {number[]} */
  const newRanges = [];
  for (const block of blocks) {
    oldRanges.push(aStarts[block.aStart], aStarts[block.aEnd]);
    newRanges.push(bStarts[block.bStart], bStarts[block.bEnd]);
  }

  /**
   * @param {string} text
   * @param {number[]} ranges
   */
  const keptShare = (text, ranges) => {
    const total = (text.match(NON_SPACE) || []).length;
    if (total === 0) return 1;
    let changed = 0;
    for (let i = 0; i < ranges.length; i += 2) {
      changed += (text.slice(ranges[i], ranges[i + 1]).match(NON_SPACE) || [])
        .length;
    }
    return (total - changed) / total;
  };
  if (
    Math.max(keptShare(oldText, oldRanges), keptShare(newText, newRanges)) <
    minSimilarity
  ) {
    return null;
  }

  return {
    old: mergeRanges(oldText, oldRanges),
    new: mergeRanges(newText, newRanges),
  };
}
