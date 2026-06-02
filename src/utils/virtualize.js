/**
 * Virtualizes a list to render only visible items for performance.
 *
 * @template {Record<string, unknown>} Item The type of items in the array (must be a Record)
 * @param {Object} config
 * @param {Item[]} config.items - Full array of items to virtualize
 * @param {number} config.itemHeight - Height of each item in pixels
 * @param {number} config.containerHeight - Visible container height in pixels
 * @param {number} config.scrollTop - Current scroll position
 * @param {number} [config.overscan=3] - Extra items to render above/below viewport
 * @param {number} [config.maxItems] - Cap maximum rendered items
 * @param {number} [config.threshold=100] - Minimum items before virtualization activates
 *
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
  // Auto-disable if below threshold
  if (items.length < threshold) {
    return {
      visibleItems: items,
      startIndex: 0,
      endIndex: items.length,
      offsetY: 0,
      totalHeight: items.length * itemHeight,
      isVirtualized: false,
    };
  }

  const totalHeight = items.length * itemHeight;

  // Calculate visible range.
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  let endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan,
  );

  // Apply maxItems cap if specified.
  if (maxItems && endIndex - startIndex > maxItems) {
    endIndex = startIndex + maxItems;
  }

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

/**
 * Default virtualization config shared by the listbox-like components
 * (`Dropdown`, `ComboBox`, `MultiSelect`).
 */
export const DEFAULT_VIRTUAL_LIST_CONFIG = {
  itemHeight: 40,
  containerHeight: 300,
  overscan: 3,
  threshold: 100,
  maxItems: undefined,
};

/**
 * Derive the virtualization state for a listbox-like menu in a single call:
 * the resolved config, the virtualize result, and the items to render.
 *
 * Builds on {@link virtualize}. When virtualization is disabled, `config` is
 * `null`, `data` is `null`, and `itemsToRender` is the full `items` array.
 *
 * @template {Record<string, unknown>} Item
 * @param {Object} options
 * @param {Item[]} options.items - Items to render (already filtered/sorted by the caller).
 * @param {number} options.scrollTop - Current scroll position.
 * @param {boolean} options.shouldVirtualize - Whether virtualization is active.
 * @param {boolean | object | undefined} options.virtualize - The component's `virtualize` prop; object values override the defaults.
 * @param {Partial<typeof DEFAULT_VIRTUAL_LIST_CONFIG>} [options.defaults] - Overrides for the shared defaults.
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
 * Compute the scroll position that brings the item at `index` to the top of a
 * virtualized list's viewport, clamped to the scrollable range.
 *
 * The position is `index * itemHeight`, bounded below by `0` and above by the
 * maximum scroll offset (`itemCount * itemHeight - containerHeight`, itself
 * floored at `0` when the content is shorter than the container).
 *
 * @param {Object} options
 * @param {number} options.index - Index of the item to scroll to the top.
 * @param {number} options.itemHeight - Height of each item in pixels.
 * @param {number} options.containerHeight - Visible container height in pixels.
 * @param {number} options.itemCount - Total number of items in the list.
 * @returns {number} The clamped `scrollTop` value.
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
 * Compute the scroll position needed to bring a keyboard-highlighted item into
 * the visible viewport of a virtualized list.
 *
 * Returns `null` when the highlighted item is already within the currently
 * visible range (including overscan), signalling that no scroll is needed.
 * Otherwise returns the clamped `scrollTop` that brings the item into view.
 *
 * @param {Object} options
 * @param {number} options.highlightedIndex - Index of the highlighted item.
 * @param {number} options.currentScrollTop - Current scroll position of the list.
 * @param {number} options.itemCount - Total number of items in the list.
 * @param {number} options.itemHeight - Height of each item in pixels.
 * @param {number} options.containerHeight - Visible container height in pixels.
 * @param {number} [options.overscan=3] - Extra items rendered above/below the viewport.
 * @returns {number | null} The `scrollTop` to apply, or `null` if already visible.
 */
export function scrollHighlightedIntoView({
  highlightedIndex,
  currentScrollTop,
  itemCount,
  itemHeight,
  containerHeight,
  overscan = 3,
}) {
  const visibleStartIndex = Math.max(
    0,
    Math.floor(currentScrollTop / itemHeight) - overscan,
  );
  const visibleEndIndex = Math.min(
    itemCount,
    Math.ceil((currentScrollTop + containerHeight) / itemHeight) + overscan,
  );

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
 * Compute the scroll position that brings the selected item to the top of a
 * virtualized list's viewport when the menu opens.
 *
 * Returns `0` when there is no selection (`selectedIndex < 0`), so the list
 * opens scrolled to the top. Otherwise returns the clamped `scrollTop` for the
 * selected item.
 *
 * @param {Object} options
 * @param {number} options.selectedIndex - Index of the selected item, or `-1` if none.
 * @param {number} options.itemCount - Total number of items in the list.
 * @param {number} options.itemHeight - Height of each item in pixels.
 * @param {number} options.containerHeight - Visible container height in pixels.
 * @returns {number} The `scrollTop` to apply.
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
 * Return the scroll position a virtualized listbox-like component should reset
 * to when its menu closes, so it reopens scrolled to the top.
 *
 * Callers assign the result to their tracked scroll state (and, where they
 * manage one, the list element's `scrollTop`).
 *
 * @returns {number} Always `0`.
 */
export function resetVirtualScrollOnClose() {
  return 0;
}
