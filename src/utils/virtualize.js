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
