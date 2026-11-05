export type Offsets = {
  /** How many items the index holds. */
  count: () => number;
  /** Scroll size of every item, in pixels. */
  total: () => number;
  /**
   * Distance from the start of the list to the start of item `index`.
   * `offsetOf(count)` is `total()`.
   */
  offsetOf: (index: number) => number;
  /**
   * Index of the item that contains `offset`: the last item that starts at or
   * before it, clamped to the list. `0` for an empty list.
   */
  indexAt: (offset: number) => number;
  /**
   * The most items, counted from the first, that end within `limit`: the
   * largest `i` in `[0, count]` with `offsetOf(i) <= limit`.
   */
  countWithin: (limit: number) => number;
  /**
   * The first `i` in `[0, count]` whose `offsetOf(i)` is at least `target`, or
   * `count + 1` when even the end of the list falls short of it.
   */
  lowerBound: (target: number) => number;
  /** Record a measured size. Returns whether it changed anything. */
  set: (index: number, size: number) => boolean;
  /** The measured size of item `index`, or `undefined` if it has none. */
  get: (index: number) => number | undefined;
  /** The size layout gives item `index`: measured, else the estimate. */
  sizeOf: (index: number) => number;
  setEstimate: (estimate: number) => void;
  getEstimate: () => number;
  /** Mean of the measured sizes, or `null` when none is measured. */
  getMeasuredAverage: () => number | null;
  measuredCount: () => number;
  /** Grow or truncate the list. Items past the old end are unmeasured. */
  setCount: (count: number) => void;
  /**
   * Insert `delta` unmeasured items at the front when positive, or drop
   * `-delta` items from the front when negative. The sizes of the items that
   * stay move with them.
   */
  shift: (delta: number) => void;
  /** Forget every measured size. */
  clear: () => void;
};

/**
 * An offsets index for items of unequal, measured size. Two Fenwick trees hold
 * the measured sizes and how many there are, so setting a size, reading an
 * offset and finding the item at an offset are O(log n), and changing the
 * estimate for every unmeasured item is O(1).
 */
export function createOffsets(options?: {
  count?: number;
  /** Size of an item with no measurement. */
  estimate?: number;
  /**
   * Sizes already measured, by index. A hole, `undefined`, or a negative or
   * non-finite number is not measured.
   */
  sizes?: ArrayLike<number | undefined>;
}): Offsets;

/**
 * The same index for items that all share one size: nothing is stored, and
 * every answer is arithmetic.
 */
export function createFixedOffsets(options?: {
  count?: number;
  size?: number;
}): Offsets;
