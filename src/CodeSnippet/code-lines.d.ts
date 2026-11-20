export type LineKind = "highlighted" | "added" | "removed";

export interface CodeRow {
  /** The line's code, without its line break. */
  text: string;
  /** Whether a line break ends the line. */
  eol: boolean;
  /** The line number and diff marker, drawn by CSS. */
  gutter: string;
  highlighted: boolean;
  change: "added" | "removed" | undefined;
}

export interface BuildRowsOptions {
  /** Read the first column as a diff marker. */
  diff: boolean;
  /** Number the lines. */
  numbers: boolean;
  /** The first line's number. */
  start: number;
  /** Line positions to highlight. */
  highlight: string | undefined;
}

/**
 * Parse a line list such as `"2,4-6"` into 1-based line numbers. Anything
 * that is not a number or a range is skipped, and a line past `max` is
 * dropped, so a stale list never throws.
 */
export function parseLineRanges(
  spec: string | undefined,
  max: number,
): Set<number>;

/** Collapse sorted line numbers into runs. */
export function toRuns(lines: Iterable<number>): Array<[number, number]>;

/**
 * The default spoken description of a kind of line: "Lines 2, 4 to 6
 * highlighted."
 */
export function defaultLinesDescription(
  kind: LineKind,
  runs: Array<[number, number]>,
): string;

/**
 * Split `code` into lines, each keeping its line break so the rows' text
 * joins back to `code`. A trailing line break ends the last line instead of
 * starting an empty one, as in the unsplit snippet.
 */
export function splitLines(code: string): string[];

/** Build the rows of a line-structured snippet. */
export function buildRows(
  code: string,
  options: BuildRowsOptions,
): {
  rows: CodeRow[];
  gutterChars: number;
  runs: Record<LineKind, Array<[number, number]>>;
};

/**
 * The text a diff snippet copies. `"diff"` is `code` as written, markers
 * included. `"result"` is the text after the change: removed lines dropped,
 * and the marker column taken off the rest.
 */
export function copyDiffText(code: string, mode: "diff" | "result"): string;
