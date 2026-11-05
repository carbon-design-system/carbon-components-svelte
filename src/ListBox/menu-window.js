// @ts-check
import { tick } from "svelte";
import {
  createHeightMeasurer,
  VIRTUAL_INDEX_ATTRIBUTE,
} from "../utils/height-measurer.js";
import { getMaxScrollHeight } from "../utils/max-scroll-height.js";
import { scrollIntoViewWithin } from "../utils/scroll-into-view-within.js";
import { syncPinnedWindow } from "../utils/virtual-window.js";
import { resolveVirtualConfig } from "../utils/virtualize.js";
import { createVirtualizer } from "../utils/virtualizer.js";
import { getMenuItemHeight, getMenuMaxHeight } from "./list-box-utils.js";

/**
 * The windowing configuration once one has been resolved.
 * @typedef {import("../utils/virtualize.js").VirtualListConfig & Record<string, unknown>} ResolvedConfig
 */

/**
 * @typedef {import("./menu-window.js").MenuWindowState} MenuWindowState
 */

/**
 * The consumer's `virtualize` prop with any `measured` key dropped.
 *
 * `wrapOptions` is the only thing that turns measuring on.
 *
 * @param {boolean | object | undefined} virtualizeProp
 * @returns {boolean | object | undefined}
 */
function withoutMeasured(virtualizeProp) {
  if (
    typeof virtualizeProp !== "object" ||
    virtualizeProp === null ||
    !("measured" in virtualizeProp)
  ) {
    return virtualizeProp;
  }

  const { measured, ...rest } = /** @type {{ measured?: unknown }} */ (
    virtualizeProp
  );
  return rest;
}

/**
 * Which options a listbox menu renders and where they sit. Resolves the
 * menu's windowing configuration and hands the arithmetic, the measured
 * heights and the scroll requests to a virtualizer, keeping what only a menu
 * knows: the collection its heights describe, the estimate that outlives a
 * close, the height observation, and the option's own rect once it is mounted.
 *
 * @param {Object} options
 * @param {() => HTMLElement | null | undefined} options.getContainer The menu's
 * scroll container, or nothing when the menu is closed. Nothing here acts
 * without one.
 * @param {(scrollTop: number) => void} options.onScrollTop The position the
 * container actually took, so the caller's mirror stays in step.
 * @param {(state: MenuWindowState) => void} [options.onState] Called when
 * measurement moves the state, resolved against the arguments `update` was last
 * given.
 */
export function createMenuWindow({ getContainer, onScrollTop, onState }) {
  /**
   * Height to assume for an unmeasured option: the average of the heights last
   * held.
   * @type {number | undefined}
   */
  let estimate;
  /**
   * The keys the held heights are indexed against, or the collection itself
   * when no key function was supplied.
   * @type {ArrayLike<unknown>}
   */
  let knownKeys = [];
  /** @type {ResolvedConfig | null} */
  let config = null;
  /** Whether that update resolved to measured heights. */
  let measured = false;
  /**
   * Whether the list it resolved them for is also windowed. Every measured
   * scroll path gates on this: a list under the threshold is laid out by the
   * browser, so it has no place to hold and no request to satisfy.
   */
  let measuredWindow = false;
  /** Set while `resolve` runs, which the caller reads from the return value. */
  let updating = false;
  /**
   * The arguments `update` was last given, so measurement can resolve the state
   * again without asking the caller to re-supply them.
   * @type {Parameters<typeof update>[0] | null}
   */
  let prevOptions = null;
  /**
   * Whether the next `resolve` records the position it is given without
   * reading a move into it: before the first, and after a reset.
   */
  let unsynced = true;
  /** Whether the virtualizer wrote a position since measurement began. */
  let wroteWhileMeasuring = false;
  let measuring = false;

  /**
   * Move the menu and read back what the container took. The virtualizer's own
   * writes come through here.
   * @param {number} next
   * @returns {number}
   */
  function writeContainer(next) {
    const container = getContainer();
    if (!container) return virtualizer.getScrollOffset();

    container.scrollTop = next;
    const actual = container.scrollTop;
    syncPinnedWindow(container, actual);
    if (measuring) wroteWhileMeasuring = true;
    onScrollTop(actual);
    return actual;
  }

  /**
   * Move the menu to a position the virtualizer did not ask for.
   * @param {number} next
   */
  function scrollTo(next) {
    const container = getContainer();
    if (!container) return;
    container.scrollTop = next;
    const actual = container.scrollTop;
    syncPinnedWindow(container, actual);
    // A position written here is not the reader moving, so it sets no lead.
    virtualizer.syncScroll(actual);
    onScrollTop(actual);
  }

  const virtualizer = createVirtualizer({
    scrollTo: writeContainer,
    // A browser lays out only so tall a scroll area, and drops a taller one.
    maxSize: getMaxScrollHeight(),
  });

  /** Hand the caller a state resolved again, unless it is about to be told. */
  function notifyChange() {
    if (updating || !prevOptions) return;
    onState?.(
      resolve({ ...prevOptions, scrollTop: virtualizer.getScrollOffset() }),
    );
  }

  /**
   * Place the option at `index` by reading the DOM: the measured path for a
   * list that was never windowed.
   * @param {number} index
   * @param {"top" | "nearest"} align
   */
  function placeFromDom(index, align) {
    const container = getContainer();
    if (!container) return;

    if (index < 0) {
      scrollTo(0);
      return;
    }

    const option = container.querySelector(
      `[${VIRTUAL_INDEX_ATTRIBUTE}="${index}"]`,
    );
    if (!(option instanceof HTMLElement)) return;

    if (align === "top") {
      scrollTo(
        container.scrollTop +
          (option.getBoundingClientRect().top -
            container.getBoundingClientRect().top),
      );
      return;
    }

    const before = container.scrollTop;
    scrollIntoViewWithin(option);
    if (container.scrollTop !== before) scrollTo(container.scrollTop);
  }

  /**
   * Take the heights just measured, and let the virtualizer hold the reader's
   * place against them.
   * @param {Array<[number, number]>} entries
   */
  function handleEntries(entries) {
    const container = getContainer();
    // Read where the reader left the menu before the correction below writes to
    // it. After that write, the position on the container is one the
    // virtualizer made, and a scroll the reader had made would be
    // indistinguishable from it.
    if (container && measuredWindow) noteScroll(container.scrollTop);

    measuring = true;
    wroteWhileMeasuring = false;
    try {
      virtualizer.measure(entries);
    } finally {
      measuring = false;
    }
  }

  /**
   * @param {number[]} next
   */
  function handleMeasured(next) {
    if (next.length === 0) {
      // Forgetting the heights is not news that anything on screen moved, so
      // there is no place to hold.
      virtualizer.resetMeasurements();
      notifyChange();
      return;
    }

    notifyChange();
    // A request the virtualizer just placed anew is not also placed by what the
    // DOM says: it waits for the next pass.
    if (!wroteWhileMeasuring) settle();
  }

  const measurer = createHeightMeasurer({
    onEntries: handleEntries,
    onMeasure: handleMeasured,
  });

  /**
   * Finish an outstanding request by asking the DOM about the option itself,
   * which no offsets can see: how tall it rendered, and where it sits against
   * the viewport. Runs on every pass while one stands, because measurement
   * arrives in batches and each can move the option out from under the last
   * answer.
   */
  function settle() {
    const container = getContainer();
    if (!virtualizer.hasPendingScroll() || !measuredWindow || !container) {
      return;
    }

    // Read rather than wait: a scroll event and the measurer's own frame are
    // not ordered against each other.
    noteScroll(container.scrollTop);
    const pending = virtualizer.getPendingScroll();
    if (!pending) return;

    const option = container.querySelector(
      `[${VIRTUAL_INDEX_ATTRIBUTE}="${pending.index}"]`,
    );
    if (!(option instanceof HTMLElement)) return;

    scrollIntoViewWithin(option);
    scrollTo(container.scrollTop);
  }

  /**
   * Note the collection the menu renders, forgetting the measurements when it
   * holds other options than the ones they describe. `getKey` is for a consumer
   * whose option objects are rebuilt as well, such as a checkbox toggle
   * replacing the toggled item, where what stays put is an id.
   *
   * @param {ArrayLike<unknown>} items
   * @param {((item: any, index: number) => unknown) | undefined} getKey
   */
  function noteCollection(items, getKey) {
    if (isSameCollection(items, getKey)) return;
    knownKeys = getKey ? Array.from(items, getKey) : items;
    reset();
  }

  /**
   * Whether the keys held still describe the options the menu renders, asked
   * without materialising a key per option: `update` runs on every scroll
   * event, and a long list would allocate an array per event to learn nothing.
   *
   * @param {ArrayLike<unknown>} items
   * @param {((item: any, index: number) => unknown) | undefined} getKey
   * @returns {boolean}
   */
  function isSameCollection(items, getKey) {
    if (knownKeys === items) return true;
    if (knownKeys.length !== items.length) return false;

    for (let index = 0; index < items.length; index++) {
      const key = getKey ? getKey(items[index], index) : items[index];
      if (knownKeys[index] !== key) return false;
    }

    return true;
  }

  /**
   * Resolve the window for the options the menu is about to render.
   *
   * @param {Object} options
   * @param {any[]} options.items The collection the menu renders, filtered
   * where there is a filter, since its positions are what heights and offsets
   * are indexed against.
   * @param {(item: any, index: number) => unknown} [options.getKey] What
   * identifies an option across a rebuild of `items`. Defaults to the option
   * itself; only called while heights are being measured.
   * @param {boolean} options.shouldVirtualize The threshold gate, from
   * `shouldVirtualizeMenu`. The caller resolves it, needing the answer before
   * it can work out `items`.
   * @param {boolean | object | undefined} options.virtualize The consumer's
   * `virtualize` prop.
   * @param {boolean} [options.wrapOptions] The consumer's `wrapOptions` prop.
   * Wrapping makes options unequal in height, so it is what turns measuring on.
   * @param {"xs" | "sm" | "md" | "lg" | "xl"} [options.size]
   * @param {boolean} [options.fluid] Whether menu items render at the fluid
   * height.
   * @param {number} options.scrollTop The menu's current scroll position.
   * @returns {import("./menu-window.js").MenuWindowState}
   */
  function update(options) {
    prevOptions = options;
    return resolve(options);
  }

  /**
   * Resolve the state for one set of arguments. Split from `update` so
   * measurement can re-run it against the arguments already held.
   * @param {Parameters<typeof update>[0]} options
   */
  function resolve({
    items,
    getKey,
    shouldVirtualize,
    virtualize: virtualizeProp,
    wrapOptions = false,
    size = "md",
    fluid = false,
    scrollTop,
  }) {
    updating = true;
    try {
      if (shouldVirtualize && wrapOptions) noteCollection(items, getKey);

      config = resolveVirtualConfig({
        shouldVirtualize,
        virtualize: withoutMeasured(virtualizeProp),
        defaults: {
          itemHeight: getMenuItemHeight(size, { fluid }),
          measured: wrapOptions,
        },
        estimate,
      });
      measured = Boolean(config?.measured);

      /** @type {import("../utils/virtualizer.js").VirtualizerState | null} */
      let state = null;
      if (config) {
        // Where the reader is comes before what a request asks for: options
        // that re-place a request would otherwise place it from a position the
        // reader has already left.
        if (unsynced) virtualizer.syncScroll(scrollTop);
        else virtualizer.setScroll(scrollTop);
        unsynced = false;
        state = virtualizer.setOptions({
          count: items.length,
          size: config.itemHeight,
          measured,
          viewportSize: config.containerHeight,
          overscan: config.overscan,
          threshold: config.threshold,
          maxItems: config.maxItems,
        });
      }

      const isVirtualized = Boolean(state?.isVirtualized);
      measuredWindow = measured && isVirtualized;

      return {
        itemsToRender:
          state && isVirtualized
            ? items.slice(state.startIndex, state.endIndex)
            : items,
        isVirtualized,
        startIndex: state?.startIndex ?? 0,
        offsetY: state?.startOffset ?? 0,
        totalHeight: state?.totalSize ?? 0,
        menuMaxHeight: config
          ? `${config.containerHeight}px`
          : getMenuMaxHeight(size),
        isWindowed: Boolean(config),
        isMeasured: measured,
        isPinned: Boolean(config?.optimizeFastScroll) && isVirtualized,
      };
    } finally {
      updating = false;
    }
  }

  /**
   * Bring the option at `index` into view.
   *
   * @param {number} index
   * @param {"top" | "nearest"} align
   */
  function scrollIntoView(index, align) {
    if (!config) return;

    if (measured && !measuredWindow) {
      virtualizer.cancelScroll();
      placeFromDom(index, align);
      return;
    }

    const container = getContainer();
    if (!container) return;

    // Keys can arrive faster than scroll events, so place against where the
    // container is, not where it was last reported.
    virtualizer.syncScroll(container.scrollTop);

    // A fixed-height menu has nothing to show for a negative index, and
    // nowhere to send the highlight: `"nearest"` leaves it where it is.
    if (index < 0 && !measured && align === "nearest") return;

    virtualizer.scrollToIndex(index, {
      align: align === "top" ? "start" : "nearest",
    });
  }

  /**
   * Reconcile height observation against the options the menu now renders, and
   * re-satisfy any outstanding scroll request..
   *
   * @returns {void | Promise<void>}
   */
  function sync() {
    if (measured) return tick().then(syncMeasurement);
    syncMeasurement();
  }

  /**
   * Reconcile measurement against the options now rendered, then re-satisfy any
   * outstanding request.
   */
  function syncMeasurement() {
    measurer.sync(measuredWindow ? getContainer() : null);
    settle();
  }

  /**
   * Note where the menu is scrolled to. A position other than the one last
   * written here is the reader's, and the reader's intent is more recent than
   * an outstanding request, so it supersedes one.
   *
   * Called from the scroll handler, and called directly by the paths that read
   * the container themselves, where waiting for the event would be too late.
   *
   * @param {number} scrollTop
   */
  function noteScroll(scrollTop) {
    virtualizer.setScroll(scrollTop);
  }

  /**
   * Forget the measurements and any outstanding request, keeping the estimate
   * they averaged to. Called on close, and by `noteCollection` when the
   * collection comes to hold other options.
   */
  function reset() {
    virtualizer.cancelScroll();
    virtualizer.clearLead();
    unsynced = true;

    const average = virtualizer.getMeasuredAverage();
    if (average !== null && average !== estimate) {
      estimate = average;
      notifyChange();
    }

    measurer.clear();
  }

  /** Stop observing for good. */
  function destroy() {
    virtualizer.cancelScroll();
    measurer.disconnect();
  }

  return {
    update,
    scrollIntoView,
    sync,
    noteScroll,
    reset,
    destroy,
  };
}

/**
 * Call from `afterUpdate`. Schedules (via `tick`) a scroll of the newly
 * highlighted option into view.
 *
 * @param {Object} options
 * @param {boolean} options.open
 * @param {boolean} options.shouldVirtualize
 * @param {number} options.highlightedIndex
 * @param {number} options.prevHighlightedIndex
 * @param {HTMLElement | null | undefined} options.listRef
 * @param {ReturnType<typeof createMenuWindow>} options.menuWindow
 * @returns {number} The value to store as `prevHighlightedIndex`.
 */
export function scheduleHighlightScroll({
  open,
  shouldVirtualize,
  highlightedIndex,
  prevHighlightedIndex,
  listRef,
  menuWindow,
}) {
  if (!(
    open &&
    shouldVirtualize &&
    highlightedIndex !== prevHighlightedIndex &&
    highlightedIndex >= 0 &&
    listRef
  )) {
    return prevHighlightedIndex;
  }

  tick().then(() => {
    if (!listRef || highlightedIndex < 0) return;
    menuWindow.scrollIntoView(highlightedIndex, "nearest");
  });

  return highlightedIndex;
}
