// @ts-check
// The pixel-and-array face of the virtualization engine, for callers that hold
// a list of items and a vertical scroll position and ask for one answer at a
// time: `DataTable`, `TreeView`, the listbox menus and `VirtualList`. The
// arithmetic is `virtualizer.js`; this file adapts it to item arrays, per-item
// height arrays and the names those callers use.
import { createFixedOffsets, createOffsets } from "./virtual-offsets.js";
import {
  capToMaxItems,
  getRange,
  getScrollLead,
  getScrollOffsetForIndex,
  getWindow,
} from "./virtualizer.js";

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
 * Positions for a list whose options each have their own height. An option
 * with no usable height takes the average of the ones that have, or the seed.
 *
 * @param {Object} options
 * @param {number} options.itemCount
 * @param {ItemHeights | undefined} options.heights
 * @param {number} options.itemHeight Seed estimate for unmeasured options.
 * @returns {import("./virtual-offsets.js").Offsets}
 */
function offsetsFor({ itemCount, heights, itemHeight }) {
  const estimate = getEstimatedHeight({ itemCount, heights, itemHeight });
  return createOffsets({ count: itemCount, estimate, sizes: heights });
}

/**
 * The range of a list with its own per-option heights. Heights that add up to
 * nothing can't be windowed: every option shares offset 0, so no search can
 * separate them. Those render whole, as the fixed path does for a non-positive
 * item height.
 *
 * @param {import("./virtual-offsets.js").Offsets} offsets
 * @param {number} itemCount
 * @param {number} scrollTop
 * @param {number} containerHeight
 * @param {number} overscan
 * @param {number} [maxItems]
 * @returns {{ startIndex: number, endIndex: number }}
 */
function measuredRange(
  offsets,
  itemCount,
  scrollTop,
  containerHeight,
  overscan,
  maxItems,
) {
  if (!(offsets.offsetOf(itemCount) > 0)) {
    return { startIndex: 0, endIndex: itemCount };
  }

  const { startIndex, endIndex } = getRange(
    offsets,
    itemCount,
    scrollTop,
    containerHeight,
    overscan,
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
    return measuredRange(
      offsetsFor({ itemCount, heights, itemHeight }),
      itemCount,
      scrollTop,
      containerHeight,
      overscan,
      maxItems,
    );
  }

  // A non-positive (or NaN) itemHeight can't be virtualized; the math below
  // divides by it and yields NaN indices, so fall back to the full range.
  if (!(itemHeight > 0)) {
    return { startIndex: 0, endIndex: itemCount };
  }

  const { startIndex, endIndex } = getRange(
    createFixedOffsets({ count: itemCount, size: itemHeight }),
    itemCount,
    scrollTop,
    containerHeight,
    overscan,
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
 * @param {Object} options
 * @param {Item[]} options.items
 * @param {number} options.itemHeight
 * @param {number} options.containerHeight
 * @param {number} options.scrollTop
 * @param {number} [options.overscan=3]
 * @param {number} [options.maxItems]
 * @param {number} [options.threshold=100]
 * @param {boolean} [options.measured=false] Derive offsets from `heights`
 * instead of applying `itemHeight` to every option. Read only while the list
 * is windowed; below `threshold` the browser lays the options out itself.
 * The options-level opt-in. The standalone helpers here (`getVisibleRange`,
 * `getBoundedScrollTop`, `scrollSelectedIntoView`, `scrollHighlightedIntoView`)
 * take no options and go measured whenever `heights` is supplied, so a caller
 * that opts in must pass `heights` to all of them.
 * @param {ItemHeights} [options.heights] Per-option heights,
 * indexed by item. Options with no entry take an estimated height.
 * @param {number} [options.scrollDelta=0] Signed distance the last scroll
 * moved. The window extends that far past the viewport in the direction of
 * travel, up to one `containerHeight`, so a fast scroll does not outrun it.
 * @param {number} [options.maxHeight] The tallest list to lay out, in pixels.
 * The list ends at the last item that fits: a browser lays out only so tall a
 * scroll area, and drops a taller one.
 * @returns {{
 *   visibleItems: Item[],
 *   startIndex: number,
 *   endIndex: number,
 *   offsetY: number,
 *   endOffsetY: number,
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
  scrollDelta = 0,
  maxHeight = undefined,
}) {
  // A non-positive itemHeight can't be virtualized (the math divides by it and
  // yields NaN indices), so render the full list unvirtualized. This holds
  // under `measured` too: `itemHeight` is only the estimate there, but with no
  // usable estimate and nothing measured yet there is no position to place an
  // option at.
  if (items.length < threshold || itemHeight <= 0) {
    const totalHeight = itemHeight > 0 ? items.length * itemHeight : 0;
    return {
      visibleItems: items,
      startIndex: 0,
      endIndex: items.length,
      offsetY: 0,
      endOffsetY: totalHeight,
      totalHeight,
      isVirtualized: false,
    };
  }

  const offsets = measured
    ? offsetsFor({ itemCount: items.length, heights, itemHeight })
    : createFixedOffsets({ count: items.length, size: itemHeight });
  // A browser lays out only so tall a scroll area, so the list can end early.
  const itemCount =
    maxHeight === undefined
      ? items.length
      : Math.min(items.length, offsets.countWithin(maxHeight));
  const totalHeight = offsets.offsetOf(itemCount);

  // Clamp scrollTop to the scrollable range. A stale scrollTop (e.g. left over
  // from a longer list after the filter narrows it) would otherwise push
  // startIndex past the end and slice to an empty array, rendering a blank menu
  // until the browser fires a corrective scroll event.
  const maxScroll = Math.max(0, totalHeight - containerHeight);
  const clampedScrollTop = Math.min(Math.max(0, scrollTop), maxScroll);

  // Heights that add up to nothing can't be windowed: every option shares
  // offset 0, so no search can separate them.
  const { startIndex, endIndex } =
    totalHeight > 0
      ? getWindow({
          offsets,
          count: itemCount,
          scrollOffset: clampedScrollTop,
          viewportSize: containerHeight,
          overscan,
          lead: getScrollLead(scrollDelta, containerHeight),
          maxItems,
        })
      : {
          startIndex: 0,
          endIndex: capToMaxItems(0, itemCount, maxItems),
        };

  return {
    visibleItems: items.slice(startIndex, endIndex),
    startIndex,
    endIndex,
    offsetY: offsets.offsetOf(startIndex),
    endOffsetY: offsets.offsetOf(endIndex),
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
  optimizeFastScroll: false,
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
 * @param {number} [options.scrollDelta] Signed distance the last scroll moved.
 * See `virtualize`.
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
  scrollDelta = 0,
}) {
  const config = resolveVirtualConfig({
    shouldVirtualize,
    virtualize: virtualizeProp,
    defaults,
    estimate,
  });

  const data = config
    ? virtualize({ items, scrollTop, scrollDelta, heights, ...config })
    : null;

  const itemsToRender = data?.isVirtualized ? data.visibleItems : items;

  return { config, data, itemsToRender };
}

/**
 * The windowing configuration for a listbox menu, or `null` when it is not
 * windowed. Resolved from the defaults, the component's own, and the
 * consumer's `virtualize` prop, in that order.
 *
 * @param {Object} options
 * @param {boolean} options.shouldVirtualize
 * @param {boolean | object | undefined} options.virtualize
 * @param {Partial<typeof DEFAULT_VIRTUAL_LIST_CONFIG>} [options.defaults]
 * @param {number} [options.estimate] Height to assume for options nothing has
 * measured yet, in place of the config's `itemHeight`. Read only when the
 * config opts into measuring, where `itemHeight` is only the seed. On the fixed
 * path `itemHeight` is the height of every option and nothing may displace it.
 * Supply the average of heights measured earlier.
 * @returns {(typeof DEFAULT_VIRTUAL_LIST_CONFIG & Record<string, unknown>) | null}
 */
export function resolveVirtualConfig({
  shouldVirtualize,
  virtualize: virtualizeProp,
  defaults = {},
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
  return resolved?.measured && isUsableEstimate(estimate)
    ? { ...resolved, itemHeight: estimate }
    : resolved;
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
  const offsets = heights
    ? offsetsFor({ itemCount, heights, itemHeight })
    : createFixedOffsets({ count: itemCount, size: itemHeight });
  const maxScroll = Math.max(0, offsets.offsetOf(itemCount) - containerHeight);
  return Math.max(0, Math.min(offsets.offsetOf(index), maxScroll));
}

/**
 * `scrollTop` to bring a keyboard-highlighted item fully into view at the
 * nearest edge, or `null` if it is already fully in view and rendered.
 *
 * Overscan rows are rendered but not visible, so they count as out of view.
 * Treating them as visible left an option the highlight cursor could not reach
 * stranded below the edge: one not rendered yet when the highlight moved,
 * because keys arrived faster than the window re-rendered.
 *
 * Under `maxItems`, an item can be in the viewport yet outside the capped
 * window. When scrolling to the nearest edge would leave it unrendered, the
 * item goes to the top instead, where the window starts.
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
  const offsets = heights
    ? offsetsFor({ itemCount, heights, itemHeight })
    : createFixedOffsets({ count: itemCount, size: itemHeight });

  return getScrollOffsetForIndex({
    offsets,
    count: itemCount,
    index: highlightedIndex,
    align: "nearest",
    scrollOffset: currentScrollTop,
    viewportSize: containerHeight,
    overscan,
    maxItems,
  });
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
 * The `scrollTop` delta that keeps the topmost option on screen where the
 * reader last saw it once the options above it measure to heights other than
 * the ones assumed. Add the result to the current scroll position.
 *
 * The anchor is the option at `scrollTop` under the heights that position was
 * computed against: the one the reader is looking at, and so the one that must
 * not move. Positive means the options above grew and the anchor moved down.
 * Each height set is read with its own estimate for anything unmeasured, so a
 * sharper estimate shifting unmeasured options is corrected too.
 *
 * Note that the rendered window starts `overscan` options earlier than the
 * viewport does, so correcting against that index would leave the visible
 * options shifting anyway.
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
  const before = offsetsFor({
    itemCount,
    heights: previousHeights,
    itemHeight,
  });
  // Heights that add up to nothing leave nothing to anchor on.
  if (!(before.offsetOf(itemCount) > 0)) return 0;

  const { startIndex } = getRange(
    before,
    itemCount,
    scrollTop,
    containerHeight,
    0,
  );
  const anchor = Math.max(0, Math.min(startIndex, itemCount));
  if (anchor === 0) return 0;

  const after = offsetsFor({ itemCount, heights, itemHeight });
  return after.offsetOf(anchor) - before.offsetOf(anchor);
}

/**
 * Scroll position to reset when a virtualized menu closes.
 *
 * @returns {number}
 */
export function resetVirtualScrollOnClose() {
  return 0;
}
