export type TextIndex = {
  /** The text of the container. */
  text: string;
  /** The text nodes that make it up, none empty. */
  nodes: Text[];
  /** The offset at which each node starts. */
  starts: number[];
  /** Where each node is in `nodes`. */
  positions: Map<Text, number>;
};

/** Walk the container's text nodes and note where each starts. */
export function buildTextIndex(root: Node): TextIndex;

/** The range covering the text between two offsets, or `null` with no text. */
export function rangeFromOffsets(
  index: TextIndex,
  start: number,
  end: number,
  doc?: Document,
): Range | null;

/** The offset of a DOM boundary point. */
export function offsetOfPoint(
  index: TextIndex,
  container: Node,
  offset: number,
): number;

/** The offsets a range covers. */
export function offsetsFromRange(
  index: TextIndex,
  range: Range,
): { start: number; end: number };

/** Narrow offsets to the text between them with no space at either edge. */
export function trimOffsets(
  text: string,
  start: number,
  end: number,
): { start: number; end: number };
