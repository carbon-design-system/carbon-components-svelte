// @ts-check
// The result of a three-way merge as one text split into chunks. Pure and
// DOM-free.
//
// The result text is the concatenation of every chunk's text. A chunk that
// is still a conflict holds git's marker lines. An edit anywhere in the text
// lands in the chunk it touches, so a conflict keeps its place and its
// bounds however much the lines around it change, and "accept ours" replaces
// exactly the chunk's own text. A conflict's status is read from its text,
// not stored, so undoing an accept makes it unresolved again with no extra
// bookkeeping.

import { conflictMarkerLines, isConflictMarker } from "./merge3.js";

/**
 * @param {string} text
 * @returns {number}
 */
function countNewlines(text) {
  let count = 0;
  let at = text.indexOf("\n");
  while (at !== -1) {
    count++;
    at = text.indexOf("\n", at + 1);
  }
  return count;
}

/**
 * @param {string[]} lines
 * @param {boolean} trailing Whether the last line ends with a newline.
 * @returns {string}
 */
function linesText(lines, trailing) {
  if (lines.length === 0) return "";
  return lines.join("\n") + (trailing ? "\n" : "");
}

/**
 * @param {string} text
 * @returns {string}
 */
function stripTrailingNewline(text) {
  return text.endsWith("\n") ? text.slice(0, -1) : text;
}

/**
 * @param {import("./merge3.js").MergeModel} model
 * @returns {import("./merge-result.js").MergeResult}
 */
export function createMergeResult(model) {
  const { chunks, finalNewline, labels } = model;
  /** @type {import("./merge-result.js").ResultChunk[]} */
  const list = chunks.map((chunk) => {
    let text;
    if (chunk.type === "conflict") {
      text = linesText(
        conflictMarkerLines({ ...chunk, base: null }, labels),
        true,
      );
    } else if (chunk.type === "unchanged") {
      text = linesText(chunk.base ?? [], true);
    } else if (chunk.type === "theirs") {
      text = linesText(chunk.theirs, true);
    } else {
      text = linesText(chunk.ours, true);
    }
    return {
      type: chunk.type,
      base: chunk.base,
      ours: chunk.ours,
      theirs: chunk.theirs,
      text,
      newlines: countNewlines(text),
    };
  });
  const result = {
    chunks: list,
    labels,
    eol: model.eol,
    finalNewline,
    hasBase: model.hasBase,
    revision: 0,
  };
  if (!finalNewline) {
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].text !== "") {
        setChunkText(result, i, stripTrailingNewline(list[i].text));
        break;
      }
    }
  }
  result.revision = 0;
  return result;
}

/**
 * @param {import("./merge-result.js").MergeResult} result
 * @param {number} index
 * @param {string} text
 */
function setChunkText(result, index, text) {
  const chunk = result.chunks[index];
  chunk.text = text;
  chunk.newlines = countNewlines(text);
  result.revision++;
}

/**
 * The whole result text.
 *
 * @param {import("./merge-result.js").MergeResult} result
 * @returns {string}
 */
export function resultText(result) {
  let text = "";
  for (const chunk of result.chunks) text += chunk.text;
  return text;
}

/**
 * Where each chunk starts in the text, with the text length last.
 *
 * @param {import("./merge-result.js").MergeResult} result
 * @returns {number[]}
 */
export function chunkOffsets(result) {
  const offsets = [0];
  for (const chunk of result.chunks) {
    offsets.push(offsets[offsets.length - 1] + chunk.text.length);
  }
  return offsets;
}

/**
 * The first line each chunk's text starts on, with the line count last.
 *
 * @param {import("./merge-result.js").MergeResult} result
 * @returns {number[]}
 */
export function chunkLineStarts(result) {
  const starts = [0];
  for (const chunk of result.chunks) {
    starts.push(starts[starts.length - 1] + chunk.newlines);
  }
  return starts;
}

/**
 * The chunk that owns a character position: the one whose text contains it,
 * the later chunk at a boundary, and the last non-empty chunk at the end.
 *
 * @param {number[]} offsets From {@link chunkOffsets}.
 * @param {number} position
 * @returns {number}
 */
export function chunkAt(offsets, position) {
  const count = offsets.length - 1;
  const total = offsets[count];
  if (position >= total) {
    for (let i = count - 1; i >= 0; i--) {
      if (offsets[i + 1] > offsets[i]) return i;
    }
    return Math.max(0, count - 1);
  }
  let low = 0;
  let high = count - 1;
  while (low < high) {
    const mid = (low + high + 1) >> 1;
    if (offsets[mid] <= position) low = mid;
    else high = mid - 1;
  }
  // Skip empty chunks that start at the same offset.
  while (low < count - 1 && offsets[low + 1] === offsets[low]) low++;
  return low;
}

/**
 * Whether no chunk after this one has text.
 *
 * @param {import("./merge-result.js").MergeResult} result
 * @param {number} index
 * @returns {boolean}
 */
function isTail(result, index) {
  for (let i = index + 1; i < result.chunks.length; i++) {
    if (result.chunks[i].text !== "") return false;
  }
  return true;
}

/**
 * The text a choice would give a chunk, or `null` when the chunk can't take
 * it (base, when markers had none).
 *
 * @param {import("./merge-result.js").MergeResult} result
 * @param {number} index
 * @param {import("./merge-result.js").AcceptChoice} choice
 * @returns {string | null}
 */
export function choiceText(result, index, choice) {
  const chunk = result.chunks[index];
  /** @type {string[] | null} */
  let lines;
  if (choice === "ours") lines = chunk.ours;
  else if (choice === "theirs") lines = chunk.theirs;
  else if (choice === "both") lines = [...chunk.ours, ...chunk.theirs];
  else if (choice === "both-reversed") lines = [...chunk.theirs, ...chunk.ours];
  else lines = chunk.base;
  if (!lines) return null;
  let trailing = true;
  if (isTail(result, index)) {
    trailing =
      chunk.text === "" ? result.finalNewline : chunk.text.endsWith("\n");
  }
  return linesText(lines, trailing);
}

/**
 * @param {import("./merge-result.js").MergeResult} result
 * @param {number} index
 * @returns {import("./merge-result.js").ChunkStatus}
 */
export function chunkStatus(result, index) {
  const chunk = result.chunks[index];
  if (chunk.type !== "conflict") {
    return chunk.type === "unchanged" ? "unchanged" : "merged";
  }
  if (chunk.text.split("\n").some(isConflictMarker)) return "unresolved";
  const current = stripTrailingNewline(chunk.text);
  for (const choice of /** @type {const} */ ([
    "ours",
    "theirs",
    "both",
    "both-reversed",
    "base",
  ])) {
    if (choice === "base" && !chunk.base) continue;
    const text = choiceText(result, index, choice);
    if (text !== null && stripTrailingNewline(text) === current) return choice;
  }
  return "edited";
}

/**
 * Indexes of the chunks that began as conflicts.
 *
 * @param {import("./merge-result.js").MergeResult} result
 * @returns {number[]}
 */
export function conflictIndexes(result) {
  /** @type {number[]} */
  const indexes = [];
  result.chunks.forEach((chunk, i) => {
    if (chunk.type === "conflict") indexes.push(i);
  });
  return indexes;
}

/**
 * How many conflicts still have their markers.
 *
 * @param {import("./merge-result.js").MergeResult} result
 * @returns {number}
 */
export function unresolvedCount(result) {
  let count = 0;
  for (let i = 0; i < result.chunks.length; i++) {
    if (
      result.chunks[i].type === "conflict" &&
      chunkStatus(result, i) === "unresolved"
    ) {
      count++;
    }
  }
  return count;
}

/**
 * @param {import("./merge-result.js").MergeResult} result
 * @param {import("./merge-result.js").HistoryEntry} entry
 * @returns {import("./merge-result.js").TextPatch}
 */
export function applyEntry(result, entry) {
  const offsets = chunkOffsets(result);
  if (entry.kind === "edit") {
    const chunk = result.chunks[entry.chunk];
    const start = offsets[entry.chunk] + entry.at;
    setChunkText(
      result,
      entry.chunk,
      chunk.text.slice(0, entry.at) +
        entry.insert +
        chunk.text.slice(entry.at + entry.remove.length),
    );
    return { start, end: start + entry.remove.length, text: entry.insert };
  }
  const start = offsets[entry.chunk];
  const end = offsets[entry.chunk + entry.before.length];
  entry.after.forEach((text, i) => {
    setChunkText(result, entry.chunk + i, text);
  });
  return { start, end, text: entry.after.join("") };
}

/**
 * @param {import("./merge-result.js").HistoryEntry} entry
 * @returns {import("./merge-result.js").HistoryEntry}
 */
export function invertEntry(entry) {
  if (entry.kind === "edit") {
    return { ...entry, remove: entry.insert, insert: entry.remove };
  }
  return { ...entry, before: entry.after, after: entry.before };
}

/**
 * Plan replacing `[start, end)` of the result text, as typing does, as an
 * entry for {@link applyEntry}. Characters go to the chunk they touch; a
 * range that spans chunks puts the new text in the first and trims the
 * others.
 *
 * @param {import("./merge-result.js").MergeResult} result
 * @param {number} start
 * @param {number} end
 * @param {string} insert
 * @returns {import("./merge-result.js").HistoryEntry}
 */
export function editText(result, start, end, insert) {
  const offsets = chunkOffsets(result);
  const first = chunkAt(offsets, start);
  let last = first;
  if (end > start) {
    while (last < result.chunks.length - 1 && offsets[last + 1] < end) last++;
  }
  if (first === last) {
    const at = start - offsets[first];
    return {
      kind: "edit",
      chunk: first,
      at,
      remove: result.chunks[first].text.slice(at, end - offsets[first]),
      insert,
    };
  }
  const before = result.chunks
    .slice(first, last + 1)
    .map((chunk) => chunk.text);
  const after = before.map((text, i) => {
    if (i === 0) return text.slice(0, start - offsets[first]) + insert;
    if (first + i === last) return text.slice(end - offsets[last]);
    return "";
  });
  return { kind: "span", chunk: first, before, after };
}

/**
 * Plan replacing a chunk's whole text with a choice, as an entry for
 * {@link applyEntry}, or `null` when the chunk can't take it or already
 * holds it.
 *
 * @param {import("./merge-result.js").MergeResult} result
 * @param {number} index
 * @param {import("./merge-result.js").AcceptChoice} choice
 * @returns {null | import("./merge-result.js").HistoryEntry}
 */
export function acceptChunk(result, index, choice) {
  const text = choiceText(result, index, choice);
  const current = result.chunks[index].text;
  if (text === null || text === current) return null;
  return { kind: "edit", chunk: index, at: 0, remove: current, insert: text };
}

/**
 * The single replaced range that turns `before` into `after`, with the
 * start held at or before `limit` so a run of equal characters resolves to
 * where the caret was.
 *
 * @param {string} before
 * @param {string} after
 * @param {number} [limit]
 * @returns {{ start: number, end: number, insert: string }}
 */
export function diffRange(before, after, limit = Number.POSITIVE_INFINITY) {
  const max = Math.min(before.length, after.length, limit);
  let start = 0;
  while (start < max && before.charCodeAt(start) === after.charCodeAt(start)) {
    start++;
  }
  let end = before.length;
  let afterEnd = after.length;
  while (
    end > start &&
    afterEnd > start &&
    before.charCodeAt(end - 1) === after.charCodeAt(afterEnd - 1)
  ) {
    end--;
    afterEnd--;
  }
  return { start, end, insert: after.slice(start, afterEnd) };
}

/**
 * Fold a new edit into the last history entry when it continues the same
 * run of typing or backspacing in one chunk. Returns the merged entry, or
 * `null` when they stay apart.
 *
 * @param {import("./merge-result.js").HistoryEntry} previous
 * @param {import("./merge-result.js").HistoryEntry} next
 * @returns {null | import("./merge-result.js").HistoryEntry}
 */
export function coalesceEntries(previous, next) {
  if (previous.kind !== "edit" || next.kind !== "edit") return null;
  if (previous.chunk !== next.chunk) return null;
  if (
    previous.remove === "" &&
    next.remove === "" &&
    !next.insert.includes("\n") &&
    next.at === previous.at + previous.insert.length
  ) {
    return { ...previous, insert: previous.insert + next.insert };
  }
  if (
    previous.insert === "" &&
    next.insert === "" &&
    previous.remove !== "" &&
    next.at + next.remove.length === previous.at
  ) {
    return {
      ...previous,
      at: next.at,
      remove: next.remove + previous.remove,
    };
  }
  return null;
}

/**
 * Chunk indexes to visit, in order.
 *
 * @param {import("./merge-result.js").MergeResult} result
 * @param {number} from Chunk index to move from, or -1 for none.
 * @param {1 | -1} direction
 * @param {boolean} [unresolvedOnly]
 * @returns {number} A chunk index, or -1 when there is none.
 */
export function neighborConflict(
  result,
  from,
  direction,
  unresolvedOnly = false,
) {
  const all = conflictIndexes(result).filter(
    (i) => !unresolvedOnly || chunkStatus(result, i) === "unresolved",
  );
  if (all.length === 0) return -1;
  if (direction === 1) return all.find((i) => i > from) ?? all[0];
  return [...all].reverse().find((i) => i < from) ?? all[all.length - 1];
}
