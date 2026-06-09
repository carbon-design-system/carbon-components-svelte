/**
 * Compute the `[startIndex, endIndex)` slice of items to render for a given
 * scroll position, including `overscan` padding and an optional `maxItems` cap.
 *
 * @param {Object} options
 * @param {number} options.scrollTop
 * @param {number} options.itemHeight
 * @param {number} options.containerHeight
 * @param {number} options.itemCount
 * @param {number} [options.overscan=3]
 * @param {number} [options.maxItems]
 * @returns {{ startIndex: number, endIndex: number }}
 */
export function getVisibleRange({
  scrollTop,
  itemHeight,
  containerHeight,
  itemCount,
  overscan = 3,
  maxItems = undefined,
}) {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  let endIndex = Math.min(
    itemCount,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan,
  );

  if (maxItems && endIndex - startIndex > maxItems) {
    endIndex = startIndex + maxItems;
  }

  return { startIndex, endIndex };
}

/**
 * Render only the visible slice of a fixed-height list.
 *
 * @template {Record<string, unknown>} Item
 * @param {Object} config
 * @param {Item[]} config.items
 * @param {number} config.itemHeight
 * @param {number} config.containerHeight
 * @param {number} config.scrollTop
 * @param {number} [config.overscan=3]
 * @param {number} [config.maxItems]
 * @param {number} [config.threshold=100]
 * @returns {{
 *   visibleItems: Item[],
 *   startIndex: number,
 *   endIndex: number,
 *   offsetY: number,
 *   totalHeight: number,
 *   isVirtualized: boolean
 * }}
 */
export function virtualize({
  items,
  itemHeight,
  containerHeight,
  scrollTop,
  overscan = 3,
  maxItems = undefined,
  threshold = 100,
}) {
  // A non-positive itemHeight can't be virtualized (the math divides by it and
  // yields NaN indices), so render the full list unvirtualized.
  if (items.length < threshold || itemHeight <= 0) {
    return {
      visibleItems: items,
      startIndex: 0,
      endIndex: items.length,
      offsetY: 0,
      totalHeight: itemHeight > 0 ? items.length * itemHeight : 0,
      isVirtualized: false,
    };
  }

  const totalHeight = items.length * itemHeight;

  // Clamp scrollTop to the scrollable range. A stale scrollTop (e.g. left over
  // from a longer list after the filter narrows it) would otherwise push
  // startIndex past the end and slice to an empty array, rendering a blank menu
  // until the browser fires a corrective scroll event.
  const maxScroll = Math.max(0, totalHeight - containerHeight);
  const clampedScrollTop = Math.min(Math.max(0, scrollTop), maxScroll);

  const { startIndex, endIndex } = getVisibleRange({
    scrollTop: clampedScrollTop,
    itemHeight,
    containerHeight,
    itemCount: items.length,
    overscan,
    maxItems,
  });

  const offsetY = startIndex * itemHeight;

  return {
    visibleItems: items.slice(startIndex, endIndex),
    startIndex,
    endIndex,
    offsetY,
    totalHeight,
    isVirtualized: true,
  };
}

/** Default virtualization config for listbox-like components. */
export const DEFAULT_VIRTUAL_LIST_CONFIG = {
  itemHeight: 40,
  containerHeight: 300,
  overscan: 3,
  threshold: 100,
  maxItems: undefined,
};

/**
 * Resolve config, virtualize result, and items to render for a listbox menu.
 * When disabled, `config` and `data` are `null` and `itemsToRender` is all `items`.
 *
 * @template {Record<string, unknown>} Item
 * @param {Object} options
 * @param {Item[]} options.items
 * @param {number} options.scrollTop
 * @param {boolean} options.shouldVirtualize
 * @param {boolean | object | undefined} options.virtualize
 * @param {Partial<typeof DEFAULT_VIRTUAL_LIST_CONFIG>} [options.defaults]
 * @returns {{
 *   config: (typeof DEFAULT_VIRTUAL_LIST_CONFIG & Record<string, unknown>) | null,
 *   data: ReturnType<typeof virtualize<Item>> | null,
 *   itemsToRender: Item[]
 * }}
 */
export function virtualListState({
  items,
  scrollTop,
  shouldVirtualize,
  virtualize: virtualizeProp,
  defaults = {},
}) {
  const config = shouldVirtualize
    ? {
        ...DEFAULT_VIRTUAL_LIST_CONFIG,
        ...defaults,
        ...(typeof virtualizeProp === "object" ? virtualizeProp : {}),
      }
    : null;

  const data = config ? virtualize({ items, scrollTop, ...config }) : null;

  const itemsToRender = data?.isVirtualized ? data.visibleItems : items;

  return { config, data, itemsToRender };
}

/**
 * `scrollTop` to place the item at `index` at the top of the viewport, clamped
 * to the scrollable range.
 *
 * @param {Object} options
 * @param {number} options.index
 * @param {number} options.itemHeight
 * @param {number} options.containerHeight
 * @param {number} options.itemCount
 * @returns {number}
 */
export function getBoundedScrollTop({
  index,
  itemHeight,
  containerHeight,
  itemCount,
}) {
  const maxScroll = Math.max(0, itemCount * itemHeight - containerHeight);
  return Math.max(0, Math.min(index * itemHeight, maxScroll));
}

/**
 * `scrollTop` to bring a keyboard-highlighted item into view, or `null` if it
 * is already within the visible range (including overscan).
 *
 * @param {Object} options
 * @param {number} options.highlightedIndex
 * @param {number} options.currentScrollTop
 * @param {number} options.itemCount
 * @param {number} options.itemHeight
 * @param {number} options.containerHeight
 * @param {number} [options.overscan=3]
 * @param {number} [options.maxItems]
 * @returns {number | null}
 */
export function scrollHighlightedIntoView({
  highlightedIndex,
  currentScrollTop,
  itemCount,
  itemHeight,
  containerHeight,
  overscan = 3,
  maxItems = undefined,
}) {
  const { startIndex: visibleStartIndex, endIndex: visibleEndIndex } =
    getVisibleRange({
      scrollTop: currentScrollTop,
      itemHeight,
      containerHeight,
      itemCount,
      overscan,
      maxItems,
    });

  if (
    highlightedIndex < visibleStartIndex ||
    highlightedIndex >= visibleEndIndex
  ) {
    return getBoundedScrollTop({
      index: highlightedIndex,
      itemHeight,
      containerHeight,
      itemCount,
    });
  }

  return null;
}

/**
 * `scrollTop` for the selected item on open, or `0` when `selectedIndex < 0`.
 *
 * @param {Object} options
 * @param {number} options.selectedIndex
 * @param {number} options.itemCount
 * @param {number} options.itemHeight
 * @param {number} options.containerHeight
 * @returns {number}
 */
export function scrollSelectedIntoView({
  selectedIndex,
  itemCount,
  itemHeight,
  containerHeight,
}) {
  if (selectedIndex < 0) return 0;

  return getBoundedScrollTop({
    index: selectedIndex,
    itemHeight,
    containerHeight,
    itemCount,
  });
}

/**
 * Scroll position to reset when a virtualized menu closes.
 *
 * @returns {number}
 */
export function resetVirtualScrollOnClose() {
  return 0;
}
