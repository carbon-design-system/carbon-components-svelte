/**
 * Per-option heights indexed by item. An entry that is not a finite,
 * non-negative number means the option has not been measured yet and takes an
 * estimated height instead. Zero is a real height.
 */
export type ItemHeights = ArrayLike<number | undefined>;

export type VirtualizeConfig<
  Item extends Record<string, unknown> = Record<string, unknown>,
> = {
  items: Item[];
  itemHeight: number;
  containerHeight: number;
  scrollTop: number;
  /** @default 3 */
  overscan?: number;
  maxItems?: number;
  /** @default 100 */
  threshold?: number;
  /**
   * Derive offsets from `heights` instead of applying `itemHeight` to every
   * option. Read only while the list is windowed.
   * @default false
   */
  measured?: boolean;
  heights?: ItemHeights;
};

export type VirtualizeResult<
  Item extends Record<string, unknown> = Record<string, unknown>,
> = {
  visibleItems: Item[];
  startIndex: number;
  endIndex: number;
  offsetY: number;
  totalHeight: number;
  isVirtualized: boolean;
};

export type GetVisibleRangeOptions = {
  scrollTop: number;
  itemHeight: number;
  containerHeight: number;
  itemCount: number;
  /** @default 3 */
  overscan?: number;
  maxItems?: number;
  /**
   * Resolve the range by searching accumulated positions instead of dividing
   * by `itemHeight`, which then serves only as the estimate for options with
   * no entry.
   */
  heights?: ItemHeights;
};

/**
 * The mean of the measured entries in `heights`, or `null` when none are.
 * Outlives the heights it came from: a caller forgetting per-option heights can
 * keep this and hand it back as `virtualListState`'s `estimate`.
 */
export function getMeasuredAverage(
  heights: ItemHeights | undefined,
  count?: number,
): number | null;

/** Compute the `[startIndex, endIndex)` slice of items to render. */
export function getVisibleRange(options: GetVisibleRangeOptions): {
  startIndex: number;
  endIndex: number;
};

/** Render only the visible slice of a fixed-height list. */
export function virtualize<
  Item extends Record<string, unknown> = Record<string, unknown>,
>(config: VirtualizeConfig<Item>): VirtualizeResult<Item>;

export type VirtualListConfig = {
  itemHeight: number;
  containerHeight: number;
  overscan: number;
  threshold: number;
  maxItems: number | undefined;
  measured: boolean;
};

/** Default virtualization config for listbox-like components. */
export const DEFAULT_VIRTUAL_LIST_CONFIG: VirtualListConfig;

export type VirtualListStateOptions<
  Item extends Record<string, unknown> = Record<string, unknown>,
> = {
  items: Item[];
  scrollTop: number;
  shouldVirtualize: boolean;
  virtualize: boolean | Partial<VirtualListConfig> | undefined;
  defaults?: Partial<VirtualListConfig>;
  /** Read only when the config opts into measuring and the list is windowed. */
  heights?: ItemHeights;
  /**
   * Height to assume for options nothing has measured yet, in place of the
   * config's `itemHeight`. The returned config carries the seed actually used.
   */
  estimate?: number;
};

export type VirtualListStateResult<
  Item extends Record<string, unknown> = Record<string, unknown>,
> = {
  config: (VirtualListConfig & Record<string, unknown>) | null;
  data: VirtualizeResult<Item> | null;
  itemsToRender: Item[];
};

/** Resolve config, virtualize result, and items to render for a listbox menu. */
export function virtualListState<
  Item extends Record<string, unknown> = Record<string, unknown>,
>(options: VirtualListStateOptions<Item>): VirtualListStateResult<Item>;

export type GetBoundedScrollTopOptions = {
  index: number;
  itemHeight: number;
  containerHeight: number;
  itemCount: number;
  /** Position by accumulated height instead of multiplying by `itemHeight`. */
  heights?: ItemHeights;
};

/** `scrollTop` to place the item at `index` at the top of the viewport, clamped. */
export function getBoundedScrollTop(
  options: GetBoundedScrollTopOptions,
): number;

export type ScrollHighlightedIntoViewOptions = {
  highlightedIndex: number;
  currentScrollTop: number;
  itemCount: number;
  itemHeight: number;
  containerHeight: number;
  /** @default 3 */
  overscan?: number;
  maxItems?: number;
  heights?: ItemHeights;
};

/**
 * `scrollTop` to bring a keyboard-highlighted item into view, or `null` if
 * already visible.
 */
export function scrollHighlightedIntoView(
  options: ScrollHighlightedIntoViewOptions,
): number | null;

export type ScrollSelectedIntoViewOptions = {
  selectedIndex: number;
  itemCount: number;
  itemHeight: number;
  containerHeight: number;
  heights?: ItemHeights;
};

/** `scrollTop` for the selected item on open, or `0` when `selectedIndex < 0`. */
export function scrollSelectedIntoView(
  options: ScrollSelectedIntoViewOptions,
): number;

export type GetMeasuredScrollCorrectionOptions = {
  /** Position the correction is relative to. */
  scrollTop: number;
  itemCount: number;
  /** Seed estimate for unmeasured options. */
  itemHeight: number;
  containerHeight: number;
  /** Per-option heights as they are now. */
  heights: ItemHeights | undefined;
  /** Per-option heights `scrollTop` was computed against. */
  previousHeights: ItemHeights | undefined;
};

/**
 * `getScrollCorrection` for a caller that knows its scroll position but not
 * which option to anchor on: the anchor is the topmost option on screen at
 * `scrollTop`. Returns the delta to add to `scrollTop`.
 */
export function getMeasuredScrollCorrection(
  options: GetMeasuredScrollCorrectionOptions,
): number;

/** Scroll position to reset when a virtualized menu closes. */
export function resetVirtualScrollOnClose(): number;
