/**
 * Per-option heights indexed by item.
 * @typedef {ArrayLike<number | undefined>} ItemHeights
 */

/**
 * A supplied height counts as measured when it is a finite, non-negative
 * number. A hole in a sparse array, `undefined`, or a negative value means the
 * option has not been measured yet and falls back to the estimate. Zero is a
 * real height: an option can collapse to nothing.
 *
 * @param {unknown} height
 * @returns {height is number}
 */
function isMeasuredHeight(height) {
  return typeof height === "number" && height >= 0 && Number.isFinite(height);
}

/**
 * The mean of the measured entries in `heights`, or `null` when none of them
 * are measured.
 *
 * @param {ItemHeights | undefined} heights
 * @param {number} [count] How many entries to read, defaulting to all of them.
 * @returns {number | null}
 */
export function getMeasuredAverage(heights, count = heights?.length ?? 0) {
  let measuredCount = 0;
  let measuredTotal = 0;

  for (let index = 0; index < count; index++) {
    const height = heights?.[index];
    if (isMeasuredHeight(height)) {
      measuredCount += 1;
      measuredTotal += height;
    }
  }

  return measuredCount > 0 ? measuredTotal / measuredCount : null;
}

/**
 * The height to assume for an option that has not been measured: the running
 * average of the measured ones.
 *
 * @param {Object} options
 * @param {number} options.itemCount
 * @param {ItemHeights | undefined} options.heights
 * @param {number} options.itemHeight Seed estimate.
 * @returns {number}
 */
function getEstimatedHeight({ itemCount, heights, itemHeight }) {
  return getMeasuredAverage(heights, itemCount) ?? itemHeight;
}

/**
 * A seed estimate is usable when it is a positive, finite number. Zero and
 * below are refused: `virtualize` reads a non-positive `itemHeight` as
 * unwindowable and renders the list whole, which an average of nothing should
 * not cause.
 *
 * @param {unknown} estimate
 * @returns {estimate is number}
 */
function isUsableEstimate(estimate) {
  return (
    typeof estimate === "number" && estimate > 0 && Number.isFinite(estimate)
  );
}

/**
 * Accumulated positions for a list whose options each have their own height.
 * `offsets[i]` is the distance from the top of the list to the top of option
 * `i`, so `offsets[itemCount]` is the total scroll height.
 *
 * @param {Object} options
 * @param {number} options.itemCount
 * @param {ItemHeights | undefined} options.heights
 * @param {number} options.itemHeight Seed estimate for unmeasured options.
 * @returns {{ offsets: Float64Array, totalHeight: number }}
 */
function accumulateOffsets({ itemCount, heights, itemHeight }) {
  const estimate = getEstimatedHeight({ itemCount, heights, itemHeight });
  const offsets = new Float64Array(itemCount + 1);

  for (let index = 0; index < itemCount; index++) {
    const height = heights?.[index];
    offsets[index + 1] =
      offsets[index] + (isMeasuredHeight(height) ? height : estimate);
  }

  return { offsets, totalHeight: offsets[itemCount] };
}

/**
 * Narrow `[startIndex, endIndex)` to at most `maxItems` entries.
 *
 * @param {number} startIndex
 * @param {number} endIndex
 * @param {number} [maxItems]
 * @returns {number} The capped `endIndex`.
 */
function capToMaxItems(startIndex, endIndex, maxItems) {
  if (maxItems && endIndex - startIndex > maxItems) {
    return startIndex + maxItems;
  }

  return endIndex;
}

/**
 * Index of the first entry in `offsets[0..size)` greater than `target`, or
 * `size` when none is.
 *
 * @param {Float64Array} offsets
 * @param {number} size
 * @param {number} target
 * @returns {number}
 */
function upperBound(offsets, size, target) {
  let low = 0;
  let high = size;

  while (low < high) {
    const mid = (low + high) >> 1;
    if (offsets[mid] > target) high = mid;
    else low = mid + 1;
  }

  return low;
}

/**
 * Index of the first entry in `offsets[0..size)` at or above `target`, or
 * `size` when none is.
 *
 * @param {Float64Array} offsets
 * @param {number} size
 * @param {number} target
 * @returns {number}
 */
function lowerBound(offsets, size, target) {
  let low = 0;
  let high = size;

  while (low < high) {
    const mid = (low + high) >> 1;
    if (offsets[mid] >= target) high = mid;
    else low = mid + 1;
  }

  return low;
}

/**
 * `getVisibleRange` against already-accumulated positions, so a caller that
 * has built them once does not build them again.
 *
 * @param {Object} options
 * @param {ReturnType<typeof accumulateOffsets>} options.accumulated
 * @param {number} options.scrollTop
 * @param {number} options.containerHeight
 * @param {number} options.itemCount
 * @param {number} options.overscan
 * @param {number} [options.maxItems]
 * @returns {{ startIndex: number, endIndex: number }}
 */
function measuredVisibleRange({
  accumulated,
  scrollTop,
  containerHeight,
  itemCount,
  overscan,
  maxItems,
}) {
  // Heights that accumulate to nothing can't be windowed: every option shares
  // offset 0, so no search can separate them. Fall back to the full range, as
  // the fixed path does for a non-positive item height.
  if (!(accumulated.totalHeight > 0)) {
    return { startIndex: 0, endIndex: itemCount };
  }

  const { offsets } = accumulated;
  const size = itemCount + 1;
  const firstVisible =
    Math.min(itemCount, upperBound(offsets, size, scrollTop)) - 1;

  const startIndex = Math.max(0, firstVisible - overscan);
  const endIndex = Math.min(
    itemCount,
    lowerBound(offsets, size, scrollTop + containerHeight) + overscan,
  );

  return {
    startIndex,
    endIndex: capToMaxItems(startIndex, endIndex, maxItems),
  };
}

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
 * @param {ItemHeights} [options.heights] Per-option heights,
 * indexed by item. Supplying them resolves the range by searching accumulated
 * positions instead of dividing by `itemHeight`, which then serves only as the
 * estimate for options with no entry.
 * @returns {{ startIndex: number, endIndex: number }}
 */
export function getVisibleRange({
  scrollTop,
  itemHeight,
  containerHeight,
  itemCount,
  overscan = 3,
  maxItems = undefined,
  heights = undefined,
}) {
  if (heights) {
    return measuredVisibleRange({
      accumulated: accumulateOffsets({ itemCount, heights, itemHeight }),
      scrollTop,
      containerHeight,
      itemCount,
      overscan,
      maxItems,
    });
  }

  // A non-positive (or NaN) itemHeight can't be virtualized; the math below
  // divides by it and yields NaN indices, so fall back to the full range.
  if (!(itemHeight > 0)) {
    return { startIndex: 0, endIndex: itemCount };
  }

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    itemCount,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan,
  );

  return {
    startIndex,
    endIndex: capToMaxItems(startIndex, endIndex, maxItems),
  };
}

/**
 * Render only the visible slice of a list. Every option is `itemHeight` tall
 * unless `measured` is set, in which case offsets come from `heights`.
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
 * @param {boolean} [config.measured=false] Derive offsets from `heights`
 * instead of applying `itemHeight` to every option. Read only while the list
 * is windowed; below `threshold` the browser lays the options out itself.
 * The config-level opt-in. The standalone helpers here (`getVisibleRange`,
 * `getBoundedScrollTop`, `scrollSelectedIntoView`, `scrollHighlightedIntoView`)
 * take no config and go measured whenever `heights` is supplied, so a caller
 * that opts in must pass `heights` to all of them.
 * @param {ItemHeights} [config.heights] Per-option heights,
 * indexed by item. Options with no entry take an estimated height.
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
  measured = false,
  heights = undefined,
}) {
  // A non-positive itemHeight can't be virtualized (the math divides by it and
  // yields NaN indices), so render the full list unvirtualized. This holds
  // under `measured` too: `itemHeight` is only the estimate there, but with no
  // usable estimate and nothing measured yet there is no position to place an
  // option at.
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

  const accumulated = measured
    ? accumulateOffsets({ itemCount: items.length, heights, itemHeight })
    : null;
  const totalHeight = accumulated
    ? accumulated.totalHeight
    : items.length * itemHeight;

  // Clamp scrollTop to the scrollable range. A stale scrollTop (e.g. left over
  // from a longer list after the filter narrows it) would otherwise push
  // startIndex past the end and slice to an empty array, rendering a blank menu
  // until the browser fires a corrective scroll event.
  const maxScroll = Math.max(0, totalHeight - containerHeight);
  const clampedScrollTop = Math.min(Math.max(0, scrollTop), maxScroll);

  const { startIndex, endIndex } = accumulated
    ? measuredVisibleRange({
        accumulated,
        scrollTop: clampedScrollTop,
        containerHeight,
        itemCount: items.length,
        overscan,
        maxItems,
      })
    : getVisibleRange({
        scrollTop: clampedScrollTop,
        itemHeight,
        containerHeight,
        itemCount: items.length,
        overscan,
        maxItems,
      });

  const offsetY = accumulated
    ? accumulated.offsets[startIndex]
    : startIndex * itemHeight;

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
  measured: false,
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
 * @param {ItemHeights} [options.heights] Per-option heights,
 * indexed by item. Read only when the config opts into measuring and the list
 * is windowed.
 * @param {number} [options.estimate] Height to assume for options nothing has
 * measured yet, in place of the config's `itemHeight`. Read only when the
 * config opts into measuring, where `itemHeight` is only the seed. On the fixed
 * path `itemHeight` is the height of every option and nothing may displace it.
 * Supply the average of heights measured earlier.
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
  heights = undefined,
  estimate = undefined,
}) {
  const resolved = shouldVirtualize
    ? {
        ...DEFAULT_VIRTUAL_LIST_CONFIG,
        ...defaults,
        ...(typeof virtualizeProp === "object" ? virtualizeProp : {}),
      }
    : null;

  // Everything downstream reads the seeded config, callers included: an offset
  // placed against one seed and a scroll position computed against another
  // describe different lists.
  const config =
    resolved?.measured && isUsableEstimate(estimate)
      ? { ...resolved, itemHeight: estimate }
      : resolved;

  const data = config
    ? virtualize({ items, scrollTop, heights, ...config })
    : null;

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
 * @param {ItemHeights} [options.heights] Per-option heights,
 * indexed by item. Supplying them positions by accumulated height instead of
 * multiplying by `itemHeight`.
 * @returns {number}
 */
export function getBoundedScrollTop({
  index,
  itemHeight,
  containerHeight,
  itemCount,
  heights = undefined,
}) {
  if (heights) {
    const { offsets, totalHeight } = accumulateOffsets({
      itemCount,
      heights,
      itemHeight,
    });
    const maxScroll = Math.max(0, totalHeight - containerHeight);
    const position = offsets[Math.max(0, Math.min(index, itemCount))];
    return Math.max(0, Math.min(position, maxScroll));
  }

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
 * @param {ItemHeights} [options.heights] Per-option heights,
 * indexed by item.
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
  heights = undefined,
}) {
  const { startIndex: visibleStartIndex, endIndex: visibleEndIndex } =
    getVisibleRange({
      scrollTop: currentScrollTop,
      itemHeight,
      containerHeight,
      itemCount,
      overscan,
      maxItems,
      heights,
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
      heights,
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
 * @param {ItemHeights} [options.heights] Per-option heights,
 * indexed by item.
 * @returns {number}
 */
export function scrollSelectedIntoView({
  selectedIndex,
  itemCount,
  itemHeight,
  containerHeight,
  heights = undefined,
}) {
  if (selectedIndex < 0) return 0;

  return getBoundedScrollTop({
    index: selectedIndex,
    itemHeight,
    containerHeight,
    itemCount,
    heights,
  });
}

/**
 * The `scrollTop` delta that keeps the option at `index`, and everything below
 * it, where the reader last saw it once the options above it measure to heights
 * other than the ones assumed. Add the result to the current scroll position.
 *
 * Positive means the options above grew and the anchor moved down. Each height
 * set is read with its own estimate for anything unmeasured, so a sharper
 * estimate shifting unmeasured options is corrected too.
 *
 * @param {Object} options
 * @param {number} options.index Index anchoring the viewport. Options before
 * it are the ones whose height changes shift what is on screen.
 * @param {number} options.itemCount
 * @param {number} options.itemHeight Seed estimate for unmeasured options.
 * @param {ItemHeights | undefined} options.heights
 * Per-option heights as they are now.
 * @param {ItemHeights | undefined} options.previousHeights
 * Per-option heights the current scroll position was computed against.
 * @returns {number}
 */
function getScrollCorrection({
  index,
  itemCount,
  itemHeight,
  heights,
  previousHeights,
}) {
  const anchor = Math.max(0, Math.min(index, itemCount));
  if (anchor === 0) return 0;

  const after = accumulateOffsets({ itemCount, heights, itemHeight });
  const before = accumulateOffsets({
    itemCount,
    heights: previousHeights,
    itemHeight,
  });

  return after.offsets[anchor] - before.offsets[anchor];
}

/**
 * `getScrollCorrection` for a caller that knows its scroll position but not
 * which option to anchor on. The anchor is the topmost option on screen at
 * `scrollTop` under the heights that position was computed against: the one
 * the reader is looking at, and so the one that must not move.
 *
 * Every consumer of measured heights needs this pairing. Note that the
 * rendered window starts `overscan` options earlier than the viewport does, so
 * correcting against that index leaves the visible options shifting anyway.
 *
 * @param {Object} options
 * @param {number} options.scrollTop Position the correction is relative to.
 * @param {number} options.itemCount
 * @param {number} options.itemHeight Seed estimate for unmeasured options.
 * @param {number} options.containerHeight
 * @param {ItemHeights | undefined} options.heights Per-option heights as they
 * are now.
 * @param {ItemHeights | undefined} options.previousHeights Per-option heights
 * `scrollTop` was computed against.
 * @returns {number} The delta to add to `scrollTop`.
 */
export function getMeasuredScrollCorrection({
  scrollTop,
  itemCount,
  itemHeight,
  containerHeight,
  heights,
  previousHeights,
}) {
  const { startIndex } = getVisibleRange({
    scrollTop,
    itemHeight,
    containerHeight,
    itemCount,
    overscan: 0,
    heights: previousHeights,
  });

  return getScrollCorrection({
    index: startIndex,
    itemCount,
    itemHeight,
    heights,
    previousHeights,
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
