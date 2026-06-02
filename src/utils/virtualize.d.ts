export type VirtualizeConfig<
  Item extends Record<string, unknown> = Record<string, unknown>,
> = {
  /** Full array of items to virtualize */
  items: Item[];
  /** Height of each item in pixels */
  itemHeight: number;
  /** Visible container height in pixels */
  containerHeight: number;
  /** Current scroll position */
  scrollTop: number;
  /** Extra items to render above/below viewport (default: 3) */
  overscan?: number;
  /** Cap maximum rendered items */
  maxItems?: number;
  /** Minimum items before virtualization activates (default: 100) */
  threshold?: number;
};

export type VirtualizeResult<
  Item extends Record<string, unknown> = Record<string, unknown>,
> = {
  /** Items to render in the current viewport */
  visibleItems: Item[];
  /** Index of first visible item */
  startIndex: number;
  /** Index after last visible item */
  endIndex: number;
  /** Y offset for positioning visible items */
  offsetY: number;
  /** Total height of all items */
  totalHeight: number;
  /** Whether virtualization is active */
  isVirtualized: boolean;
};

export function virtualize<
  Item extends Record<string, unknown> = Record<string, unknown>,
>(config: VirtualizeConfig<Item>): VirtualizeResult<Item>;

export type VirtualListConfig = {
  /** Height of each item in pixels. */
  itemHeight: number;
  /** Visible container height in pixels. */
  containerHeight: number;
  /** Extra items rendered above/below the viewport. */
  overscan: number;
  /** Minimum items before virtualization activates. */
  threshold: number;
  /** Cap maximum rendered items. */
  maxItems: number | undefined;
};

/** Default virtualization config shared by listbox-like components. */
export const DEFAULT_VIRTUAL_LIST_CONFIG: VirtualListConfig;

export type VirtualListStateOptions<
  Item extends Record<string, unknown> = Record<string, unknown>,
> = {
  /** Items to render (already filtered/sorted by the caller). */
  items: Item[];
  /** Current scroll position. */
  scrollTop: number;
  /** Whether virtualization is active. */
  shouldVirtualize: boolean;
  /** The component's `virtualize` prop; object values override the defaults. */
  virtualize: boolean | Partial<VirtualListConfig> | undefined;
  /** Overrides for the shared defaults. */
  defaults?: Partial<VirtualListConfig>;
};

export type VirtualListStateResult<
  Item extends Record<string, unknown> = Record<string, unknown>,
> = {
  /** Resolved config, or `null` when virtualization is disabled. */
  config: (VirtualListConfig & Record<string, unknown>) | null;
  /** Virtualize result, or `null` when virtualization is disabled. */
  data: VirtualizeResult<Item> | null;
  /** Items to render: visible slice when virtualized, otherwise all items. */
  itemsToRender: Item[];
};

/**
 * Derive the virtualization state (config, virtualize result, items to render)
 * for a listbox-like menu in a single call.
 */
export function virtualListState<
  Item extends Record<string, unknown> = Record<string, unknown>,
>(options: VirtualListStateOptions<Item>): VirtualListStateResult<Item>;

export type GetBoundedScrollTopOptions = {
  /** Index of the item to scroll to the top. */
  index: number;
  /** Height of each item in pixels. */
  itemHeight: number;
  /** Visible container height in pixels. */
  containerHeight: number;
  /** Total number of items in the list. */
  itemCount: number;
};

/**
 * Compute the `scrollTop` that brings the item at `index` to the top of a
 * virtualized list's viewport, clamped to the scrollable range.
 */
export function getBoundedScrollTop(
  options: GetBoundedScrollTopOptions,
): number;

export type ScrollHighlightedIntoViewOptions = {
  /** Index of the highlighted item. */
  highlightedIndex: number;
  /** Current scroll position of the list. */
  currentScrollTop: number;
  /** Total number of items in the list. */
  itemCount: number;
  /** Height of each item in pixels. */
  itemHeight: number;
  /** Visible container height in pixels. */
  containerHeight: number;
  /** Extra items rendered above/below the viewport (default: 3). */
  overscan?: number;
};

/**
 * Compute the `scrollTop` needed to bring a keyboard-highlighted item into view,
 * or `null` if the item is already within the visible range.
 */
export function scrollHighlightedIntoView(
  options: ScrollHighlightedIntoViewOptions,
): number | null;

export type ScrollSelectedIntoViewOptions = {
  /** Index of the selected item, or `-1` if none. */
  selectedIndex: number;
  /** Total number of items in the list. */
  itemCount: number;
  /** Height of each item in pixels. */
  itemHeight: number;
  /** Visible container height in pixels. */
  containerHeight: number;
};

/**
 * Compute the `scrollTop` that brings the selected item to the top of the
 * viewport on open, or `0` when there is no selection.
 */
export function scrollSelectedIntoView(
  options: ScrollSelectedIntoViewOptions,
): number;

/**
 * Return the scroll position (`0`) a virtualized listbox-like component should
 * reset to when its menu closes.
 */
export function resetVirtualScrollOnClose(): number;
