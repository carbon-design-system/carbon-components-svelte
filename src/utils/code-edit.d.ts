/** Replace `text[from, to)` with `insert`, then select `[start, end]` of the new text. */
export interface CodeEdit {
  from: number;
  to: number;
  insert: string;
  start: number;
  end: number;
}

export interface IndentOptions {
  indent: "spaces" | "tabs";
  tabSize: number;
}

/** A line as a flat run of `[type, text]` pairs: `[type, text, type, text, ...]`. */
export type LineSegments = (string | null)[];

export function lineStarts(text: string): number[];
export function lineAt(starts: number[], offset: number): number;
export function indentUnit(options: IndentOptions): string;
export function maxColumns(text: string, tabSize: number): number;
export function indentEdit(
  text: string,
  start: number,
  end: number,
  options: IndentOptions,
  outdent?: boolean,
): CodeEdit | null;
export function newlineEdit(
  text: string,
  start: number,
  end: number,
  options: IndentOptions,
): CodeEdit;
export function pairEdit(
  text: string,
  start: number,
  end: number,
  char: string,
): CodeEdit | null;
export function pairBackspaceEdit(
  text: string,
  start: number,
  end: number,
): CodeEdit | null;
export function paintWindow(metrics: {
  scrollTop: number;
  viewport: number;
  lineHeight: number;
  paddingTop: number;
  total: number;
  overscan: number;
}): { from: number; to: number; visibleFrom: number; visibleTo: number };
export function paintCovers(
  painted: { from: number; to: number },
  view: { visibleFrom: number; visibleTo: number },
  total: number,
  margin: number,
): boolean;
export function lineSegments(
  text: string,
  starts: number[],
  tokens: { type: string | null; text: string }[] | undefined,
  from: number,
  to: number,
): LineSegments[];
