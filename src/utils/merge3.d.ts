export type SplitText = {
  lines: string[];
  /** `"\r\n"` when most line endings are CRLF, else `"\n"`. */
  eol: "\n" | "\r\n";
  /** Whether the text ends with a line ending. */
  finalNewline: boolean;
};

/** A differing stretch: `a[aStart, aEnd)` is replaced by `b[bStart, bEnd)`. */
export type Hunk = {
  aStart: number;
  aEnd: number;
  bStart: number;
  bEnd: number;
};

export type ChunkType = "unchanged" | "ours" | "theirs" | "both" | "conflict";

export type MergeChunk = {
  type: ChunkType;
  /** The lines in the common ancestor, or `null` when markers had no base. */
  base: string[] | null;
  ours: string[];
  theirs: string[];
};

export type MergeModel = {
  chunks: MergeChunk[];
  eol: "\n" | "\r\n";
  finalNewline: boolean;
  /** Whether every conflict has a base to accept. */
  hasBase: boolean;
  /** Names after the markers (`<<<<<<< HEAD`). */
  labels: { ours?: string; theirs?: string; base?: string };
};

/**
 * Split text into lines, remembering its line ending and whether it ended
 * with one.
 */
export function splitText(text: string): SplitText;

export function joinLines(
  lines: string[],
  options?: { eol?: string; finalNewline?: boolean },
): string;

/**
 * The differing stretches between two lists of line ids. Past `maxCost`
 * edit steps the rest counts as one replaced stretch: valid, if longer
 * than minimal.
 */
export function diffHunks(
  a: ArrayLike<number>,
  b: ArrayLike<number>,
  maxCost?: number,
): Hunk[];

/**
 * Three-way merge by lines. Chunks cover the whole file in order:
 * `"unchanged"` (neither side touched it), `"ours"` or `"theirs"` (only
 * that side changed it), `"both"` (the same change on both sides) and
 * `"conflict"` (two different changes). Changes that touch are one
 * conflict, as in git.
 */
export function merge3(
  base: string,
  ours: string,
  theirs: string,
  options?: { maxCost?: number },
): MergeModel;

/** Whether a line is a git conflict opener (`<<<<<<<`) or closer (`>>>>>>>`). */
export function isConflictMarker(line: string): boolean;

/**
 * Parse a file with git conflict markers. A block that never closes is
 * plain text.
 */
export function parseConflictMarkers(text: string): MergeModel;

/**
 * The lines of a conflict as git writes them: ours, the base when the
 * chunk has one, then theirs, between markers.
 */
export function conflictMarkerLines(
  chunk: Pick<MergeChunk, "ours" | "theirs" | "base">,
  labels?: { ours?: string; theirs?: string; base?: string },
): string[];

/**
 * Changed character ranges between two lines, by words. `null` when a line
 * is over `maxLength` characters or little of the text is shared.
 */
export function wordDiff(
  a: string,
  b: string,
  maxLength?: number,
): null | { a: Array<[number, number]>; b: Array<[number, number]> };
