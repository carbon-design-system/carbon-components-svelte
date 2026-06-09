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
};

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
};

/** `scrollTop` for the selected item on open, or `0` when `selectedIndex < 0`. */
export function scrollSelectedIntoView(
  options: ScrollSelectedIntoViewOptions,
): number;

/** Scroll position to reset when a virtualized menu closes. */
export function resetVirtualScrollOnClose(): number;
