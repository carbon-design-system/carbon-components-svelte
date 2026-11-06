// @ts-check
// One virtualization engine: headless, DOM-free, one axis.
//
// It answers three questions for a list too long to render whole:
//
//   1. Which items are in the window, and where does it start?
//   2. What does a scroll request have to write for an item to land where the
//      caller asked, given sizes that may still be estimates?
//   3. When something above the reader changes size or count, how far does the
//      scroll position move so that what they are reading stays put?
//
// It holds sizes (see `virtual-offsets.js`), the scroll position it was last
// told, and any request still waiting on measurements. It reads and writes no
// element: a binding passes `scrollTo` in and calls `setScroll`, `setViewport`
// and `measure` as the browser reports. `VirtualList`, the listbox menus,
// `DataTable` and `TreeView` all run on it.

import { createFixedOffsets, createOffsets } from "./virtual-offsets.js";

/**
 * @typedef {"start" | "center" | "end" | "nearest"} ScrollAlign
 */

/**
 * @typedef {Object} VirtualizerState
 * @property {boolean} isVirtualized Whether the list is windowed. Below
 * `threshold`, or with no usable size, every item renders.
 * @property {number} startIndex First rendered item.
 * @property {number} endIndex One past the last rendered item.
 * @property {number} startOffset Where `startIndex` starts, in pixels from the
 * start of the list.
 * @property {number} endOffset Where `endIndex` starts.
 * @property {number} totalSize Scroll size of the list, in pixels. Capped by
 * `maxSize`.
 * @property {number} count Items the scroll size holds: `count`, or fewer when
 * `maxSize` ends the list early.
 * @property {number} scrollOffset The scroll position the state was resolved
 * for.
 * @property {number} viewportSize
 * @property {boolean} atEnd Whether the end of the list is in view.
 * @property {boolean} following Whether the list holds the end in view as it
 * grows. Always `false` unless `follow` is `"end"`.
 * @property {number[]} kept Items from `keepMounted` that exist, ascending.
 * They render apart from the window, wherever the window is, so the element
 * of one that scrolls out of view is the element that was in view.
 * @property {number} stickyIndex The item from `stickyIndices` pinned to the
 * start of the viewport, or `-1`.
 */

/**
 * @typedef {Object} VirtualizerOptions
 * @property {number} [count=0] How many items the list holds.
 * @property {number | ((index: number) => number)} [size=0] The size of every
 * item, or a function from index to size for a list whose sizes are known up
 * front. With `measured`, a number is the estimate for items nothing has
 * measured yet.
 * @property {boolean} [measured=false] Take sizes from `measure` rather than
 * from `size`.
 * @property {number} [estimateSize] Overrides `size` as the seed estimate
 * while `measured`, so a caller can carry an average from an earlier list.
 * @property {number} [viewportSize=0] How much of the list is visible.
 * @property {number} [overscan=3] Items to render beyond the viewport on each
 * side.
 * @property {number} [lead=1] How far, as a multiple of the last scroll step,
 * to render ahead in the direction of travel, up to one viewport. The browser
 * paints a scroll before the window can follow, so a fast scroll outruns
 * `overscan`. `0` turns it off.
 * @property {number} [maxItems] Most items to render at once.
 * @property {number} [maxSize=Infinity] The tallest scroll area to lay out.
 * The list ends at the last item that fits, since a browser lays out only so
 * much (Firefox about 17.9 million pixels, Chromium and Safari 33.5).
 * @property {number} [threshold=0] Fewest items before windowing starts.
 * @property {number} [initialOffset=0] Scroll position to resolve the first
 * window for, so server output already shows where the reader will be.
 * @property {false | "end"} [follow=false] `"end"` keeps the end in view as
 * items arrive or resize, until the reader scrolls away from it.
 * @property {ReadonlyArray<number>} [keepMounted] Items that must stay
 * rendered wherever they are, such as the one that holds focus.
 * @property {ReadonlyArray<number>} [stickyIndices] Ascending items that pin
 * to the start of the viewport once scrolled past, such as section headers.
 * @property {(offset: number) => number | void} [scrollTo] Writes a scroll
 * position, and returns the one the scroller took, which may be clamped.
 */

/**
 * @typedef {VirtualizerOptions & {
 *   count: number,
 *   viewportSize: number,
 *   overscan: number,
 *   lead: number,
 *   maxSize: number,
 *   threshold: number,
 *   follow: false | "end",
 *   measured: boolean,
 * }} ResolvedOptions
 */

/**
 * What an option falls back to when it is left out, or given as `undefined`.
 * @type {Pick<ResolvedOptions, "count" | "size" | "measured" | "viewportSize" | "overscan" | "lead" | "maxSize" | "threshold" | "follow">}
 */
const DEFAULTS = {
  count: 0,
  size: 0,
  measured: false,
  viewportSize: 0,
  overscan: 3,
  lead: 1,
  maxSize: Number.POSITIVE_INFINITY,
  threshold: 0,
  follow: false,
};

/**
 * @param {ResolvedOptions | {}} base
 * @param {VirtualizerOptions} next
 * @returns {ResolvedOptions}
 */
function resolveOptions(base, next) {
  const merged = { ...DEFAULTS, ...base, ...next };
  for (const key of /** @type {Array<keyof typeof DEFAULTS>} */ (
    Object.keys(DEFAULTS)
  )) {
    if (merged[key] === undefined) {
      /** @type {any} */ (merged)[key] = DEFAULTS[key];
    }
  }
  return /** @type {ResolvedOptions} */ (merged);
}

const SCROLL_TOLERANCE = 1;

/** @type {ReadonlyArray<number>} */
const NONE = Object.freeze([]);

/**
 * Narrow `[startIndex, endIndex)` to at most `maxItems` entries.
 *
 * @param {number} startIndex
 * @param {number} endIndex
 * @param {number} [maxItems]
 * @returns {number} The capped `endIndex`.
 */
export function capToMaxItems(startIndex, endIndex, maxItems) {
  if (maxItems && endIndex - startIndex > maxItems) {
    return startIndex + maxItems;
  }

  return endIndex;
}

/**
 * How far past the viewport to render in the direction of travel. The browser
 * scrolls on the compositor and can paint a new position before the window
 * has moved to it, so a fast scroll outruns `overscan` and shows blank space.
 * The next scroll is likely to move about as far as the last one did, so render
 * that far ahead, up to one viewport.
 *
 * @param {number} scrollDelta Signed distance the last scroll moved.
 * @param {number} viewportSize
 * @returns {number} Signed: negative extends the window toward the start.
 */
export function getScrollLead(scrollDelta, viewportSize) {
  if (!Number.isFinite(scrollDelta) || !(viewportSize > 0)) return 0;
  return Math.max(-viewportSize, Math.min(scrollDelta, viewportSize));
}

/**
 * The `[startIndex, endIndex)` slice of the first `count` items that
 * intersects `[top, top + size)`, padded by `overscan` items each side.
 *
 * @param {import("./virtual-offsets.js").Offsets} offsets
 * @param {number} count
 * @param {number} top
 * @param {number} size
 * @param {number} overscan
 * @returns {{ startIndex: number, endIndex: number }}
 */
export function getRange(offsets, count, top, size, overscan) {
  if (count <= 0) return { startIndex: 0, endIndex: 0 };

  const first = top < 0 ? -1 : Math.min(offsets.indexAt(top), count - 1);
  return {
    startIndex: Math.max(0, first - overscan),
    endIndex: Math.min(count, offsets.lowerBound(top + size) + overscan),
  };
}

/**
 * `getRange` with the viewport extended by `lead` in the direction of travel.
 * `maxItems` trims the lead before the viewport, so a capped list renders what
 * is on screen first.
 *
 * @param {Object} options
 * @param {import("./virtual-offsets.js").Offsets} options.offsets
 * @param {number} options.count
 * @param {number} options.scrollOffset
 * @param {number} options.viewportSize
 * @param {number} options.overscan
 * @param {number} options.lead From `getScrollLead`.
 * @param {number} [options.maxItems]
 * @returns {{ startIndex: number, endIndex: number }}
 */
export function getWindow({
  offsets,
  count,
  scrollOffset,
  viewportSize,
  overscan,
  lead,
  maxItems,
}) {
  /**
   * @param {number} top
   * @param {number} size
   */
  const range = (top, size) => getRange(offsets, count, top, size, overscan);

  const extended = range(
    scrollOffset + Math.min(0, lead),
    viewportSize + Math.abs(lead),
  );

  if (lead >= 0) {
    return {
      startIndex: extended.startIndex,
      endIndex: capToMaxItems(extended.startIndex, extended.endIndex, maxItems),
    };
  }

  if (!maxItems) return extended;

  // Cap the viewport as if there were no lead, then spend what is left of
  // `maxItems` on the lead before it.
  const base = range(scrollOffset, viewportSize);
  const endIndex = capToMaxItems(base.startIndex, base.endIndex, maxItems);
  return {
    startIndex: Math.max(extended.startIndex, endIndex - maxItems),
    endIndex,
  };
}

/**
 * Where to scroll so that the item at `index` sits as `align` asks, clamped to
 * the scrollable range.
 *
 * `"nearest"` reaches the nearest edge only as far as the item needs, and
 * returns `null` when it is already fully in view and rendered. Overscan items
 * are rendered but not visible, so they count as out of view: treating them as
 * visible left an item the highlight could not reach stranded past the edge
 * when keys outran the window. Under `maxItems`, an item can be in the
 * viewport yet outside the capped window. When the nearest edge would leave it
 * unrendered, it goes to the start instead, where the window starts.
 *
 * @param {Object} options
 * @param {import("./virtual-offsets.js").Offsets} options.offsets
 * @param {number} options.count Items the list holds, after any `maxSize`.
 * @param {number} options.index
 * @param {ScrollAlign} options.align
 * @param {number} options.scrollOffset
 * @param {number} options.viewportSize
 * @param {number} [options.overscan=3]
 * @param {number} [options.maxItems]
 * @returns {number | null}
 */
export function getScrollOffsetForIndex({
  offsets,
  count,
  index: requested,
  align,
  scrollOffset,
  viewportSize,
  overscan = 3,
  maxItems = undefined,
}) {
  if (count <= 0) return null;

  const index = Math.max(0, Math.min(Math.floor(requested), count - 1));
  const start = offsets.offsetOf(index);
  const end = offsets.offsetOf(index + 1);
  const maxScroll = Math.max(0, offsets.offsetOf(count) - viewportSize);

  /** @param {number} offset */
  const bound = (offset) => Math.max(0, Math.min(offset, maxScroll));

  if (align === "start") return bound(start);
  if (align === "end") return bound(end - viewportSize);
  if (align === "center") {
    return bound(start + (end - start) / 2 - viewportSize / 2);
  }

  let next = scrollOffset;
  if (start < scrollOffset) {
    next = start;
  } else if (end > scrollOffset + viewportSize) {
    next = end - viewportSize;
  }
  next = bound(next);

  const { startIndex, endIndex } = getWindow({
    offsets,
    count,
    scrollOffset: next,
    viewportSize,
    overscan,
    lead: 0,
    maxItems,
  });
  if (index < startIndex || index >= endIndex) next = bound(start);

  return next === scrollOffset ? null : next;
}

/**
 * How many items were added at the front of a list: `next` is `previous` with
 * items put before it. Checks the length difference, the first and last items
 * and a sample from the middle, so it costs the same for a list of a million.
 * Items match by `getKey`, or by identity.
 *
 * @template T
 * @param {ReadonlyArray<T>} previous
 * @param {ReadonlyArray<T>} next
 * @param {(item: T) => unknown} [getKey]
 * @returns {number} `0` when `next` is not `previous` with items prepended.
 */
export function getPrependedCount(previous, next, getKey) {
  const added = next.length - previous.length;
  if (added <= 0 || previous.length === 0) return 0;

  /**
   * @param {T} a
   * @param {T} b
   */
  const same = (a, b) => (getKey ? getKey(a) === getKey(b) : a === b);
  const last = previous.length - 1;
  const middle = last >> 1;

  return same(previous[0], next[added]) &&
    same(previous[last], next[added + last]) &&
    same(previous[middle], next[added + middle])
    ? added
    : 0;
}

/**
 * How many items were dropped from the front of a list, as a log does that
 * keeps its last lines: `next` is `previous` without its first items, and it
 * may have items added at the end. Looks for where the first item of `next` was
 * among the first `limit` of `previous`, then checks the last and a middle item
 * of what they share, so it costs the same for a list of a million. Items match
 * by `getKey`, or by identity.
 *
 * @template T
 * @param {ReadonlyArray<T>} previous
 * @param {ReadonlyArray<T>} next
 * @param {(item: T) => unknown} [getKey]
 * @param {number} [limit=1000] The most items looked for at the front.
 * @returns {number} `0` when `next` does not start where `previous` did, or
 * does not start with items `previous` held.
 */
export function getDroppedCount(previous, next, getKey, limit = 1000) {
  if (previous.length === 0 || next.length === 0) return 0;

  /**
   * @param {T} a
   * @param {T} b
   */
  const same = (a, b) => (getKey ? getKey(a) === getKey(b) : a === b);
  if (same(previous[0], next[0])) return 0;

  const furthest = Math.min(previous.length - 1, limit);
  for (let dropped = 1; dropped <= furthest; dropped++) {
    if (!same(previous[dropped], next[0])) continue;

    const shared = Math.min(previous.length - dropped, next.length);
    const middle = shared >> 1;
    if (
      same(previous[dropped + shared - 1], next[shared - 1]) &&
      same(previous[dropped + middle], next[middle])
    ) {
      return dropped;
    }
  }

  return 0;
}

/**
 * Find the position of `target` in an ascending `list`: how many entries are
 * at or below it.
 *
 * @param {ReadonlyArray<number>} list
 * @param {(entry: number) => boolean} atOrBelow
 * @returns {number}
 */
function countWhile(list, atOrBelow) {
  let low = 0;
  let high = list.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (atOrBelow(list[mid])) low = mid + 1;
    else high = mid;
  }
  return low;
}

/**
 * @param {ReadonlyArray<number> | undefined} a
 * @param {ReadonlyArray<number> | undefined} b
 */
function sameList(a, b) {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Create a virtualizer for one axis.
 *
 * It implements the Svelte store contract, so `$virtualizer` is the state
 * under Svelte 3, 4 and 5.
 *
 * @param {VirtualizerOptions} [initial]
 */
export function createVirtualizer(initial = {}) {
  /** @type {ResolvedOptions} */
  let options = resolveOptions({}, initial);

  /** @type {import("./virtual-offsets.js").Offsets} */
  let offsets = createFixedOffsets();
  /** The `size` and `measured` the index above was built for. */
  /** @type {unknown} */
  let builtFor;
  let builtMeasured = false;
  let scrollOffset = Math.max(0, initial.initialOffset ?? 0);
  /** How far, and which way, the reader last scrolled. */
  let scrollDelta = 0;
  /**
   * The position this last wrote, or read from a scroller it left where it
   * was. A position that differs from it is the reader's.
   */
  let lastWritten = Number.NEGATIVE_INFINITY;
  let following = options.follow === "end";
  /**
   * A scroll request still waiting on measurements.
   * @type {null | { index: number, align: ScrollAlign, target: number }}
   */
  let pending = null;
  /** Set while `measure` or `prepend` runs, so writes do not re-enter. */
  let busy = false;

  /** @type {Set<(state: VirtualizerState) => void>} */
  const listeners = new Set();
  /** @type {VirtualizerState} */
  let state = /** @type {any} */ (null);
  /**
   * What subscribers were last told. `state` runs ahead of it while a change
   * is still being worked out.
   * @type {VirtualizerState | null}
   */
  let published = null;

  /** @returns {number} */
  function getSeed() {
    const seed = options.estimateSize ?? options.size;
    return typeof seed === "number" ? seed : 0;
  }

  /** Rebuild the sizes index when `size` or `measured` changed. */
  function buildOffsets() {
    const { size, measured, count } = options;
    const key = measured ? "measured" : size;
    if (key === builtFor && measured === builtMeasured && offsets) {
      offsets.setCount(count);
      if (measured) refreshEstimate();
      else if (typeof size === "number") offsets.setEstimate(size);
      return;
    }

    builtFor = key;
    builtMeasured = measured;

    if (measured) {
      offsets = createOffsets({ count, estimate: getSeed() });
    } else if (typeof size === "function") {
      offsets = createOffsets({ count, estimate: 0 });
      for (let index = 0; index < count; index++) {
        offsets.set(index, size(index));
      }
    } else {
      offsets = createFixedOffsets({ count, size });
    }
  }

  /**
   * An unmeasured item takes the average of the measured ones, or the seed
   * before any is.
   */
  function refreshEstimate() {
    offsets.setEstimate(offsets.getMeasuredAverage() ?? getSeed());
  }

  /** @returns {VirtualizerState} */
  function compute() {
    const { viewportSize, overscan, maxItems, threshold, maxSize } = options;
    const held = offsets.count();
    const count =
      maxSize === Number.POSITIVE_INFINITY
        ? held
        : Math.min(held, offsets.countWithin(maxSize));
    const totalSize = offsets.offsetOf(count);
    const maxScroll = Math.max(0, totalSize - viewportSize);
    const clamped = Math.min(Math.max(0, scrollOffset), maxScroll);
    const atEnd = clamped >= maxScroll - SCROLL_TOLERANCE;

    // Items with no usable size cannot be windowed: the math divides by it, so
    // render the list whole. Known sizes, from a function, have no seed to
    // refuse.
    const seed = getSeed();
    const seedless =
      typeof options.size === "function" && !options.measured
        ? false
        : !(seed > 0);

    if (held < threshold || seedless) {
      const flatSize =
        typeof options.size === "function" && !options.measured
          ? offsets.offsetOf(held)
          : seed > 0
            ? held * seed
            : 0;
      return {
        isVirtualized: false,
        startIndex: 0,
        endIndex: held,
        startOffset: 0,
        endOffset: flatSize,
        totalSize: flatSize,
        count: held,
        scrollOffset,
        viewportSize,
        atEnd,
        following,
        kept: /** @type {number[]} */ (NONE),
        stickyIndex: -1,
      };
    }

    // Sizes that add up to nothing leave every item at offset 0, which no
    // search can separate. Render them all.
    const { startIndex, endIndex } =
      totalSize > 0
        ? getWindow({
            offsets,
            count,
            scrollOffset: clamped,
            viewportSize,
            overscan,
            lead: getScrollLead(scrollDelta * options.lead, viewportSize),
            maxItems,
          })
        : { startIndex: 0, endIndex: count };

    const kept = options.keepMounted?.length
      ? [...new Set(options.keepMounted)]
          .filter(
            (index) => Number.isInteger(index) && index >= 0 && index < count,
          )
          .sort((a, b) => a - b)
      : /** @type {number[]} */ (NONE);

    const sticky = options.stickyIndices;
    let stickyIndex = -1;
    if (sticky?.length && count > 0) {
      const at = countWhile(
        sticky,
        (index) => index < count && offsets.offsetOf(index) <= clamped,
      );
      stickyIndex = at > 0 ? sticky[at - 1] : -1;
    }

    return {
      isVirtualized: true,
      startIndex,
      endIndex,
      startOffset: offsets.offsetOf(startIndex),
      endOffset: offsets.offsetOf(endIndex),
      totalSize,
      count,
      scrollOffset,
      viewportSize,
      atEnd,
      following,
      kept,
      stickyIndex,
    };
  }

  /**
   * @param {VirtualizerState} a
   * @param {VirtualizerState} b
   */
  function sameState(a, b) {
    return (
      a.isVirtualized === b.isVirtualized &&
      a.startIndex === b.startIndex &&
      a.endIndex === b.endIndex &&
      a.startOffset === b.startOffset &&
      a.endOffset === b.endOffset &&
      a.totalSize === b.totalSize &&
      a.count === b.count &&
      a.viewportSize === b.viewportSize &&
      a.atEnd === b.atEnd &&
      a.following === b.following &&
      a.stickyIndex === b.stickyIndex &&
      sameList(a.kept, b.kept)
    );
  }

  /**
   * Resolve the state again and tell subscribers if the window moved.
   * @returns {VirtualizerState}
   */
  function refresh() {
    const next = compute();
    const changed = !published || !sameState(published, next);
    state = next;
    if (changed) {
      published = next;
      for (const listener of [...listeners]) listener(next);
    }
    return state;
  }

  /** @returns {number} The furthest the list scrolls. */
  function getMaxScroll() {
    return Math.max(0, state.totalSize - options.viewportSize);
  }

  /**
   * Write a scroll position and take back what the scroller took.
   * @param {number} next
   */
  function write(next) {
    const target = Math.max(0, next);
    const taken = options.scrollTo?.(target);
    const actual = typeof taken === "number" ? taken : target;
    lastWritten = actual;
    // A position written here is not the reader moving, so it sets no lead. The
    // lead the reader's last scroll set stays: a correction is not a reason to
    // stop rendering ahead of where they are heading.
    scrollOffset = actual;
  }

  /**
   * The position of the item pending requests ask for.
   * @param {number} index
   * @param {ScrollAlign} align
   * @returns {number | null}
   */
  function targetFor(index, align) {
    return getScrollOffsetForIndex({
      offsets,
      count: state.count,
      index,
      align,
      scrollOffset,
      viewportSize: options.viewportSize,
      overscan: options.overscan,
      maxItems: options.maxItems,
    });
  }

  /**
   * Re-satisfy an outstanding request. Measurement arrives in batches and each
   * can move the item out from under the last answer.
   */
  function settle() {
    if (!pending) return;
    const next = targetFor(pending.index, pending.align);
    // A request that has not moved since it was last placed has nothing new to
    // ask. Placing it again would ask for a position the scroller already
    // refused: it clamps to what it has laid out, which a list of estimated
    // heights can fall short of.
    if (next === null || Math.abs(next - pending.target) <= SCROLL_TOLERANCE) {
      return;
    }

    pending.target = next;
    if (Math.abs(next - scrollOffset) > SCROLL_TOLERANCE) {
      state = compute();
      write(next);
    }
  }

  /**
   * Re-resolve after sizes or count moved, holding the reader's place: the
   * item at the top of the viewport stays where it was seen.
   *
   * @param {number} anchorIndex Item anchoring the viewport, in the list as it
   * is now.
   * @param {number} anchorOffsetBefore Where it sat before the change.
   */
  function holdPlace(anchorIndex, anchorOffsetBefore) {
    state = compute();
    if (following) {
      write(getMaxScroll());
    } else if (state.isVirtualized) {
      const moved = offsets.offsetOf(anchorIndex) - anchorOffsetBefore;
      if (moved !== 0) write(scrollOffset + moved);
    }
    settle();
  }

  /**
   * Record measured sizes. The reader's place holds: when items above the
   * viewport turn out taller or shorter than assumed, the scroll position moves
   * by the difference.
   *
   * @param {Iterable<readonly [number, number]>} entries Index and size pairs.
   * @returns {boolean} Whether any size changed.
   */
  function measure(entries) {
    if (!options.measured || busy) return false;
    busy = true;
    try {
      const wasVirtualized = state.isVirtualized;
      const anchor = offsets.indexAt(scrollOffset);
      const before = offsets.offsetOf(anchor);

      let changed = false;
      for (const [index, size] of entries) {
        if (offsets.set(index, size)) changed = true;
      }
      if (!changed) return false;

      refreshEstimate();
      if (wasVirtualized) holdPlace(anchor, before);
      refresh();
      return true;
    } finally {
      busy = false;
    }
  }

  /**
   * Forget every measured size, as when the list is replaced.
   */
  function resetMeasurements() {
    offsets.clear();
    pending = null;
    refreshEstimate();
    refresh();
  }

  /**
   * Add `added` items at the front. The reader's place holds: the scroll
   * position moves by the size of what was added, so the item in view stays in
   * view. Sizes already measured move with their items.
   *
   * @param {number} added
   * @param {Object} [config]
   * @param {boolean} [config.anchor] Whether to move the scroll position.
   * By default it moves once the reader has scrolled, and stays at the top
   * otherwise, as the browser's scroll anchoring does, so new items at the
   * top come into view. Pass `true` to hold the place at the top too, as when
   * loading older messages. Pass `false` to never move it.
   */
  function prepend(added, { anchor = scrollOffset > 0 } = {}) {
    const amount = Math.trunc(added);
    if (!(amount > 0)) return;

    busy = true;
    try {
      const index = offsets.indexAt(scrollOffset);
      const before = offsets.offsetOf(index);
      const within = scrollOffset - before;
      const wasVirtualized = state.isVirtualized;

      offsets.shift(amount);
      options = resolveOptions(options, { count: options.count + amount });
      if (options.measured) refreshEstimate();
      else if (typeof options.size === "function") {
        // Known sizes are positional: ask again, as the new items need theirs.
        builtFor = undefined;
        buildOffsets();
      }

      state = compute();
      if (following) {
        write(getMaxScroll());
      } else if (anchor && wasVirtualized) {
        write(offsets.offsetOf(index + amount) + within);
      }
      settle();
      refresh();
    } finally {
      busy = false;
    }
  }

  /**
   * Drop `removed` items from the front, as a log does that keeps its last
   * lines. The reader's place holds.
   *
   * @param {number} removed
   */
  function dropFront(removed) {
    const amount = Math.min(Math.trunc(removed), options.count);
    if (!(amount > 0)) return;

    busy = true;
    try {
      const index = offsets.indexAt(scrollOffset);
      const within = scrollOffset - offsets.offsetOf(index);
      const wasVirtualized = state.isVirtualized;

      offsets.shift(-amount);
      options = resolveOptions(options, { count: options.count - amount });
      if (options.measured) refreshEstimate();

      state = compute();
      if (following) {
        write(getMaxScroll());
      } else if (wasVirtualized) {
        // An item that was dropped leaves the first survivor at the start.
        const survivor = Math.max(0, index - amount);
        write(index >= amount ? offsets.offsetOf(survivor) + within : 0);
      }
      refresh();
    } finally {
      busy = false;
    }
  }

  /**
   * Take new options. Cheap when nothing changed, so a component can call it
   * from a reactive statement.
   *
   * @param {Partial<VirtualizerOptions>} next
   * @returns {VirtualizerState}
   */
  function setOptions(next) {
    const previous = options;
    options = resolveOptions(options, next);

    const sizesChanged =
      options.size !== previous.size ||
      options.measured !== previous.measured ||
      options.estimateSize !== previous.estimateSize;
    const countChanged = options.count !== previous.count;

    if (sizesChanged || countChanged) {
      if (typeof options.size === "function" && countChanged) {
        builtFor = undefined;
      }
      buildOffsets();
    }

    if (options.follow !== previous.follow) {
      following = options.follow === "end";
    }

    state = compute();

    // Hold the end when the list grows, or the viewport changes, under a reader
    // who is at it.
    if (following && !busy) {
      const end = getMaxScroll();
      if (Math.abs(end - scrollOffset) > SCROLL_TOLERANCE) write(end);
    }

    settle();
    return refresh();
  }

  /**
   * The scroller reports its position.
   *
   * @param {number} offset
   * @returns {VirtualizerState}
   */
  function setScroll(offset) {
    if (offset === scrollOffset) return state;

    scrollDelta = offset - scrollOffset;
    scrollOffset = offset;

    // A position other than the one last written is the reader's, and the
    // reader's intent is more recent than a request still waiting.
    if (Math.abs(offset - lastWritten) > SCROLL_TOLERANCE) {
      pending = null;
      if (options.follow === "end") {
        const maxScroll = Math.max(
          0,
          offsets.offsetOf(state.count) - options.viewportSize,
        );
        following = offset >= maxScroll - SCROLL_TOLERANCE;
      }
    }

    return refresh();
  }

  /**
   * @param {number} size How much of the list is visible.
   * @returns {VirtualizerState}
   */
  function setViewport(size) {
    if (size === options.viewportSize) return state;
    return setOptions({ viewportSize: size });
  }

  /**
   * Scroll so that item `index` sits as `align` asks. With measured sizes the
   * request stays open, and is satisfied again as sizes arrive, until the
   * reader scrolls.
   *
   * @param {number} index
   * @param {Object} [config]
   * @param {ScrollAlign} [config.align="start"]
   * @returns {number | null} The position written, or `null` when the item
   * is already where `align` asks.
   */
  function scrollToIndex(index, { align = "start" } = {}) {
    state = compute();
    if (index < 0) {
      pending = null;
      write(0);
      refresh();
      return 0;
    }

    const next = targetFor(index, align);
    pending =
      options.measured && state.isVirtualized
        ? { index, align, target: next ?? scrollOffset }
        : null;

    if (next === null) {
      lastWritten = scrollOffset;
      return null;
    }

    write(next);
    // Landing on the end is following it.
    if (options.follow === "end") {
      following = next >= getMaxScroll() - SCROLL_TOLERANCE;
    }
    refresh();
    return next;
  }

  /**
   * The reader has taken hold of the scroller, such as with the wheel, a touch
   * or a key. Input arrives before the scroll it causes does, and a scroller
   * can take a write before it has taken the reader's scroll, so a list that
   * follows its end lets go here rather than wait to be told where it went.
   * Scrolling back to the end follows it again.
   */
  function release() {
    pending = null;
    if (!following) return;
    following = false;
    refresh();
  }

  /**
   * Scroll to the end, and hold it there when `follow` is `"end"`.
   * @returns {number | null}
   */
  function scrollToEnd() {
    state = compute();
    pending = null;
    const next = getMaxScroll();
    if (options.follow === "end") following = true;
    if (Math.abs(next - scrollOffset) <= SCROLL_TOLERANCE) {
      refresh();
      return null;
    }
    write(next);
    refresh();
    return next;
  }

  /**
   * @param {(state: VirtualizerState) => void} listener
   * @returns {() => void}
   */
  function subscribe(listener) {
    listeners.add(listener);
    listener(published ?? state);
    return () => {
      listeners.delete(listener);
    };
  }

  buildOffsets();
  state = compute();
  published = state;
  if (following) {
    // Start at the end: the first window is the one the reader sees.
    scrollOffset = Math.max(scrollOffset, getMaxScroll());
    state = compute();
    published = state;
  }

  return {
    subscribe,
    getState: () => state,
    setOptions,
    setScroll,
    setViewport,
    measure,
    resetMeasurements,
    prepend,
    dropFront,
    scrollToIndex,
    scrollToEnd,
    release,
    /** Where item `index` starts, in pixels from the start of the list. */
    offsetOf: (/** @type {number} */ index) => offsets.offsetOf(index),
    /** The size layout gives item `index`: measured, else the estimate. */
    sizeOf: (/** @type {number} */ index) => offsets.sizeOf(index),
    /** The item that contains `offset`. */
    indexAt: (/** @type {number} */ offset) => offsets.indexAt(offset),
    /** The scroll position last told or written. */
    getScrollOffset: () => scrollOffset,
    /** The mean measured size, or `null` before any. */
    getMeasuredAverage: () => offsets.getMeasuredAverage(),
    /** The measured size of item `index`, if there is one. */
    getMeasuredSize: (/** @type {number} */ index) => offsets.get(index),
    /** Drop an outstanding scroll request without moving. */
    cancelScroll: () => {
      pending = null;
    },
    /** Whether a scroll request is waiting on measurements. */
    hasPendingScroll: () => pending !== null,
    /** The scroll request waiting on measurements, if there is one. */
    getPendingScroll: () => pending,
    /**
     * Tell the engine where the scroller sits, without reading a move into it:
     * the position is already where the reader or a write put it, so it sets no
     * lead of its own. The lead the reader's last scroll set stays.
     */
    syncScroll: (/** @type {number} */ offset) => {
      lastWritten = offset;
      scrollOffset = offset;
      return refresh();
    },
    /** Forget which way the reader was scrolling, so nothing renders ahead. */
    clearLead: () => {
      scrollDelta = 0;
      return refresh();
    },
  };
}

/**
 * @typedef {Object} GridVirtualizerState
 * @property {VirtualizerState} rows
 * @property {VirtualizerState} columns
 */

/**
 * Two virtualizers, one per axis, for a grid or a matrix: the cells to render
 * are rows `rows.startIndex` to `rows.endIndex` by columns `columns.startIndex`
 * to `columns.endIndex`. Each axis keeps its own lead, so a diagonal scroll
 * renders ahead on both, and its own `keepMounted`, so the active cell stays
 * mounted by keeping its row and its column.
 *
 * It implements the Svelte store contract, as `createVirtualizer` does.
 *
 * @param {Object} options
 * @param {VirtualizerOptions} options.rows
 * @param {VirtualizerOptions} options.columns
 */
export function createGridVirtualizer({ rows, columns }) {
  const rowVirtualizer = createVirtualizer(rows);
  const columnVirtualizer = createVirtualizer(columns);

  /** @returns {GridVirtualizerState} */
  const getState = () => ({
    rows: rowVirtualizer.getState(),
    columns: columnVirtualizer.getState(),
  });

  return {
    rows: rowVirtualizer,
    columns: columnVirtualizer,
    getState,
    /**
     * @param {(state: GridVirtualizerState) => void} listener
     * @returns {() => void}
     */
    subscribe(listener) {
      const stopRows = rowVirtualizer.subscribe(() => listener(getState()));
      // The first call above already ran the listener, so skip the second.
      let ready = false;
      const stopColumns = columnVirtualizer.subscribe(() => {
        if (ready) listener(getState());
      });
      ready = true;
      return () => {
        stopRows();
        stopColumns();
      };
    },
    /**
     * The scroller reports its position.
     * @param {number} top
     * @param {number} left Distance from the inline start, so it is positive in
     * a right-to-left grid too.
     */
    setScroll(top, left) {
      rowVirtualizer.setScroll(top);
      columnVirtualizer.setScroll(left);
    },
    /**
     * Scroll so that the cell at `row` and `column` sits as `align` asks.
     * @param {number} row
     * @param {number} column
     * @param {{ align?: ScrollAlign }} [config]
     */
    scrollToCell(row, column, config) {
      rowVirtualizer.scrollToIndex(row, config);
      columnVirtualizer.scrollToIndex(column, config);
    },
  };
}
