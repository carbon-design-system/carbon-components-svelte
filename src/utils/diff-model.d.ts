import type { PatchFile } from "./unified-diff.js";

/** The data behind DiffViewer: lines, the rows a view paints, and the pieces on a row. */

/** A syntax token, as `tokenize` from `carbon-components-svelte/syntax` returns it. */
export type DiffToken = { type: string | null; text: string };

/**
 * One line of the diff, in unified order: a changed block lists its removed
 * lines, then its added ones. A `"gap"` opens each hunk of a patch and stands
 * for the lines the patch leaves out before it.
 */
export type DiffLine = {
  type: "equal" | "delete" | "insert" | "gap";
  /** The line; a gap's section heading. */
  text: string;
  /** Line number in the old text, 0 when absent. A gap's first old line. */
  oldNo: number;
  /** Line number in the new text, 0 when absent. A gap's first new line. */
  newNo: number;
  /** Index of the changed block it belongs to, -1 if none. */
  change: number;
  /** The line it replaces or is replaced by. */
  pair: DiffLine | null;
  /** Syntax tokens covering `text`. */
  tokens: DiffToken[] | null;
  /** The source has no newline after it. */
  noNewline: boolean;
  /** A gap's count of lines the patch leaves out before it. */
  hidden: number;
  /** A gap's old line count, for its header. */
  oldCount: number;
  /** A gap's new line count, for its header. */
  newCount: number;
};

export type DiffStats = {
  added: number;
  removed: number;
  /** Changed blocks. */
  changes: number;
};

/** A row that opens a stretch of lines: its `@@` header, a fold control, or both. */
export type HunkRow = {
  type: "hunk";
  /** Index in the lines of the first folded line; -1 when none can be shown. */
  id: number;
  /** How many lines sit above, folded or left out of a patch. */
  hidden: number;
  /** `@@ -1,4 +1,5 @@`, or empty. */
  header: string;
  /** The fold sits after the last line. */
  trailing: boolean;
  change: -1;
};

/** A row of the side by side view. */
export type PairRow = {
  type: "pair";
  left: DiffLine | null;
  right: DiffLine | null;
  /** Index of the changed block, -1 if none. */
  change: number;
};

export type DiffRow = DiffLine | HunkRow | PairRow;

export type DiffRows = {
  rows: DiffRow[];
  /** Row index where each changed block starts. */
  changes: number[];
};

export type DiffLinesOptions = {
  /** Treat lines that differ only in whitespace as equal. */
  ignoreWhitespace?: boolean;
  /** See `diffSequence`. */
  maxCost?: number;
};

export type BuildRowsOptions = {
  view: "split" | "unified";
  /**
   * Unchanged lines kept around a change. `Infinity` keeps all.
   * @default 3
   */
  context?: number;
  /** Ids of folds the reader opened. */
  expanded?: ReadonlySet<number>;
  /**
   * Write `@@` headers.
   * @default true
   */
  hunkHeaders?: boolean;
  /**
   * Fewest hidden lines worth a fold.
   * @default 2
   */
  minFold?: number;
};

export type LineSegment = {
  text: string;
  /** Syntax token type. */
  type: string | null;
  /** Inside a changed word. */
  mark: boolean;
};

/**
 * Split text into lines. A final newline ends the last line instead of
 * opening an empty one, and CR LF is one break.
 */
export function splitLines(text: string): string[];

/** Diff two texts into the lines of a diff. */
export function diffLines(
  oldText: string,
  newText: string,
  options?: DiffLinesOptions,
): { lines: DiffLine[]; stats: DiffStats };

/**
 * Lines of a diff from one file of a parsed patch. Each hunk opens with a gap
 * line that records where it starts and how many lines the patch skipped.
 */
export function patchLines(file: PatchFile): {
  lines: DiffLine[];
  stats: DiffStats;
};

/** `@@ -1,4 +1,5 @@`, with the section heading after it when there is one. */
export function formatHunkHeader(
  oldStart: number,
  oldCount: number,
  newStart: number,
  newCount: number,
  heading?: string,
): string;

/**
 * The rows a view paints. Unified rows are the lines themselves, with a hunk
 * row where a stretch opens. Split rows put a removed line beside the added
 * line that replaces it.
 */
export function buildRows(
  lines: DiffLine[],
  options: BuildRowsOptions,
): DiffRows;

/**
 * A diff as a unified patch, the text `git apply` reads. Empty when nothing
 * changed.
 */
export function formatUnifiedDiff(
  lines: DiffLine[],
  options?: { context?: number; oldPath?: string; newPath?: string },
): string;

/**
 * Cut syntax tokens into the lines of the text they cover. A token that
 * spans lines is split, and the break is dropped.
 */
export function tokensByLine(tokens: ReadonlyArray<DiffToken>): DiffToken[][];

/**
 * Give every line syntax tokens. Each side is tokenized whole, so a comment
 * or template that spans lines colors them all: removed lines read the old
 * side, the rest the new side.
 */
export function highlightLines(
  lines: DiffLine[],
  tokenize: (code: string) => ReadonlyArray<DiffToken> | undefined,
): void;

/**
 * The changed words of a line that replaces, or is replaced by, another, as
 * flat `[start, end, ...]` offsets. `null` when the line has no counterpart
 * or the two share too little to mark.
 */
export function inlineRanges(line: DiffLine): number[] | null;

/** Split a line into runs that share a syntax token and a word mark. */
export function lineSegments(
  text: string,
  tokens: ReadonlyArray<DiffToken> | null,
  ranges: ReadonlyArray<number> | null,
): LineSegment[];
