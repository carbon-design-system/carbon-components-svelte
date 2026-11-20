/** The keys `moveGridCursor` answers to. */
export const GRID_CURSOR_KEYS: string[];

/**
 * Where an arrow, Home, End or page key takes the cursor in a grid of equal
 * cells laid out in lines of `columns`. `key` is the key as an LTR page reads
 * it, so swap Left and Right under RTL first (see `inlineGridKey`).
 * Returns `null` for a key that is not a grid key, or an empty grid.
 */
export function moveGridCursor(options: {
  /** The cell the cursor is on, or `-1`. */
  index: number;
  count: number;
  columns: number;
  key: string;
  /** Home and End go to the ends of the grid. */
  ctrl?: boolean;
  /** Lines a page key moves. Default 1. */
  pageRows?: number;
  /** The column to aim for on a vertical move. */
  column?: number;
}): { index: number; column: number } | null;

/** Swap Left and Right under RTL, so a move follows the reading direction. */
export function inlineGridKey(key: string, rtl: boolean): string;
