// @ts-check

/**
 * Line-structured rendering for `CodeSnippet`: the pure parts, so the
 * component stays a thin shell and the copy rules can be tested alone.
 */

/** @typedef {"highlighted" | "added" | "removed"} LineKind */

const LINE_RANGE = /^\s*(\d+)\s*(?:-\s*(\d+)\s*)?$/;
const TRAILING_BREAK = /\n$/;

/** The gutter's marker for a diff line. */
const MARKERS = { added: "+", removed: "-" };

/**
 * @typedef {object} CodeRow
 * @property {string} text - The line's code, without its line break.
 * @property {boolean} eol - Whether a line break ends the line.
 * @property {string} gutter - The line number and diff marker, drawn by CSS.
 * @property {boolean} highlighted
 * @property {"added" | "removed" | undefined} change
 */

/**
 * Parse a line list such as `"2,4-6"` into 1-based line numbers. Anything
 * that is not a number or a range is skipped, and a line past `max` is
 * dropped, so a stale list never throws.
 * @param {string | undefined} spec
 * @param {number} max
 * @returns {Set<number>}
 */
export function parseLineRanges(spec, max) {
  /** @type {Set<number>} */
  const lines = new Set();
  if (!spec) return lines;
  for (const part of spec.split(",")) {
    const match = LINE_RANGE.exec(part);
    if (!match) continue;
    const from = Number(match[1]);
    const to = match[2] === undefined ? from : Number(match[2]);
    const [start, end] = from <= to ? [from, to] : [to, from];
    for (let line = Math.max(start, 1); line <= Math.min(end, max); line++) {
      lines.add(line);
    }
  }
  return lines;
}

/**
 * Collapse sorted line numbers into runs.
 * @param {Iterable<number>} lines
 * @returns {Array<[number, number]>}
 */
export function toRuns(lines) {
  /** @type {Array<[number, number]>} */
  const runs = [];
  for (const line of [...lines].sort((a, b) => a - b)) {
    const last = runs[runs.length - 1];
    if (last && line === last[1] + 1) last[1] = line;
    else runs.push([line, line]);
  }
  return runs;
}

/**
 * The default spoken description of a kind of line: "Lines 2, 4 to 6
 * highlighted."
 * @param {LineKind} kind
 * @param {Array<[number, number]>} runs
 * @returns {string}
 */
export function defaultLinesDescription(kind, runs) {
  const single = runs.length === 1 && runs[0][0] === runs[0][1];
  const list = runs
    .map(([from, to]) => (from === to ? `${from}` : `${from} to ${to}`))
    .join(", ");
  return `${single ? "Line" : "Lines"} ${list} ${kind}.`;
}

/**
 * Split `code` into lines, each keeping its line break so the rows' text
 * joins back to `code`. A trailing line break ends the last line instead of
 * starting an empty one, as in the unsplit snippet.
 * @param {string} code
 * @returns {string[]}
 */
export function splitLines(code) {
  const lines = code.split("\n");
  const last = lines.length - 1;
  for (let i = 0; i < last; i++) lines[i] += "\n";
  if (lines[last] === "" && last > 0) lines.pop();
  return lines;
}

/**
 * The diff change a line makes, by its first column: `+` adds, `-` removes,
 * and anything else (usually a space) is context.
 * @param {string} line
 * @returns {"added" | "removed" | undefined}
 */
function changeOf(line) {
  if (line.startsWith("+")) return "added";
  if (line.startsWith("-")) return "removed";
  return undefined;
}

/**
 * @typedef {object} BuildRowsOptions
 * @property {boolean} diff - Read the first column as a diff marker.
 * @property {boolean} numbers - Number the lines.
 * @property {number} start - The first line's number.
 * @property {string | undefined} highlight - Line positions to highlight.
 */

/**
 * Build the rows of a line-structured snippet.
 * @param {string} code
 * @param {BuildRowsOptions} options
 */
export function buildRows(code, { diff, numbers, start, highlight }) {
  const lines = splitLines(code);
  const highlighted = parseLineRanges(highlight, lines.length);
  const width = numbers ? String(start + lines.length - 1).length : 0;
  /** @type {Record<LineKind, number[]>} */
  const positions = { highlighted: [], added: [], removed: [] };

  /** @type {CodeRow[]} */
  const rows = lines.map((line, index) => {
    const position = index + 1;
    const change = diff ? changeOf(line) : undefined;
    const marker = (change && MARKERS[change]) || " ";
    const columns = [];
    if (numbers) columns.push(String(start + index).padStart(width));
    if (diff) columns.push(marker);
    if (highlighted.has(position)) positions.highlighted.push(position);
    if (change) positions[change].push(position);
    const eol = line.endsWith("\n");
    const text = diff ? line.slice(1) : line;
    return {
      text: eol ? text.replace(TRAILING_BREAK, "") : text,
      eol,
      // A column of room before, and two after, for the gap to the code.
      gutter: columns.length ? ` ${columns.join(" ")}  ` : "",
      highlighted: highlighted.has(position),
      change,
    };
  });

  // Every row's gutter is as wide as the first's: monospace, padded.
  const gutterChars = rows[0]?.gutter.length ?? 0;

  return {
    rows,
    gutterChars,
    /** @type {Record<LineKind, Array<[number, number]>>} */
    runs: {
      highlighted: toRuns(positions.highlighted),
      added: toRuns(positions.added),
      removed: toRuns(positions.removed),
    },
  };
}

/**
 * The text a diff snippet copies. `"diff"` is `code` as written, markers
 * included. `"result"` is the text after the change: removed lines dropped,
 * and the marker column taken off the rest.
 * @param {string} code
 * @param {"diff" | "result"} mode
 * @returns {string}
 */
export function copyDiffText(code, mode) {
  if (mode === "diff") return code;
  const result = splitLines(code)
    .filter((line) => changeOf(line) !== "removed")
    .map((line) => line.slice(1))
    .join("");
  // A removed last line leaves the one before it with a line break the
  // source did not end on.
  return code.endsWith("\n") ? result : result.replace(TRAILING_BREAK, "");
}
