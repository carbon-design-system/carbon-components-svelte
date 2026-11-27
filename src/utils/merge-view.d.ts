export type SideRow = {
  /** `"head"` is a conflict's action row (two rows tall, followed by a `"pad"`). */
  kind: "line" | "head" | "pad";
  chunk: number;
  text: string;
  /** The line number in the side's file, or 0 for a head or pad. */
  no: number;
  /** The index of the line within its chunk. */
  at: number;
};

/** Cut a token list into lines; a token that spans lines is split. */
export function cutTokenLines(
  tokens: ReadonlyArray<{ type: string | null; text: string }>,
): Array<Array<[string | null, string]>>;

export function buildSideRows(
  chunks: ReadonlyArray<{
    type: string;
    ours: string[];
    theirs: string[];
    base: string[] | null;
  }>,
  side: "ours" | "theirs",
): { rows: SideRow[]; starts: number[]; longest: number };

/**
 * The y to put a pane at so it shows the same place as `y` in another pane,
 * given where each chunk starts in both (ending with the content height).
 */
export function mapScroll(
  from: ArrayLike<number>,
  to: ArrayLike<number>,
  y: number,
): number;

/** The rows to paint: those in view plus `overscan` either side. */
export function paintedRows(
  scrollTop: number,
  viewport: number,
  rowHeight: number,
  count: number,
  overscan?: number,
): { from: number; to: number };

/**
 * Split a line's runs at the edges of marked character ranges, flagging the
 * pieces inside a range.
 */
export function markSegments(
  segments: ReadonlyArray<[string | null, string]>,
  ranges: ReadonlyArray<[number, number]>,
): Array<[string | null, string, boolean]>;
