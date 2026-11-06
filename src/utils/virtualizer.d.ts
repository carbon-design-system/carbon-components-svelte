import type { Offsets } from "./virtual-offsets.js";

export type ScrollAlign = "start" | "center" | "end" | "nearest";

export type VirtualizerState = {
  /**
   * Whether the list is windowed. Below `threshold`, or with no usable size,
   * every item renders.
   */
  isVirtualized: boolean;
  /** First rendered item. */
  startIndex: number;
  /** One past the last rendered item. */
  endIndex: number;
  /** Where `startIndex` starts, in pixels from the start of the list. */
  startOffset: number;
  /** Where `endIndex` starts. */
  endOffset: number;
  /** Scroll size of the list, in pixels. Capped by `maxSize`. */
  totalSize: number;
  /** Items the scroll size holds: `count`, or fewer when `maxSize` ends early. */
  count: number;
  /** The scroll position the state was resolved for. */
  scrollOffset: number;
  viewportSize: number;
  /** Whether the end of the list is in view. */
  atEnd: boolean;
  /**
   * Whether the list holds the end in view as it grows. Always `false` unless
   * `follow` is `"end"`.
   */
  following: boolean;
  /**
   * Items from `keepMounted` that exist, ascending. They render apart from the
   * window, wherever the window is, so the element of one that scrolls out of
   * view is the element that was in view.
   */
  kept: number[];
  /** The item from `stickyIndices` pinned to the start of the viewport, or `-1`. */
  stickyIndex: number;
};

export type VirtualizerOptions = {
  /**
   * How many items the list holds.
   * @default 0
   */
  count?: number;
  /**
   * The size of every item, or a function from index to size for a list whose
   * sizes are known up front. With `measured`, a number is the estimate for
   * items nothing has measured yet.
   * @default 0
   */
  size?: number | ((index: number) => number);
  /**
   * Take sizes from `measure` rather than from `size`.
   * @default false
   */
  measured?: boolean;
  /** Overrides `size` as the seed estimate while `measured`. */
  estimateSize?: number;
  /**
   * How much of the list is visible.
   * @default 0
   */
  viewportSize?: number;
  /**
   * Items to render beyond the viewport on each side.
   * @default 3
   */
  overscan?: number;
  /**
   * How far, as a multiple of the last scroll step, to render ahead in the
   * direction of travel, up to one viewport. `0` turns it off.
   * @default 1
   */
  lead?: number;
  /** Most items to render at once. */
  maxItems?: number;
  /**
   * The tallest scroll area to lay out. The list ends at the last item that
   * fits.
   * @default Infinity
   */
  maxSize?: number;
  /**
   * Fewest items before windowing starts.
   * @default 0
   */
  threshold?: number;
  /**
   * Scroll position to resolve the first window for. Read once, at creation.
   * @default 0
   */
  initialOffset?: number;
  /**
   * `"end"` keeps the end in view as items arrive or resize, until the reader
   * scrolls away from it.
   * @default false
   */
  follow?: false | "end";
  /** Items that must stay rendered wherever they are, such as the focused one. */
  keepMounted?: ReadonlyArray<number>;
  /** Ascending items that pin to the start of the viewport once scrolled past. */
  stickyIndices?: ReadonlyArray<number>;
  /**
   * Writes a scroll position, and returns the one the scroller took, which may
   * be clamped.
   */
  scrollTo?: (offset: number) => number | void;
};

export type Virtualizer = {
  /** The Svelte store contract: the listener runs now, and when the window moves. */
  subscribe: (listener: (state: VirtualizerState) => void) => () => void;
  getState: () => VirtualizerState;
  /** Take new options. Cheap when nothing changed. */
  setOptions: (options: Partial<VirtualizerOptions>) => VirtualizerState;
  /** The scroller reports its position. */
  setScroll: (offset: number) => VirtualizerState;
  setViewport: (size: number) => VirtualizerState;
  /**
   * Record measured sizes, as index and size pairs. The reader's place holds:
   * the scroll position moves by how far the items above it changed.
   * @returns Whether any size changed.
   */
  measure: (entries: Iterable<readonly [number, number]>) => boolean;
  /** Forget every measured size, as when the list is replaced. */
  resetMeasurements: () => void;
  /**
   * Add `added` items at the front, which grows `count` by as many. The scroll
   * position moves by the size of what was added, so the item in view stays in
   * view. Measured sizes move with their items.
   *
   * By default the position moves once the reader has scrolled, and stays at
   * the top otherwise, as the browser's scroll anchoring does, so new items at
   * the top come into view. `anchor: true` holds the place at the top too, as
   * when loading older messages. `anchor: false` never moves it.
   */
  prepend: (added: number, config?: { anchor?: boolean }) => void;
  /** Drop `removed` items from the front, holding the reader's place. */
  dropFront: (removed: number) => void;
  /**
   * Scroll so that item `index` sits as `align` asks. With measured sizes the
   * request stays open, and is satisfied again as sizes arrive, until the reader
   * scrolls.
   * @returns The position written, or `null` when the item is already there.
   */
  scrollToIndex: (
    index: number,
    config?: { align?: ScrollAlign },
  ) => number | null;
  /** Scroll to the end, and hold it there when `follow` is `"end"`. */
  scrollToEnd: () => number | null;
  /**
   * The reader has taken hold of the scroller, with the wheel, a touch or a
   * key. A list that follows its end lets go, and an outstanding scroll
   * request is dropped. Scrolling back to the end follows it again.
   */
  release: () => void;
  /** Where item `index` starts, in pixels from the start of the list. */
  offsetOf: (index: number) => number;
  /** The size layout gives item `index`: measured, else the estimate. */
  sizeOf: (index: number) => number;
  /** The item that contains `offset`. */
  indexAt: (offset: number) => number;
  /** The scroll position last told or written. */
  getScrollOffset: () => number;
  /** The mean measured size, or `null` before any. */
  getMeasuredAverage: () => number | null;
  /** The measured size of item `index`, if there is one. */
  getMeasuredSize: (index: number) => number | undefined;
  /** Drop an outstanding scroll request without moving. */
  cancelScroll: () => void;
  /** Whether a scroll request is waiting on measurements. */
  hasPendingScroll: () => boolean;
  /** The scroll request waiting on measurements, if there is one. */
  getPendingScroll: () => {
    index: number;
    align: ScrollAlign;
    /** The position it was last placed at. */
    target: number;
  } | null;
  /**
   * Tell the engine where the scroller sits, without reading a move into it, so
   * the position sets no lead of its own. The lead the reader's last scroll set
   * stays.
   */
  syncScroll: (offset: number) => VirtualizerState;
  /** Forget which way the reader was scrolling, so nothing renders ahead. */
  clearLead: () => VirtualizerState;
};

/** Create a virtualizer for one axis. */
export function createVirtualizer(options?: VirtualizerOptions): Virtualizer;

/** Narrow `[startIndex, endIndex)` to at most `maxItems` entries. */
export function capToMaxItems(
  startIndex: number,
  endIndex: number,
  maxItems?: number,
): number;

/**
 * How far past the viewport to render in the direction of travel, up to one
 * viewport. Signed: negative extends the window toward the start.
 */
export function getScrollLead(
  scrollDelta: number,
  viewportSize: number,
): number;

/**
 * The `[startIndex, endIndex)` slice of the first `count` items that
 * intersects `[top, top + size)`, padded by `overscan` items each side.
 */
export function getRange(
  offsets: Offsets,
  count: number,
  top: number,
  size: number,
  overscan: number,
): { startIndex: number; endIndex: number };

/** `getRange` with the viewport extended by `lead` in the direction of travel. */
export function getWindow(options: {
  offsets: Offsets;
  count: number;
  scrollOffset: number;
  viewportSize: number;
  overscan: number;
  lead: number;
  maxItems?: number;
}): { startIndex: number; endIndex: number };

/**
 * Where to scroll so that the item at `index` sits as `align` asks, clamped to
 * the scrollable range. `"nearest"` returns `null` when the item is already
 * fully in view and rendered.
 */
export function getScrollOffsetForIndex(options: {
  offsets: Offsets;
  count: number;
  index: number;
  align: ScrollAlign;
  scrollOffset: number;
  viewportSize: number;
  /** @default 3 */
  overscan?: number;
  maxItems?: number;
}): number | null;

/**
 * How many items were added at the front of a list: `next` is `previous` with
 * items put before it. `0` when it is not. Costs the same for a list of a
 * million.
 */
export function getPrependedCount<T>(
  previous: ReadonlyArray<T>,
  next: ReadonlyArray<T>,
  getKey?: (item: T) => unknown,
): number;

export type GridVirtualizerState = {
  rows: VirtualizerState;
  columns: VirtualizerState;
};

export type GridVirtualizer = {
  /** The virtualizer for the rows, which scroll along the block axis. */
  rows: Virtualizer;
  /** The virtualizer for the columns, which scroll along the inline axis. */
  columns: Virtualizer;
  getState: () => GridVirtualizerState;
  /** The Svelte store contract: the listener runs now, and when either window moves. */
  subscribe: (listener: (state: GridVirtualizerState) => void) => () => void;
  /**
   * The scroller reports its position. `left` is the distance from the inline
   * start, so it is positive in a right-to-left grid too.
   */
  setScroll: (top: number, left: number) => void;
  /** Scroll so that the cell at `row` and `column` sits as `align` asks. */
  scrollToCell: (
    row: number,
    column: number,
    config?: { align?: ScrollAlign },
  ) => void;
};

/**
 * Two virtualizers, one per axis, for a grid or a matrix. The cells to render
 * are rows `rows.startIndex` to `rows.endIndex` by columns
 * `columns.startIndex` to `columns.endIndex`.
 */
export function createGridVirtualizer(options: {
  rows: VirtualizerOptions;
  columns: VirtualizerOptions;
}): GridVirtualizer;

/**
 * How many items were dropped from the front of a list, as a log does that
 * keeps its last lines. `next` is `previous` without its first items, with
 * items possibly added at the end. `0` when it is not. Costs the same for a
 * list of a million.
 */
export function getDroppedCount<T>(
  previous: ReadonlyArray<T>,
  next: ReadonlyArray<T>,
  getKey?: (item: T) => unknown,
  /** @default 1000 */
  limit?: number,
): number;
