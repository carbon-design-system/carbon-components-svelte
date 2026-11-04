import type { GridLayout } from "./grid-layout.js";

export type GridMove = {
  /** The cell to move to. */
  index: number;
  /** The column to aim for on the next vertical move. */
  column: number;
};

export const GRID_KEYS: string[];

/**
 * Where `key` takes the cursor. Nothing wraps. `key` is the key as an LTR
 * page reads it. Returns `null` for another key or an empty grid.
 */
export function moveGridIndex(options: {
  layout: GridLayout;
  /** The cell the cursor is on. `-1` when none. */
  index: number;
  key: string;
  /** The column to keep on vertical moves. */
  column?: number;
  /** Home and End go to the ends of the grid. */
  ctrl?: boolean;
  /** Lines a page key moves. */
  pageRows?: number;
}): GridMove | null;

export type GridNavOptions = {
  getLayout: () => GridLayout;
  /** The cell the cursor is on, or `-1`. */
  getIndex: () => number;
  onMove: (index: number, event: KeyboardEvent) => void;
  /** Read on each horizontal arrow key. When it returns `true`, ArrowLeft moves to the next cell. */
  rtl?: () => boolean;
  /** Lines a page key moves. @default 1 */
  getPageRows?: () => number;
  /** Return `false` to leave a key to the element, such as the caret keys of a search field with text in it. */
  shouldHandle?: (event: KeyboardEvent) => boolean;
};

/** Arrow, Home, End and page keys on `node` report the next cell through `onMove`. */
export function gridNav(
  node: HTMLElement,
  options: GridNavOptions,
): {
  update: (options: GridNavOptions) => void;
  destroy: () => void;
};
