import type { VizColor } from "./tokens.js";

export type ShareItem<Id extends string | number = string> = {
  id: Id;
  label: string;
  value: number;
  /** Overrides the palette color for this item. */
  color?: VizColor;
};

export type ShareSegment<Id extends string | number = string> = {
  /** The source item, or a synthetic `"other"` item for the folded tail. */
  item: ShareItem<Id>;
  /** The items folded into this segment, or `null` for a regular segment. */
  items: ReadonlyArray<ShareItem<Id>> | null;
  /** The value, with negative and non-finite input counted as zero. */
  value: number;
  /** Share of the total, 0 to 1. */
  share: number;
  /** Share of the total, 0 to 100. */
  pct: number;
  index: number;
};

export type Shares<Id extends string | number = string> = {
  total: number;
  segments: ShareSegment<Id>[];
};

/**
 * Share of the total for each item, in input order. Negative and non-finite
 * values count as zero. With `maxSegments`, the first `maxSegments - 1` items
 * keep their own segment and the rest fold into one trailing segment, so sort
 * by value first to fold the smallest.
 */
export function getShares<Id extends string | number = string>(
  items: ReadonlyArray<ShareItem<Id>>,
  options?: { maxSegments?: number; otherLabel?: string },
): Shares<Id>;
