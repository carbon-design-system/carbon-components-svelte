// @ts-check
// The data behind DiffViewer: lines in diff order, the rows a view paints from
// them (with unchanged stretches folded away), and the pieces that go on a
// row (word marks, syntax tokens). Pure functions, no DOM.

import { diffInline, diffSequence } from "./diff-lines.js";

/**
 * A syntax token, as `tokenize` from `carbon-components-svelte/syntax` returns it.
 * @typedef {Object} DiffToken
 * @property {string | null} type
 * @property {string} text
 */

/**
 * One line of the diff, in unified order: a changed block lists its removed
 * lines, then its added ones. A `"gap"` opens each hunk of a patch and stands
 * for the lines the patch leaves out before it.
 *
 * @typedef {Object} DiffLine
 * @property {"equal" | "delete" | "insert" | "gap"} type
 * @property {string} text The line; a gap's section heading.
 * @property {number} oldNo Line number in the old text, 0 when absent. A gap's first old line.
 * @property {number} newNo Line number in the new text, 0 when absent. A gap's first new line.
 * @property {number} change Index of the changed block it belongs to, -1 if none.
 * @property {DiffLine | null} pair The line it replaces or is replaced by.
 * @property {DiffToken[] | null} tokens Syntax tokens covering `text`.
 * @property {boolean} noNewline The source has no newline after it.
 * @property {number} hidden A gap's count of lines the patch leaves out before it.
 * @property {number} oldCount A gap's old line count, for its header.
 * @property {number} newCount A gap's new line count, for its header.
 */

/**
 * @typedef {Object} DiffStats
 * @property {number} added Added lines.
 * @property {number} removed Removed lines.
 * @property {number} changes Changed blocks.
 */

/**
 * A row that opens a stretch of lines: its `@@` header, the control that
 * shows the lines folded above it, or both.
 *
 * @typedef {Object} HunkRow
 * @property {"hunk"} type
 * @property {number} id Index in the lines of the first folded line; -1 when none can be shown.
 * @property {number} hidden How many lines sit above, folded or left out of a patch.
 * @property {string} header `@@ -1,4 +1,5 @@`, or empty.
 * @property {boolean} trailing The fold sits after the last line.
 * @property {number} change Always -1.
 */

/**
 * A row of the side by side view.
 * @typedef {Object} PairRow
 * @property {"pair"} type
 * @property {DiffLine | null} left
 * @property {DiffLine | null} right
 * @property {number} change Index of the changed block, -1 if none.
 */

/** @typedef {DiffLine | HunkRow | PairRow} DiffRow */

/**
 * @typedef {Object} DiffRows
 * @property {DiffRow[]} rows
 * @property {number[]} changes Row index where each changed block starts.
 */

const LINE_BREAK = /\r\n?|\n/;

/**
 * Split text into lines. A final newline ends the last line instead of
 * opening an empty one, and CR LF is one break.
 *
 * @param {string} text
 * @returns {string[]}
 */
export function splitLines(text) {
  if (text === "") return [];
  const lines = text.split(LINE_BREAK);
  if (lines[lines.length - 1] === "") lines.pop();
  return lines;
}

/**
 * @param {DiffLine["type"]} type
 * @param {string} text
 * @param {number} oldNo
 * @param {number} newNo
 * @param {number} change
 * @returns {DiffLine}
 */
function makeLine(type, text, oldNo, newNo, change) {
  return {
    type,
    text,
    oldNo,
    newNo,
    change,
    pair: null,
    tokens: null,
    noNewline: false,
    hidden: 0,
    oldCount: 0,
    newCount: 0,
  };
}

/**
 * Pair the removed and added lines of one changed block, first with first.
 * @param {DiffLine[]} lines
 * @param {number} deleteStart
 * @param {number} insertStart
 * @param {number} end
 */
function pairBlock(lines, deleteStart, insertStart, end) {
  const pairs = Math.min(insertStart - deleteStart, end - insertStart);
  for (let k = 0; k < pairs; k++) {
    const del = lines[deleteStart + k];
    const ins = lines[insertStart + k];
    del.pair = ins;
    ins.pair = del;
  }
}

/**
 * @typedef {Object} DiffLinesOptions
 * @property {boolean} [ignoreWhitespace] Treat lines that differ only in whitespace as equal.
 * @property {number} [maxCost] See `diffSequence`.
 */

/**
 * Diff two texts into the lines of a diff.
 *
 * @param {string} oldText
 * @param {string} newText
 * @param {DiffLinesOptions} [options]
 * @returns {{ lines: DiffLine[]; stats: DiffStats }}
 */
export function diffLines(oldText, newText, options = {}) {
  const a = splitLines(oldText);
  const b = splitLines(newText);
  const blocks = diffSequence(a, b, options);

  /** @type {DiffLine[]} */
  const lines = [];
  let removed = 0;
  let added = 0;
  let i = 0;
  let j = 0;

  /** @param {number} aTo */
  const equalUntil = (aTo) => {
    // The new text is the one shown when whitespace is ignored.
    while (i < aTo) {
      lines.push(makeLine("equal", b[j], i + 1, j + 1, -1));
      i++;
      j++;
    }
  };

  for (let k = 0; k < blocks.length; k++) {
    const block = blocks[k];
    equalUntil(block.aStart);
    const deleteStart = lines.length;
    for (; i < block.aEnd; i++) {
      lines.push(makeLine("delete", a[i], i + 1, 0, k));
    }
    const insertStart = lines.length;
    for (; j < block.bEnd; j++) {
      lines.push(makeLine("insert", b[j], 0, j + 1, k));
    }
    removed += insertStart - deleteStart;
    added += lines.length - insertStart;
    pairBlock(lines, deleteStart, insertStart, lines.length);
  }
  equalUntil(a.length);

  return { lines, stats: { added, removed, changes: blocks.length } };
}

/**
 * Lines of a diff from one file of a parsed patch. Each hunk opens with a gap
 * line that records where it starts and how many lines the patch skipped
 * before it.
 *
 * @param {import("./unified-diff.js").PatchFile} file
 * @returns {{ lines: DiffLine[]; stats: DiffStats }}
 */
export function patchLines(file) {
  /** @type {DiffLine[]} */
  const lines = [];
  let added = 0;
  let removed = 0;
  let changes = 0;
  let nextOld = 1;

  for (const hunk of file.hunks) {
    // A side with no lines names the line before it, so move to the first.
    let oldNo = hunk.oldCount === 0 ? hunk.oldStart + 1 : hunk.oldStart;
    let newNo = hunk.newCount === 0 ? hunk.newStart + 1 : hunk.newStart;

    const gap = makeLine("gap", hunk.heading, oldNo, newNo, -1);
    gap.hidden = Math.max(0, oldNo - nextOld);
    gap.oldCount = hunk.oldCount;
    gap.newCount = hunk.newCount;
    lines.push(gap);

    let change = -1;
    let deleteStart = -1;
    let insertStart = -1;
    const closeBlock = () => {
      if (deleteStart >= 0) {
        pairBlock(lines, deleteStart, insertStart, lines.length);
      }
      deleteStart = -1;
      insertStart = -1;
    };

    for (const source of hunk.lines) {
      /** @type {DiffLine} */
      let line;
      if (source.type === "context") {
        closeBlock();
        change = -1;
        line = makeLine("equal", source.text, oldNo++, newNo++, -1);
      } else {
        if (change < 0) {
          change = changes++;
          deleteStart = lines.length;
        }
        if (source.type === "delete") {
          line = makeLine("delete", source.text, oldNo++, 0, change);
          removed++;
        } else {
          if (insertStart < 0) insertStart = lines.length;
          line = makeLine("insert", source.text, 0, newNo++, change);
          added++;
        }
      }
      line.noNewline = Boolean(source.noNewline);
      lines.push(line);
    }
    // A block with only removed lines pairs with nothing.
    if (deleteStart >= 0 && insertStart < 0) insertStart = lines.length;
    closeBlock();
    nextOld = oldNo;
  }

  return { lines, stats: { added, removed, changes } };
}

/**
 * `@@ -1,4 +1,5 @@`, with the section heading after it when there is one.
 *
 * @param {number} oldStart First old line of the stretch. An empty stretch
 * starts at the line after where it sits, and is written as the line before.
 * @param {number} oldCount
 * @param {number} newStart
 * @param {number} newCount
 * @param {string} [heading]
 * @returns {string}
 */
export function formatHunkHeader(
  oldStart,
  oldCount,
  newStart,
  newCount,
  heading,
) {
  /**
   * @param {number} start
   * @param {number} count
   */
  const range = (start, count) =>
    count === 1 ? String(start) : `${count === 0 ? start - 1 : start},${count}`;
  const tail = heading ? ` ${heading}` : "";
  return `@@ -${range(oldStart, oldCount)} +${range(newStart, newCount)} @@${tail}`;
}

/**
 * Which lines are within `context` lines of a change. Gaps always are.
 *
 * @param {DiffLine[]} lines
 * @param {number} context
 * @returns {Uint8Array}
 */
function visibleMask(lines, context) {
  const n = lines.length;
  const visible = new Uint8Array(n);
  if (!Number.isFinite(context)) {
    visible.fill(1);
    return visible;
  }
  let marked = 0;
  for (let i = 0; i < n; i++) {
    const type = lines[i].type;
    if (type === "gap") {
      visible[i] = 1;
    } else if (type !== "equal") {
      const to = Math.min(n - 1, i + context);
      for (let k = Math.max(marked, i - context); k <= to; k++) visible[k] = 1;
      marked = Math.max(marked, to + 1);
    }
  }
  return visible;
}

/**
 * @typedef {Object} BuildRowsOptions
 * @property {"split" | "unified"} view
 * @property {number} [context] Unchanged lines kept around a change. `Infinity` keeps all. Defaults to 3.
 * @property {ReadonlySet<number>} [expanded] Ids of folds the reader opened.
 * @property {boolean} [hunkHeaders] Write `@@` headers. Defaults to `true`.
 * @property {number} [minFold] Fewest hidden lines worth a fold. Defaults to 2.
 */

/**
 * The rows a view paints.
 *
 * Unified rows are the lines themselves, with a hunk row where a stretch
 * opens. Split rows put a removed line beside the added line that replaces it.
 *
 * @param {DiffLine[]} lines
 * @param {BuildRowsOptions} options
 * @returns {DiffRows}
 */
export function buildRows(lines, options) {
  const {
    view,
    context = 3,
    expanded,
    hunkHeaders = true,
    minFold = 2,
  } = options;
  const split = view === "split";
  const n = lines.length;
  const visible = visibleMask(lines, context);

  /** @type {DiffRow[]} */
  const rows = [];
  /** @type {number[]} */
  const changes = [];
  let lastChange = -1;
  /** @type {DiffLine[]} */
  let removedRun = [];
  /** @type {DiffLine[]} */
  let addedRun = [];

  /** @param {DiffRow} row */
  const push = (row) => {
    if (row.change >= 0 && row.change !== lastChange) {
      changes.push(rows.length);
      lastChange = row.change;
    }
    rows.push(row);
  };

  const flushRuns = () => {
    const count = Math.max(removedRun.length, addedRun.length);
    for (let k = 0; k < count; k++) {
      const left = removedRun[k] || null;
      const right = addedRun[k] || null;
      const change = (left || right)?.change ?? -1;
      push({ type: "pair", left, right, change });
    }
    removedRun = [];
    addedRun = [];
  };

  /** @param {DiffLine} line */
  const pushLine = (line) => {
    if (!split) {
      push(line);
    } else if (line.type === "equal") {
      flushRuns();
      push({ type: "pair", left: line, right: line, change: -1 });
    } else if (line.type === "delete") {
      removedRun.push(line);
    } else {
      addedRun.push(line);
    }
  };

  /** @param {HunkRow} row */
  const pushHunk = (row) => {
    flushRuns();
    push(row);
  };

  // Lines walked so far on each side.
  let oldPos = 0;
  let newPos = 0;
  let foldId = -1;
  let foldCount = 0;
  let grouped = false;
  /** @type {HunkRow | null} */
  let open = null;
  let groupOld = 0;
  let groupNew = 0;
  let groupOldCount = 0;
  let groupNewCount = 0;

  const endGroup = () => {
    if (open && hunkHeaders && !open.header) {
      open.header = formatHunkHeader(
        groupOld + 1,
        groupOldCount,
        groupNew + 1,
        groupNewCount,
      );
    }
    open = null;
    grouped = false;
  };

  const beginGroup = () => {
    grouped = true;
    groupOld = oldPos;
    groupNew = newPos;
    groupOldCount = 0;
    groupNewCount = 0;
    if (foldCount > 0 || hunkHeaders) {
      open = {
        type: "hunk",
        id: foldCount > 0 ? foldId : -1,
        hidden: foldCount,
        header: "",
        trailing: false,
        change: -1,
      };
      pushHunk(open);
    }
    foldCount = 0;
    foldId = -1;
  };

  let i = 0;
  while (i < n) {
    const line = lines[i];

    if (line.type === "gap") {
      endGroup();
      grouped = true;
      oldPos = line.oldNo - 1;
      newPos = line.newNo - 1;
      if (line.hidden > 0 || hunkHeaders) {
        pushHunk({
          type: "hunk",
          id: -1,
          hidden: line.hidden,
          header: hunkHeaders
            ? formatHunkHeader(
                line.oldNo,
                line.oldCount,
                line.newNo,
                line.newCount,
                line.text,
              )
            : "",
          trailing: false,
          change: -1,
        });
      }
      i++;
      continue;
    }

    let runEnd = i + 1;
    let shown = visible[i] === 1;
    if (!shown) {
      while (runEnd < n && visible[runEnd] === 0) runEnd++;
      shown = runEnd - i < minFold || Boolean(expanded?.has(i));
    }

    if (!shown) {
      endGroup();
      foldId = i;
      foldCount = runEnd - i;
      for (let k = i; k < runEnd; k++) {
        if (lines[k].type !== "insert") oldPos++;
        if (lines[k].type !== "delete") newPos++;
      }
      i = runEnd;
      continue;
    }

    if (!grouped) beginGroup();
    for (let k = i; k < runEnd; k++) {
      const shownLine = lines[k];
      pushLine(shownLine);
      if (shownLine.type !== "insert") {
        oldPos++;
        groupOldCount++;
      }
      if (shownLine.type !== "delete") {
        newPos++;
        groupNewCount++;
      }
    }
    i = runEnd;
  }

  flushRuns();
  endGroup();
  if (foldCount > 0) {
    push({
      type: "hunk",
      id: foldId,
      hidden: foldCount,
      header: "",
      trailing: true,
      change: -1,
    });
  }
  return { rows, changes };
}

/**
 * A diff as a unified patch, the text `git apply` reads.
 *
 * @param {DiffLine[]} lines
 * @param {Object} [options]
 * @param {number} [options.context] Unchanged lines around a change. Defaults to 3.
 * @param {string} [options.oldPath] Written in the `---` header.
 * @param {string} [options.newPath] Written in the `+++` header.
 * @returns {string} Empty when nothing changed.
 */
export function formatUnifiedDiff(lines, options = {}) {
  const { context = 3, oldPath, newPath } = options;
  if (!lines.some((line) => line.type === "delete" || line.type === "insert")) {
    return "";
  }
  const { rows } = buildRows(lines, {
    view: "unified",
    context,
    minFold: 1,
  });

  /** @type {string[]} */
  const out = [];
  if (oldPath !== undefined || newPath !== undefined) {
    out.push(`--- ${oldPath ?? newPath}`, `+++ ${newPath ?? oldPath}`);
  }
  for (const row of rows) {
    if (row.type === "hunk") {
      if (row.header) out.push(row.header);
    } else if (row.type !== "pair") {
      const mark =
        row.type === "delete" ? "-" : row.type === "insert" ? "+" : " ";
      out.push(mark + row.text);
      if (row.noNewline) out.push("\\ No newline at end of file");
    }
  }
  return `${out.join("\n")}\n`;
}

/**
 * Cut syntax tokens into the lines of the text they cover. The tokens' text
 * joins back to the source, as `tokenize` returns it. A token that spans
 * lines is split, and the break is dropped.
 *
 * @param {ReadonlyArray<DiffToken>} tokens
 * @returns {DiffToken[][]} One array per line, as many as `splitLines` finds.
 */
export function tokensByLine(tokens) {
  /** @type {DiffToken[][]} */
  const out = [[]];
  for (const token of tokens) {
    if (!LINE_BREAK.test(token.text)) {
      out[out.length - 1].push(token);
      continue;
    }
    const parts = token.text.split(LINE_BREAK);
    for (let k = 0; k < parts.length; k++) {
      if (k > 0) out.push([]);
      if (parts[k] !== "") {
        out[out.length - 1].push({ type: token.type, text: parts[k] });
      }
    }
  }
  // The break that ends the source opens a last line with nothing in it.
  if (out[out.length - 1].length === 0) out.pop();
  return out;
}

/**
 * Give every line syntax tokens. Each side is tokenized whole, so a comment
 * or template that spans lines colors them all: removed lines read the old
 * side, the rest the new side.
 *
 * @param {DiffLine[]} lines
 * @param {(code: string) => ReadonlyArray<DiffToken> | undefined} tokenize
 */
export function highlightLines(lines, tokenize) {
  for (const side of /** @type {const} */ (["old", "new"])) {
    const skip = side === "old" ? "insert" : "delete";
    const own = lines.filter(
      (line) => line.type !== "gap" && line.type !== skip,
    );
    const tokens = tokenize(own.map((line) => line.text).join("\n"));
    if (!tokens) continue;
    const byLine = tokensByLine(tokens);
    for (let k = 0; k < own.length; k++) {
      if (side === "new" || own[k].type === "delete") {
        own[k].tokens = byLine[k] || null;
      }
    }
  }
}

/**
 * Word marks per removed line, kept off the line so every line stays one
 * shape. Weak, so a diff takes its marks with it.
 * @type {WeakMap<DiffLine, { old: number[]; new: number[] } | null>}
 */
const MARKS = new WeakMap();

/**
 * The changed words of a line that replaces, or is replaced by, another.
 * Computed on the first ask, so rows nobody scrolls to cost nothing.
 *
 * @param {DiffLine} line
 * @returns {number[] | null} Flat `[start, end, ...]`, or `null` when the
 * line has no counterpart or the two share too little to mark.
 */
export function inlineRanges(line) {
  const other = line.pair;
  if (!other) return null;
  const removed = line.type === "delete" ? line : other;
  const added = removed === line ? other : line;
  let marks = MARKS.get(removed);
  if (marks === undefined) {
    marks = diffInline(removed.text, added.text);
    MARKS.set(removed, marks);
  }
  if (!marks) return null;
  return line === removed ? marks.old : marks.new;
}

/**
 * @typedef {Object} LineSegment
 * @property {string} text
 * @property {string | null} type Syntax token type.
 * @property {boolean} mark Inside a changed word.
 */

/**
 * Split a line into runs that share a syntax token and a word mark.
 *
 * @param {string} text
 * @param {ReadonlyArray<DiffToken> | null} tokens
 * @param {ReadonlyArray<number> | null} ranges Flat `[start, end, ...]` of changed words.
 * @returns {LineSegment[]}
 */
export function lineSegments(text, tokens, ranges) {
  const source = tokens?.length ? tokens : [{ type: null, text }];
  const marked = Boolean(ranges?.length);

  /** @type {LineSegment[]} */
  const out = [];
  /**
   * Runs of the same type and mark become one segment, since each segment is
   * an element on the page.
   * @param {string} segmentText
   * @param {string | null} type
   * @param {boolean} mark
   */
  const push = (segmentText, type, mark) => {
    const last = out[out.length - 1];
    if (last && last.type === type && last.mark === mark) {
      last.text += segmentText;
    } else {
      out.push({ text: segmentText, type, mark });
    }
  };

  let offset = 0;
  let r = 0;
  for (const token of source) {
    if (!marked || !ranges) {
      push(token.text, token.type, false);
      continue;
    }
    const end = offset + token.text.length;
    let from = offset;
    while (from < end) {
      while (r < ranges.length && ranges[r + 1] <= from) r += 2;
      const inRange = r < ranges.length;
      const mark = inRange && from >= ranges[r];
      const to = Math.min(
        end,
        inRange ? (mark ? ranges[r + 1] : ranges[r]) : end,
      );
      push(token.text.slice(from - offset, to - offset), token.type, mark);
      from = to;
    }
    offset = end;
  }
  return out;
}
