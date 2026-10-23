import type { ShareItem } from "./shares.js";

export type RankRow<Id extends string | number = string> = {
  /** The source item, or a synthetic `"other"` item for the folded remainder. */
  item: ShareItem<Id>;
  /** The items folded into this row, or `null` for a ranked row. */
  items: ReadonlyArray<ShareItem<Id>> | null;
  /** The value, with negative and non-finite input counted as zero. */
  value: number;
  /** 1-based position, or `null` for the folded row. */
  rank: number | null;
  /** Share of the total of every item, 0 to 1. */
  share: number;
  /** Bar length relative to the largest row, 0 to 100. */
  pct: number;
  index: number;
};

export type Ranks<Id extends string | number = string> = {
  total: number;
  max: number;
  rows: RankRow<Id>[];
};

/**
 * Rank items by value. Rows are sorted descending unless `sort` is `false`,
 * and numbered from 1. With `top`, only the first `top` rows are kept; with
 * `other` as well, the remainder folds into one unranked trailing row. Bar
 * length (`pct`) is relative to the largest row, the folded one included.
 * Share is relative to the total of every item. Negative and non-finite
 * values count as zero.
 */
export function getRanks<Id extends string | number = string>(
  items: ReadonlyArray<ShareItem<Id>>,
  options?: {
    top?: number;
    other?: boolean;
    otherLabel?: string;
    sort?: boolean;
  },
): Ranks<Id>;
