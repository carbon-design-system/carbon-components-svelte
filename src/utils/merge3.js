// @ts-check
// Three-way merge of text by lines (diff3), and git conflict marker parsing.
// Pure and DOM-free.

/** Edit steps one split may take before settling for the best split so far. */
const MAX_COST = 1500;

/**
 * Split text into lines, remembering its line ending and whether it ended
 * with one. `"a\r\nb\n"` is `["a", "b"]` with `eol` `"\r\n"` and a final
 * newline; `""` has no lines and no final newline.
 *
 * @param {string} text
 * @returns {import("./merge3.js").SplitText}
 */
export function splitText(text) {
  const source = String(text ?? "");
  if (source === "") return { lines: [], eol: "\n", finalNewline: false };
  const lines = source.split("\n");
  let crlf = 0;
  for (let i = 0; i < lines.length - 1; i++) {
    if (lines[i].endsWith("\r")) {
      crlf++;
      lines[i] = lines[i].slice(0, -1);
    }
  }
  const finalNewline = lines[lines.length - 1] === "";
  if (finalNewline) lines.pop();
  const total = lines.length - (finalNewline ? 0 : 1);
  return {
    lines,
    eol: total > 0 && crlf * 2 > total ? "\r\n" : "\n",
    finalNewline,
  };
}

/**
 * @param {string[]} lines
 * @param {{ eol?: string, finalNewline?: boolean }} [options]
 * @returns {string}
 */
export function joinLines(lines, options = {}) {
  const { eol = "\n", finalNewline = true } = options;
  if (lines.length === 0) return "";
  return lines.join(eol) + (finalNewline ? eol : "");
}

/**
 * Matching line pairs of two id arrays (Myers' O(ND) greedy algorithm).
 * Returns `null` when the cost passes `maxCost`.
 *
 * @param {Int32Array | number[]} a
 * @param {Int32Array | number[]} b
 * @param {number} maxCost
 * @returns {null | Array<[number, number]>}
 */
function myers(a, b, maxCost) {
  const n = a.length;
  const m = b.length;
  if (n === 0 || m === 0) return [];
  const dMax = Math.min(n + m, maxCost);
  const off = dMax + 1;
  const v = new Int32Array(2 * dMax + 3);
  /** @type {Int32Array[]} */
  const trace = [];
  let found = -1;
  search: for (let d = 0; d <= dMax; d++) {
    for (let k = -d; k <= d; k += 2) {
      let x =
        k === -d || (k !== d && v[off + k - 1] < v[off + k + 1])
          ? v[off + k + 1]
          : v[off + k - 1] + 1;
      let y = x - k;
      while (x < n && y < m && a[x] === b[y]) {
        x++;
        y++;
      }
      v[off + k] = x;
      if (x >= n && y >= m) {
        found = d;
        break search;
      }
    }
    trace.push(v.slice(off - d, off + d + 1));
  }
  if (found < 0) return null;

  /** @type {Array<[number, number]>} */
  const pairs = [];
  let x = n;
  let y = m;
  for (let d = found; d > 0; d--) {
    const k = x - y;
    const prev = trace[d - 1];
    const at = (/** @type {number} */ kk) => prev[kk + d - 1];
    const down = k === -d || (k !== d && at(k - 1) < at(k + 1));
    const prevK = down ? k + 1 : k - 1;
    const prevX = at(prevK);
    const prevY = prevX - prevK;
    const snakeX = down ? prevX : prevX + 1;
    while (x > snakeX) {
      x--;
      y--;
      pairs.push([x, y]);
    }
    x = prevX;
    y = prevY;
  }
  while (x > 0 && y > 0) {
    x--;
    y--;
    pairs.push([x, y]);
  }
  return pairs.reverse();
}

/**
 * The differing stretches between two lists of line ids: for each, the range
 * of `a` that `b`'s range replaces. Common ends are trimmed first, and ids
 * that occur on one side only are left out of the search (they can't match),
 * which keeps scattered edits in a long file near linear. Past `maxCost` the
 * rest of the middle counts as one replaced stretch: valid, if longer than
 * minimal.
 *
 * @param {ArrayLike<number>} a
 * @param {ArrayLike<number>} b
 * @param {number} [maxCost]
 * @returns {import("./merge3.js").Hunk[]}
 */
export function diffHunks(a, b, maxCost = MAX_COST) {
  const n = a.length;
  const m = b.length;
  let head = 0;
  while (head < n && head < m && a[head] === b[head]) head++;
  let tail = 0;
  while (
    tail < n - head &&
    tail < m - head &&
    a[n - 1 - tail] === b[m - 1 - tail]
  ) {
    tail++;
  }
  const aEnd = n - tail;
  const bEnd = m - tail;
  if (head === aEnd && head === bEnd) return [];

  /** @type {Map<number, number>} */
  const inA = new Map();
  for (let i = head; i < aEnd; i++) inA.set(a[i], (inA.get(a[i]) ?? 0) + 1);
  const keepB = new Set();
  /** @type {number[]} */
  const fb = [];
  /** @type {number[]} */
  const fbAt = [];
  for (let j = head; j < bEnd; j++) {
    if (inA.has(b[j])) {
      keepB.add(b[j]);
      fb.push(b[j]);
      fbAt.push(j);
    }
  }
  /** @type {number[]} */
  const fa = [];
  /** @type {number[]} */
  const faAt = [];
  for (let i = head; i < aEnd; i++) {
    if (keepB.has(a[i])) {
      fa.push(a[i]);
      faAt.push(i);
    }
  }

  const pairs = myers(fa, fb, maxCost) ?? [];
  /** @type {import("./merge3.js").Hunk[]} */
  const hunks = [];
  let ai = head;
  let bi = head;
  const close = (/** @type {number} */ i, /** @type {number} */ j) => {
    if (i > ai || j > bi) {
      hunks.push({ aStart: ai, aEnd: i, bStart: bi, bEnd: j });
    }
  };
  for (const [fi, fj] of pairs) {
    const i = faAt[fi];
    const j = fbAt[fj];
    close(i, j);
    ai = i + 1;
    bi = j + 1;
  }
  close(aEnd, bEnd);
  return hunks;
}

/**
 * @param {string[]} a
 * @param {string[]} b
 * @returns {boolean}
 */
function sameLines(a, b) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

/**
 * Three-way merge by lines. Chunks cover the whole file in order:
 *
 * | `type` | Meaning | Resolved text |
 * | :--- | :--- | :--- |
 * | `"unchanged"` | Neither side touched it | the base lines |
 * | `"ours"` | Only ours changed it | ours |
 * | `"theirs"` | Only theirs changed it | theirs |
 * | `"both"` | Both made the same change | ours (equal to theirs) |
 * | `"conflict"` | Both changed it differently | none: a decision |
 *
 * Changes that touch (one ends where the other starts) are one conflict, as
 * in git. Line ending and final newline merge apart from the lines: the
 * side that differs from the base wins, and a conflict between them can't
 * occur.
 *
 * @param {string} base
 * @param {string} ours
 * @param {string} theirs
 * @param {{ maxCost?: number }} [options]
 * @returns {import("./merge3.js").MergeModel}
 */
export function merge3(base, ours, theirs, options = {}) {
  const maxCost = options.maxCost ?? MAX_COST;
  const b = splitText(base);
  const o = splitText(ours);
  const t = splitText(theirs);

  /** @type {Map<string, number>} */
  const ids = new Map();
  const toIds = (/** @type {string[]} */ lines) => {
    const out = new Int32Array(lines.length);
    for (let i = 0; i < lines.length; i++) {
      let id = ids.get(lines[i]);
      if (id === undefined) {
        id = ids.size;
        ids.set(lines[i], id);
      }
      out[i] = id;
    }
    return out;
  };
  const baseIds = toIds(b.lines);
  const oursHunks = diffHunks(baseIds, toIds(o.lines), maxCost);
  const theirsHunks = diffHunks(baseIds, toIds(t.lines), maxCost);

  /** @type {import("./merge3.js").MergeChunk[]} */
  const chunks = [];
  let cursor = 0;
  let offO = 0;
  let offT = 0;
  let i = 0;
  let j = 0;
  while (i < oursHunks.length || j < theirsHunks.length) {
    const first =
      j >= theirsHunks.length ||
      (i < oursHunks.length && oursHunks[i].aStart <= theirsHunks[j].aStart)
        ? oursHunks[i]
        : theirsHunks[j];
    const start = first.aStart;
    let end = first.aEnd;
    let deltaO = 0;
    let deltaT = 0;
    let usedO = 0;
    let usedT = 0;
    for (;;) {
      if (i < oursHunks.length && oursHunks[i].aStart <= end) {
        const h = oursHunks[i++];
        end = Math.max(end, h.aEnd);
        deltaO += h.bEnd - h.bStart - (h.aEnd - h.aStart);
        usedO++;
      } else if (j < theirsHunks.length && theirsHunks[j].aStart <= end) {
        const h = theirsHunks[j++];
        end = Math.max(end, h.aEnd);
        deltaT += h.bEnd - h.bStart - (h.aEnd - h.aStart);
        usedT++;
      } else break;
    }

    if (start > cursor) {
      const lines = b.lines.slice(cursor, start);
      chunks.push({
        type: "unchanged",
        base: lines,
        ours: lines,
        theirs: lines,
      });
    }
    const baseLines = b.lines.slice(start, end);
    const oursLines = o.lines.slice(start + offO, end + offO + deltaO);
    const theirsLines = t.lines.slice(start + offT, end + offT + deltaT);
    /** @type {import("./merge3.js").ChunkType} */
    let type = "conflict";
    if (usedT === 0) type = "ours";
    else if (usedO === 0) type = "theirs";
    else if (sameLines(oursLines, theirsLines)) type = "both";
    chunks.push({
      type,
      base: baseLines,
      ours: oursLines,
      theirs: theirsLines,
    });
    offO += deltaO;
    offT += deltaT;
    cursor = end;
  }
  if (cursor < b.lines.length) {
    const lines = b.lines.slice(cursor);
    chunks.push({ type: "unchanged", base: lines, ours: lines, theirs: lines });
  }

  const pick = (
    /** @type {boolean} */ a,
    /** @type {boolean} */ c,
    /** @type {boolean} */ from,
  ) => (a === c ? a : a === from ? c : a);
  const pickEol = pick(o.eol === "\r\n", t.eol === "\r\n", b.eol === "\r\n");
  return {
    chunks,
    eol: pickEol ? "\r\n" : "\n",
    finalNewline: pick(o.finalNewline, t.finalNewline, b.finalNewline),
    hasBase: true,
    labels: {},
  };
}

const OPEN = /^<{7}(?: (.*))?$/;
const BASE = /^\|{7}(?: (.*))?$/;
const SEPARATOR = /^={7}$/;
const CLOSE = /^>{7}(?: (.*))?$/;

/**
 * Whether a line is a git conflict opener or closer.
 *
 * @param {string} line
 * @returns {boolean}
 */
export function isConflictMarker(line) {
  return OPEN.test(line) || CLOSE.test(line);
}

/**
 * Parse a file with git conflict markers (`<<<<<<<`, `|||||||`, `=======`,
 * `>>>>>>>`; the base section is there only with `merge.conflictStyle`
 * `diff3` or `zdiff3`). Text outside a marker block is `"unchanged"`; a
 * block is a `"conflict"`, or `"both"` when its sides match. A block that
 * never closes is plain text. A conflict without a base section has
 * `base: null`, and the model has `hasBase: false` unless every block has
 * one.
 *
 * @param {string} text
 * @returns {import("./merge3.js").MergeModel}
 */
export function parseConflictMarkers(text) {
  const { lines, eol, finalNewline } = splitText(text);
  /** @type {import("./merge3.js").MergeChunk[]} */
  const chunks = [];
  /** @type {string[]} */
  let plain = [];
  const labels =
    /** @type {{ ours?: string, theirs?: string, base?: string }} */ ({});
  let allBase = true;
  let blocks = 0;

  const flush = () => {
    if (plain.length > 0) {
      chunks.push({
        type: "unchanged",
        base: plain,
        ours: plain,
        theirs: plain,
      });
      plain = [];
    }
  };

  let index = 0;
  while (index < lines.length) {
    const open = OPEN.exec(lines[index]);
    if (open) {
      /** @type {string[]} */
      const ours = [];
      /** @type {null | string[]} */
      let base = null;
      /** @type {string[]} */
      const theirs = [];
      /** @type {string[]} */
      let side = ours;
      let baseLabel;
      let theirsLabel;
      let closed = false;
      let cursor = index + 1;
      for (; cursor < lines.length; cursor++) {
        const line = lines[cursor];
        const baseMark = BASE.exec(line);
        if (side === ours && base === null && baseMark) {
          base = [];
          side = base;
          baseLabel = baseMark[1];
        } else if (side !== theirs && SEPARATOR.test(line)) {
          side = theirs;
        } else if (side === theirs && CLOSE.test(line)) {
          theirsLabel = CLOSE.exec(line)?.[1];
          closed = true;
          break;
        } else if (side === theirs && OPEN.test(line)) {
          break;
        } else side.push(line);
      }
      if (closed) {
        flush();
        blocks++;
        if (base === null) allBase = false;
        labels.ours ??= open[1];
        labels.theirs ??= theirsLabel;
        labels.base ??= baseLabel;
        chunks.push({
          type: sameLines(ours, theirs) ? "both" : "conflict",
          base,
          ours,
          theirs,
        });
        index = cursor + 1;
        continue;
      }
    }
    plain.push(lines[index]);
    index++;
  }
  flush();
  return { chunks, eol, finalNewline, hasBase: blocks > 0 && allBase, labels };
}

/**
 * The lines of a conflict as git writes them: ours, the base when the chunk
 * has one, then theirs, between markers.
 *
 * @param {Pick<import("./merge3.js").MergeChunk, "ours" | "theirs" | "base">} chunk
 * @param {{ ours?: string, theirs?: string, base?: string }} [labels]
 * @returns {string[]}
 */
export function conflictMarkerLines(chunk, labels = {}) {
  const tag = (
    /** @type {string} */ mark,
    /** @type {string | undefined} */ label,
  ) => (label ? `${mark} ${label}` : mark);
  return [
    tag("<<<<<<<", labels.ours),
    ...chunk.ours,
    ...(chunk.base ? [tag("|||||||", labels.base), ...chunk.base] : []),
    "=======",
    ...chunk.theirs,
    tag(">>>>>>>", labels.theirs),
  ];
}

/**
 * Pairs of changed character ranges between two lines, by words: tokens are
 * words, runs of space and single marks, and ranges that sit apart by space
 * only merge. Returns `null` when a line is over `maxLength` characters or
 * less than a quarter of the text is shared, since marks on a rewritten line
 * only add noise.
 *
 * @param {string} a
 * @param {string} b
 * @param {number} [maxLength]
 * @returns {null | { a: Array<[number, number]>, b: Array<[number, number]> }}
 */
export function wordDiff(a, b, maxLength = 1000) {
  if (a === b || a.length > maxLength || b.length > maxLength) return null;
  const pattern = /\s+|[\p{L}\p{N}_]+|[^\s\p{L}\p{N}_]/gu;
  const ta = a.match(pattern) ?? [];
  const tb = b.match(pattern) ?? [];
  /** @type {Map<string, number>} */
  const ids = new Map();
  const toIds = (/** @type {string[]} */ tokens) =>
    tokens.map((token) => {
      let id = ids.get(token);
      if (id === undefined) {
        id = ids.size;
        ids.set(token, id);
      }
      return id;
    });
  const hunks = diffHunks(toIds(ta), toIds(tb), 400);

  let shared = 0;
  let total = 0;
  for (const token of ta) if (token.trim()) total += token.length;
  const starts = (/** @type {string[]} */ tokens) => {
    const out = [0];
    for (const token of tokens) out.push(out[out.length - 1] + token.length);
    return out;
  };
  const sa = starts(ta);
  const sb = starts(tb);
  /** @type {Array<[number, number]>} */
  const ra = [];
  /** @type {Array<[number, number]>} */
  const rb = [];
  let changedA = 0;
  for (const h of hunks) {
    if (h.aEnd > h.aStart) {
      ra.push([sa[h.aStart], sa[h.aEnd]]);
      changedA += sa[h.aEnd] - sa[h.aStart];
    }
    if (h.bEnd > h.bStart) rb.push([sb[h.bStart], sb[h.bEnd]]);
  }
  shared = Math.max(0, total - changedA);
  if (total > 0 && shared * 4 < total) return null;
  return { a: ra, b: rb };
}
