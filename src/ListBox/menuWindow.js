// @ts-check
import { tick } from "svelte";
import {
  createHeightMeasurer,
  VIRTUAL_INDEX_ATTRIBUTE,
} from "../utils/heightMeasurer.js";
import { scrollIntoViewWithinMenu } from "../utils/scrollIntoViewWithinMenu.js";
import {
  getBoundedScrollTop,
  getMeasuredAverage,
  getMeasuredScrollCorrection,
  scrollHighlightedIntoView,
  scrollSelectedIntoView,
  virtualListState,
} from "../utils/virtualize.js";
import { getMenuItemHeight, getMenuMaxHeight } from "./list-box-utils.js";

/**
 * The windowing configuration once one has been resolved.
 * @typedef {import("../utils/virtualize.js").VirtualListConfig & Record<string, unknown>} ResolvedConfig
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
 * Which options a listbox menu renders and where they sit. Wraps the offset
 * arithmetic in `virtualize.js` and the height observation in
 * `heightMeasurer.js`
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
  /** @type {number[]} Per-option heights, by position, sparse. */
  let heights = [];
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
  /** How many options the last `update` was given. */
  let itemCount = 0;
  /** Whether that update resolved to measured heights. */
  let isMeasured = false;
  /**
   * Whether the list it resolved them for is also windowed. Every measured
   * scroll path gates on this: a list under the threshold is laid out by the
   * browser, so it has no place to hold and no request to satisfy.
   */
  let isMeasuredWindow = false;
  /** Set while `resolve` runs, which the caller reads from the return value. */
  let isUpdating = false;
  /**
   * The arguments `update` was last given, so measurement can resolve the state
   * again without asking the caller to re-supply them.
   * @type {Parameters<typeof update>[0] | null}
   */
  let lastOptions = null;
  /**
   * The outstanding request.
   * @type {null | {
   *   index: number,
   *   align: "top" | "nearest",
   *   scrollTop: number,
   *   heights: number[]
   * }}
   */
  let pending = null;
  /**
   * The position this last vouched for: written here, or read from a container
   * this left where it was. Anything else is the reader's.
   */
  let lastWrittenScrollTop = -1;

  const measurer = createHeightMeasurer({ onMeasure: handleMeasured });

  /** Hand the caller a state resolved again, unless it is about to be told. */
  function notifyChange() {
    if (isUpdating || !lastOptions) return;
    onState?.(resolve(lastOptions));
  }

  /**
   * Move the menu and read back what the container took.
   * @param {number} next
   */
  function scrollTo(next) {
    const container = getContainer();
    if (!container) return;
    container.scrollTop = next;
    lastWrittenScrollTop = container.scrollTop;
    onScrollTop(lastWrittenScrollTop);
  }

  /**
   * Where the option at `index` has to sit for the requested alignment under
   * measured heights, or `null` when it is already close enough to leave alone.
   * @param {number} index
   * @param {"top" | "nearest"} align
   * @param {number} currentScrollTop
   * @param {ResolvedConfig} resolved
   * @returns {number | null}
   */
  function measuredPosition(index, align, currentScrollTop, resolved) {
    if (align === "top") {
      return getBoundedScrollTop({
        index,
        itemHeight: resolved.itemHeight,
        containerHeight: resolved.containerHeight,
        itemCount,
        heights,
      });
    }

    return scrollHighlightedIntoView({
      highlightedIndex: index,
      currentScrollTop,
      itemCount,
      itemHeight: resolved.itemHeight,
      containerHeight: resolved.containerHeight,
      overscan: resolved.overscan ?? 3,
      maxItems: resolved.maxItems,
      heights,
    });
  }

  /**
   * Place the option at `index` with the heights known so far.
   * @param {number} index
   * @param {"top" | "nearest"} align
   */
  function requestMeasured(index, align) {
    const container = getContainer();
    if (!isMeasuredWindow || !config || !container) return;

    if (index < 0) {
      pending = null;
      scrollTo(0);
      return;
    }

    const next = measuredPosition(index, align, container.scrollTop, config);
    if (next === null) lastWrittenScrollTop = container.scrollTop;
    else scrollTo(next);
    pending = {
      index,
      align,
      scrollTop: next ?? container.scrollTop,
      heights,
    };
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
    scrollIntoViewWithinMenu(option);
    if (container.scrollTop !== before) scrollTo(container.scrollTop);
  }

  /**
   * Take the heights just measured and hold the reader's place against them.
   * @param {number[]} next
   * @param {number[]} previous
   */
  function handleMeasured(next, previous) {
    heights = next;
    notifyChange();

    if (next.length === 0) return;

    const container = getContainer();
    if (!isMeasuredWindow || !config || !container) return;

    // Read where the reader left the menu before the correction below writes
    // to it. After that write, the position on the container is one this made,
    // and a scroll the reader had made would be indistinguishable from it.
    noteScroll(container.scrollTop);

    const correction = getMeasuredScrollCorrection({
      scrollTop: container.scrollTop,
      itemCount,
      itemHeight: config.itemHeight,
      containerHeight: config.containerHeight,
      heights: next,
      previousHeights: previous,
    });

    if (correction !== 0) {
      scrollTo(Math.max(0, container.scrollTop + correction));
    }

    settle();
  }

  /**
   * Re-satisfy the outstanding request. Runs on every pass while one stands,
   * because measurement arrives in batches and each batch can move the option
   * out from under the last answer.
   */
  function settle() {
    const container = getContainer();
    if (!pending || !isMeasuredWindow || !config || !container) return;

    // Read rather than wait: a scroll event and the measurer's own frame are
    // not ordered against each other.
    noteScroll(container.scrollTop);
    if (!pending) return;

    if (pending.heights !== heights) {
      const previousScrollTop = pending.scrollTop;
      const next = measuredPosition(
        pending.index,
        pending.align,
        container.scrollTop,
        config,
      );
      pending = { ...pending, scrollTop: next ?? previousScrollTop, heights };

      if (next !== null && next !== previousScrollTop) {
        scrollTo(next);
        return;
      }
    }

    const option = container.querySelector(
      `[${VIRTUAL_INDEX_ATTRIBUTE}="${pending.index}"]`,
    );
    if (!(option instanceof HTMLElement)) return;

    scrollIntoViewWithinMenu(option);
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
   * @returns {import("./menuWindow.js").MenuWindowState}
   */
  function update(options) {
    lastOptions = options;
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
    isUpdating = true;
    try {
      if (shouldVirtualize && wrapOptions) noteCollection(items, getKey);

      const state = virtualListState({
        items,
        scrollTop,
        shouldVirtualize,
        virtualize: withoutMeasured(virtualizeProp),
        defaults: {
          itemHeight: getMenuItemHeight(size, { fluid }),
          measured: wrapOptions,
        },
        heights,
        estimate,
      });

      config = state.config;
      itemCount = items.length;
      isMeasured = Boolean(config?.measured);
      isMeasuredWindow = isMeasured && Boolean(state.data?.isVirtualized);

      return {
        itemsToRender: state.itemsToRender,
        isVirtualized: Boolean(state.data?.isVirtualized),
        startIndex: state.data?.startIndex ?? 0,
        offsetY: state.data?.offsetY ?? 0,
        totalHeight: state.data?.totalHeight ?? 0,
        menuMaxHeight: config
          ? `${config.containerHeight}px`
          : getMenuMaxHeight(size),
        isWindowed: Boolean(config),
        isMeasured,
      };
    } finally {
      isUpdating = false;
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

    if (isMeasured) {
      if (isMeasuredWindow) {
        requestMeasured(index, align);
        return;
      }

      pending = null;
      placeFromDom(index, align);
      return;
    }

    const container = getContainer();
    if (!container) return;

    if (align === "top") {
      scrollTo(
        scrollSelectedIntoView({
          selectedIndex: index,
          itemCount,
          itemHeight: config.itemHeight,
          containerHeight: config.containerHeight,
        }),
      );
      return;
    }

    if (index < 0) return;

    const next = scrollHighlightedIntoView({
      highlightedIndex: index,
      currentScrollTop: container.scrollTop,
      itemCount,
      itemHeight: config.itemHeight,
      containerHeight: config.containerHeight,
      overscan: config.overscan ?? 3,
      maxItems: config.maxItems,
    });

    if (next !== null) scrollTo(next);
  }

  /**
   * Reconcile height observation against the options the menu now renders, and
   * re-satisfy any outstanding scroll request..
   *
   * @returns {void | Promise<void>}
   */
  function sync() {
    if (isMeasured) return tick().then(syncMeasurement);
    syncMeasurement();
  }

  /**
   * Reconcile measurement against the options now rendered, then re-satisfy any
   * outstanding request.
   */
  function syncMeasurement() {
    measurer.sync(isMeasuredWindow ? getContainer() : null);
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
    if (Math.abs(scrollTop - lastWrittenScrollTop) > 1) {
      pending = null;
    }
  }

  /**
   * Drop the outstanding request, keeping everything measured for it. For a
   * caller that knows the request is spent when no scroll position says so:
   * a pointer landing on another option takes the highlight away from the one
   * that asked, and moves nothing this could read.
   */
  function cancelRequest() {
    pending = null;
  }

  /**
   * Forget the measurements and any outstanding request, keeping the estimate
   * they averaged to. Called on close, and by `noteCollection` when the
   * collection comes to hold other options.
   */
  function reset() {
    pending = null;

    const average = getMeasuredAverage(heights);
    if (average !== null && average !== estimate) {
      estimate = average;
      notifyChange();
    }

    measurer.clear();
  }

  /** Stop observing for good. */
  function destroy() {
    pending = null;
    measurer.disconnect();
  }

  return {
    update,
    scrollIntoView,
    sync,
    noteScroll,
    cancelRequest,
    reset,
    destroy,
  };
}
