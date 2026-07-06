export interface GetVisibleTagCountOptions {
  /** measured width of each tag, in order */
  tagWidths: number[];
  availableWidth: number;
  /** measured width of the "+N" trigger */
  overflowWidth: number;
  /** upper bound independent of space */
  maxVisible?: number;
}

/**
 * Compute how many tags fit before the overflow trigger, given their
 * measured widths in order and the space available. Backtracks by one tag
 * at a time if the overflow trigger itself doesn't fit once at least one tag
 * is hidden.
 */
export function getVisibleTagCount(options: GetVisibleTagCountOptions): number;
