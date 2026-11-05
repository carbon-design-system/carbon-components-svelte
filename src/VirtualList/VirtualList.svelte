<script>
  /**
   * @template {Record<string, unknown>} [Item=Record<string, unknown>]
   */

  /**
   * @restProps {div}
   * @slot {{ item: Item; index: number; }}
   */

  /**
   * Dispatched when the list is scrolled near the bottom (load-more signal).
   * Not the browser's native `scrollend` (scroll stopped).
   * @event {{ scrollTop: number; scrollHeight: number; clientHeight: number }} scrollend
   */

  /**
   * Specify the items to render.
   * A browser scrolls only so far, about 17.9 million pixels in Firefox and
   * 33.5 million in Chrome and Safari. A longer list ends at the last item
   * that fits, so page or filter a list that large.
   *
   * Items put before the current ones keep the reader's place, once they have
   * scrolled: the list moves by what was added. So do items dropped from the
   * front, as a log does that keeps its last lines. Items match by `getKey`, or
   * by identity when the list holds objects, so a list of strings or numbers
   * has to be told with a keyed `getKey`.
   * @type {ReadonlyArray<Item>}
   */
  export let items = [];

  /**
   * Specify the height of each item in pixels.
   * When `measured` is `true`, this is only the estimate for items not yet measured.
   */
  export let itemHeight = 40;

  /**
   * Specify the height of the scrollable viewport in pixels.
   * When `scrollElement` is set, match this to that element's visible height.
   */
  export let containerHeight = 300;

  /** Specify the number of items to render above and below the viewport */
  export let overscan = 3;

  /**
   * Specify the minimum number of items before windowing activates.
   * Below it, every item renders.
   */
  export let threshold = 0;

  /**
   * Set to `true` to measure each rendered item with `ResizeObserver`
   * instead of assuming every item is `itemHeight` tall.
   */
  export let measured = false;

  /** @type {(_item: unknown, index: number) => number} */
  function defaultGetKey(_item, index) {
    return index;
  }

  /**
   * Specify the key for each item.
   * Defaults to the item's index, which is only stable when items are appended.
   * @type {(item: Item, index: number) => string | number}
   */
  export let getKey = defaultGetKey;

  /**
   * Set to `true` to keep the rendered items in view during very fast
   * scrolling, such as a scrollbar drag, instead of showing blank space until
   * new items render.
   * The items then follow the scroll a frame behind, and pause while the main
   * thread is busy.
   * Ignored when `scrollElement` is set.
   */
  export let optimizeFastScroll = false;

  /**
   * Specify an ancestor element that scrolls the list, such as the
   * `scrollElementRef` of a `ScrollGradient`.
   * When set, the list does not scroll itself.
   * @type {null | HTMLElement}
   */
  export let scrollElement = null;

  /**
   * Specify a tag to render items straight into the parent element,
   * such as the list of a `ContainedList`, without a container of their own.
   * Two elements of this tag above and below the items hold the scroll height,
   * so use one the parent accepts as a child, like `"li"` inside a list.
   * Requires `scrollElement`. Each item must render exactly one element.
   * Rest props have no element to land on, so they are dropped.
   * `keepMounted` and `stickyIndices` have nowhere to place an item, so they
   * are ignored.
   * @type {undefined | keyof HTMLElementTagNameMap}
   */
  export let spacerTag = undefined;

  /**
   * Set to `"end"` to keep the end of the list in view as items arrive or
   * resize, such as a log or a conversation.
   * Scrolling away from the end stops it. Scrolling back to the end, or
   * calling `scrollToEnd`, starts it again.
   * @type {undefined | "end"}
   */
  export let follow = undefined;

  /**
   * Specify the indices of items to keep rendered wherever they sit in the
   * list, such as the one that holds focus or is the target of
   * `aria-activedescendant`. Without this, an item that scrolls out of the
   * window unmounts, and focus is lost with it.
   * @type {ReadonlyArray<number>}
   */
  export let keepMounted = [];

  /**
   * Specify the ascending indices of items, such as section headers, that pin
   * to the start of the viewport once scrolled past. The next one replaces it.
   * The pinned item has no opaque background of its own: give the item one.
   * @type {ReadonlyArray<number>}
   */
  export let stickyIndices = [];

  /**
   * Specify the scroll position, in pixels, to render the first window for.
   * Server output then shows the rows the reader will see, and the list scrolls
   * there on mount without a jump.
   */
  export let initialScrollTop = 0;

  /**
   * Whether the end of the list is in view.
   * @bindable readonly
   */
  export let atEnd = true;

  /**
   * Obtain a reference to the list container element.
   * `null` when `spacerTag` is set.
   * @type {null | HTMLDivElement}
   * @bindable readonly
   */
  export let ref = null;

  /**
   * Scroll so that the item at `index` sits as `align` asks: at the `"start"`
   * of the viewport (the default), its `"center"` or `"end"`, or `"nearest"` to
   * move only as far as it takes to bring it fully into view.
   * With `measured`, the position is corrected as items above it are measured,
   * until the reader scrolls. Returns the position written, or `null` when the
   * item is already where `align` asks.
   * @type {(index: number, options?: { align?: "start" | "center" | "end" | "nearest" }) => number | null}
   */
  export function scrollToIndex(index, options) {
    return virtualizer.scrollToIndex(index, options);
  }

  /**
   * Scroll to the end of the list, and hold it there when `follow` is `"end"`.
   * Returns the position written, or `null` when the end is already in view.
   * @type {() => number | null}
   */
  export function scrollToEnd() {
    return virtualizer.scrollToEnd();
  }

  import { afterUpdate, createEventDispatcher, onMount, tick } from "svelte";
  import {
    createHeightMeasurer,
    VIRTUAL_INDEX_ATTRIBUTE,
  } from "../utils/height-measurer.js";
  import { createScrollEndTracker } from "../utils/is-scroll-near-end.js";
  import { getMaxScrollHeight } from "../utils/max-scroll-height.js";
  import { noop } from "../utils/noop.js";
  import { syncPinnedWindow } from "../utils/virtual-window.js";
  import {
    createVirtualizer,
    getDroppedCount,
    getPrependedCount,
  } from "../utils/virtualizer.js";
  import VirtualWindow from "./VirtualWindow.svelte";

  const dispatch = createEventDispatcher();
  const scrollEndTracker = createScrollEndTracker();

  /**
   * The scroll position the window was resolved against, for the pinned layer.
   * Window math lives in the virtualizer.
   */
  let scrollTop = initialScrollTop;
  let detachScrollElement = noop;
  /** @type {null | HTMLElement} */
  let startSpacer = null;
  /** @type {null | HTMLElement} */
  let endSpacer = null;
  /**
   * A scroll position the virtualizer asked for, written once the list has
   * rendered what it was asked about: growing the list and scrolling to its
   * new end is one request, and the new end does not exist until the spacer
   * does.
   * @type {number | null}
   */
  let queuedScroll = null;
  /**
   * The position the scroller was last at, as far as this knows: read from it,
   * or written to it.
   */
  let appliedScroll = 0;

  /**
   * Roles that take `aria-posinset` and `aria-setsize`, so assistive
   * technology announces an item's place in the full list, not the window.
   */
  const POSITIONED_ITEM = "li, [role=listitem], [role=option], [role=article]";

  /** @returns {null | HTMLElement} The element that scrolls the list. */
  function getScroller() {
    return scrollElement ?? ref;
  }

  /**
   * How far the list's top has scrolled past the scroller's inner top edge. An
   * outer scroller can hold content above the list, so this is not always its
   * own `scrollTop`.
   * @param {HTMLElement} target The element that scrolls the list.
   * @returns {number}
   */
  function readScrollTop(target) {
    const listTop = spacerTag ? startSpacer : ref;
    return target === listTop || !listTop
      ? target.scrollTop
      : target.getBoundingClientRect().top +
          target.clientTop -
          listTop.getBoundingClientRect().top;
  }

  function flushScroll() {
    const offset = queuedScroll;
    queuedScroll = null;
    const scroller = getScroller();
    if (offset === null || !scroller) return;

    // The list's own scroll position and the scroller's differ by whatever sits
    // above the list.
    const current = readScrollTop(scroller);
    // The reader may have moved the list since the request, in a scroll event
    // that has not been delivered yet. A scroll event and this flush are not
    // ordered against each other, and the reader's move is the more recent
    // intent: report it, which drops the request and stops following, and do
    // not write over it.
    // A list that got shorter is not the reader: the scroller clamped the
    // position to the new end.
    const clamped =
      current < appliedScroll &&
      current >= scroller.scrollHeight - scroller.clientHeight - 1;
    if (Math.abs(current - appliedScroll) > 1 && !clamped) {
      appliedScroll = current;
      scrollTop = current;
      virtualizer.setScroll(current);
      return;
    }

    const origin = scroller.scrollTop - current;
    scroller.scrollTop = origin + offset;
    const actual = readScrollTop(scroller);
    appliedScroll = actual;
    if (scroller === ref) syncPinnedWindow(scroller, actual);
    scrollTop = actual;
    // The scroller clamps to what it can reach.
    if (actual !== offset) virtualizer.syncScroll(actual);
  }

  /**
   * @param {number} offset
   * @returns {number}
   */
  function writeScroll(offset) {
    // A scroller takes whole pixels. A position that rounds down can land just
    // short of the item boundary it was computed from, which starts the window
    // one item early and renders a row nobody has measured. Round up, so the
    // position taken is never short of the one asked for.
    const snapped = Math.ceil(offset - 1e-6);
    if (queuedScroll === null) tick().then(flushScroll);
    queuedScroll = snapped;
    return snapped;
  }

  const virtualizer = createVirtualizer({
    count: items.length,
    size: itemHeight,
    measured,
    viewportSize: containerHeight,
    overscan,
    threshold,
    // A browser lays out only so tall a scroll area, and drops a taller one.
    maxSize: getMaxScrollHeight(),
    follow: follow ?? false,
    keepMounted,
    stickyIndices,
    initialOffset: initialScrollTop,
    scrollTo: writeScroll,
  });

  let virtualState = virtualizer.getState();
  const stopVirtualizer = virtualizer.subscribe((next) => {
    virtualState = next;
  });

  // Rows in a parent list sit straight in its flow, where a margin such as
  // ContainedList's 1px overlap changes how far each row advances. Read once:
  // the measurer is created with the component.
  const heightMeasurer = createHeightMeasurer({
    onEntries: (entries) => {
      virtualizer.measure(entries);
    },
    includeMargins: Boolean(spacerTag),
  });

  /** @type {ReadonlyArray<Item>} */
  let knownItems = items;

  /**
   * How many items were put before the ones `prev` held, or dropped from the
   * front of them. A list of strings or numbers has no identity to match on,
   * and the same value can appear twice, so those match only by a `getKey` that
   * reads the item.
   * @param {ReadonlyArray<Item>} prev
   * @param {ReadonlyArray<Item>} next
   * @returns {{ added: number, dropped: number }}
   */
  function countFrontChanges(prev, next) {
    if (prev.length === 0 || next.length === 0) return { added: 0, dropped: 0 };

    const keyed =
      getKey !== defaultGetKey && getKey(prev[0], 0) === getKey(prev[0], 1);
    if (!keyed && (typeof prev[0] !== "object" || prev[0] === null)) {
      return { added: 0, dropped: 0 };
    }

    const key = keyed
      ? (/** @type {Item} */ item) => getKey(item, 0)
      : undefined;
    return {
      added: getPrependedCount(prev, next, key),
      dropped: getDroppedCount(prev, next, key),
    };
  }

  /**
   * Hold the reader's place when items are put before the ones the list held,
   * and forget the measured heights when `items` holds other items than the
   * ones they describe. Heights are indexed by item, so they stay right when
   * items are appended (load-more), but not when the list is replaced.
   *
   * Follows `items` without keeping it: holding an old list keeps it alive, and
   * a log that drops its oldest lines would keep every item of its first array.
   *
   * @param {ReadonlyArray<Item>} next
   * @param {boolean} isMeasured
   */
  function noteItems(next, isMeasured) {
    const prev = knownItems;
    knownItems = next;
    if (next === prev) return;

    const { added, dropped } = countFrontChanges(prev, next);
    if (added > 0) {
      virtualizer.prepend(added);
      heightMeasurer.shift(added);
      return;
    }
    if (dropped > 0) {
      virtualizer.dropFront(dropped);
      heightMeasurer.shift(-dropped);
      return;
    }

    if (!isMeasured) return;
    if (next.length >= prev.length && prev.every((item, i) => next[i] === item))
      return;
    heightMeasurer.clear();
    virtualizer.resetMeasurements();
  }

  $: noteItems(items, measured);
  // Unmeasured, the list reads no heights. Drop any it kept: they would outlive
  // a list replaced while unmeasured, and apply to the new items once
  // `measured` is set again. `clear` is cheap when there are none.
  $: if (!measured) heightMeasurer.clear();

  $: virtualizer.setOptions({
    count: items.length,
    size: itemHeight,
    measured,
    viewportSize: containerHeight,
    overscan,
    threshold,
    follow: follow ?? false,
    keepMounted,
    stickyIndices,
  });

  $: scrollEndTracker.noteItemCount(items.length);

  $: visibleItems = virtualState.isVirtualized
    ? items.slice(virtualState.startIndex, virtualState.endIndex)
    : items;
  $: startIndex = virtualState.startIndex;
  $: stickyIndex = spacerTag ? -1 : virtualState.stickyIndex;
  $: keptIndices = spacerTag ? [] : virtualState.kept;
  $: keptSet = new Set(keptIndices);
  // The pinned item has its own layer, so it is not also kept.
  $: keptRendered = keptIndices.filter(
    (index) => index !== stickyIndex && index < items.length,
  );

  /**
   * Whether the window leaves the item at `index` to the sticky or kept layer.
   * Passed what it reads so the markup tracks it under Svelte 3 and 4.
   * @param {number} index
   * @param {number} sticky
   * @param {Set<number>} kept
   */
  function isApartIn(index, sticky, kept) {
    return index === sticky || kept.has(index);
  }
  $: atEnd = virtualState.atEnd;

  $: pinned =
    optimizeFastScroll && !scrollElement && virtualState.isVirtualized;

  /** @param {HTMLElement} target The element that scrolls the list. */
  function syncScrollTop(target) {
    scrollTop = readScrollTop(target);
    appliedScroll = scrollTop;
    virtualizer.setScroll(scrollTop);
  }

  /**
   * Input that scrolls the reader away from the end arrives before the scroll
   * does, and a scroller can take the list's write to follow the end before it
   * takes the reader's scroll. So the list lets go on the input, not the scroll.
   * @param {Event} event
   */
  function handleReaderInput(event) {
    if (follow !== "end") return;
    if (event instanceof WheelEvent) {
      if (event.deltaY < 0) virtualizer.release();
    } else if (event instanceof KeyboardEvent) {
      if (["ArrowUp", "PageUp", "Home"].includes(event.key)) {
        virtualizer.release();
      }
    } else if (event instanceof PointerEvent) {
      // The scrollbar belongs to the scroller itself, not to anything in it.
      if (event.target === event.currentTarget) virtualizer.release();
    } else {
      virtualizer.release();
    }
  }

  const READER_INPUT = ["wheel", "touchmove", "pointerdown", "keydown"];

  /** @param {Event} event */
  function handleScroll(event) {
    const target = /** @type {HTMLElement} */ (event.currentTarget);

    syncScrollTop(target);

    const detail = scrollEndTracker.observe({
      scrollTop: target.scrollTop,
      scrollHeight: target.scrollHeight,
      clientHeight: target.clientHeight,
      itemCount: items.length,
    });
    if (detail) dispatch("scrollend", detail);
  }

  /** @param {null | HTMLElement} element */
  function attachScrollElement(element) {
    detachScrollElement();
    detachScrollElement = noop;
    if (!element) return;

    element.addEventListener("scroll", handleScroll, { passive: true });
    for (const type of READER_INPUT) {
      element.addEventListener(type, handleReaderInput, { passive: true });
    }
    detachScrollElement = () => {
      element.removeEventListener("scroll", handleScroll);
      for (const type of READER_INPUT) {
        element.removeEventListener(type, handleReaderInput);
      }
    };

    // The scroller may already be scrolled, which fires no event to catch up
    // with. Wait for the list to render, since its position is what counts. A
    // scroll the list has queued is the position it wants, not one to read back.
    tick().then(() => {
      if (scrollElement === element && queuedScroll === null) {
        syncScrollTop(element);
      }
    });
  }

  $: attachScrollElement(scrollElement);

  /**
   * The elements after the start spacer, one per rendered item. Without a
   * container, they are the only handle on the rows.
   * @returns {Element[]} The rows, or none if they do not match the window.
   */
  function getSpacedRows() {
    /** @type {Element[]} */
    const rows = [];
    let node = startSpacer?.nextElementSibling;
    while (node && node !== endSpacer && rows.length < visibleItems.length) {
      rows.push(node);
      node = node.nextElementSibling;
    }
    if (rows.length !== visibleItems.length) return [];
    // The end spacer, when rendered, must follow the last row directly.
    if (endSpacer && node !== endSpacer) return [];
    return rows;
  }

  /**
   * @param {Element} element
   * @param {string} name
   * @param {string} value
   */
  function setAttributeIfChanged(element, name, value) {
    if (element.getAttribute(name) !== value) {
      element.setAttribute(name, value);
    }
  }

  /**
   * Stamp each spaced row with its index in `items`. The rows belong to the
   * slot, so they cannot carry these through markup as wrapped rows do.
   * @returns {Element[]} The rows, or none if they do not match the window.
   */
  function stampSpacedRows() {
    const rows = getSpacedRows();
    const setsize = String(items.length);

    // Most updates leave the window in place, so skip writes that would not
    // change anything.
    rows.forEach((row, offset) => {
      const index = virtualState.startIndex + offset;
      if (measured) {
        setAttributeIfChanged(row, VIRTUAL_INDEX_ATTRIBUTE, String(index));
      }
      if (row.matches(POSITIONED_ITEM)) {
        setAttributeIfChanged(row, "aria-posinset", String(index + 1));
        setAttributeIfChanged(row, "aria-setsize", setsize);
      }
    });

    return rows;
  }

  // The measurer observes the rows in the committed DOM, so it syncs after
  // every update that can move the window, as `menu-window.js` does.
  afterUpdate(() => {
    if (spacerTag) {
      // Under Svelte 5, `afterUpdate` can run before the each block below
      // patches the rows, so wait for the flush to finish.
      tick().then(() => {
        if (!startSpacer?.isConnected) return;
        const rows = stampSpacedRows();
        heightMeasurer.sync(measured ? rows : null);
      });
      return;
    }

    heightMeasurer.sync(measured ? ref : null);
  });

  onMount(() => {
    // The first window was resolved for this position, as server output was.
    // Scroll there, so the reader sees what was rendered.
    const initial = virtualizer.getScrollOffset();
    if (initial > 0) writeScroll(initial);

    return () => {
      stopVirtualizer();
      detachScrollElement();
      heightMeasurer.disconnect();
    };
  });
</script>

{#if spacerTag}
  <!-- A block spacer is not a list item: no marker, no counter step. -->
  <svelte:element
    this={spacerTag}
    bind:this={startSpacer}
    aria-hidden="true"
    style:display={spacerTag === "li" ? "block" : undefined}
    style:height="{virtualState.startOffset}px"
  />
  {#each visibleItems as item, index (getKey(item, startIndex + index))}
    <slot {item} index={startIndex + index} />
  {/each}
  <!-- Rendered only when items follow the window, so the true last item
    still matches `:last-of-type`, as list styles such as separators expect. -->
  {#if virtualState.totalSize > virtualState.endOffset}
    <svelte:element
      this={spacerTag}
      bind:this={endSpacer}
      aria-hidden="true"
      style:display={spacerTag === "li" ? "block" : undefined}
      style:height="{virtualState.totalSize - virtualState.endOffset}px"
    />
  {/if}
{:else}
  <div
    bind:this={ref}
    class:bx--virtual-list={true}
    {...$$restProps}
    style:height={scrollElement ? undefined : `${containerHeight}px`}
    on:scroll={handleScroll}
    on:wheel|passive={handleReaderInput}
    on:touchmove|passive={handleReaderInput}
    on:pointerdown|passive={handleReaderInput}
    on:keydown|passive={handleReaderInput}
  >
    <VirtualWindow
      totalHeight={virtualState.totalSize}
      offsetY={virtualState.startOffset}
      {scrollTop}
      {pinned}
      {measured}
    >
      <svelte:fragment slot="sticky">
        {#if stickyIndex >= 0 && stickyIndex < items.length}
          <!-- A zero-height sticky layer holds the pinned item at the top of
            the viewport; the item overflows it, and the scroller clips. -->
          <div
            style:position="sticky"
            style:top="0"
            style:height="0"
            style:z-index="1"
          >
            <div
              data-virtual-index={measured ? stickyIndex : undefined}
              style:position="absolute"
              style:inset-inline="0"
              style:top="0"
            >
              <slot item={items[stickyIndex]} index={stickyIndex} />
            </div>
          </div>
        {/if}
      </svelte:fragment>
      {#each visibleItems as item, index (getKey(item, startIndex + index))}
        <!-- The pinned or kept item renders apart from the window, so its place
          in the flow is a gap of its height. -->
        <div
          data-virtual-index={measured &&
          !isApartIn(startIndex + index, stickyIndex, keptSet)
            ? startIndex + index
            : undefined}
          aria-hidden={isApartIn(startIndex + index, stickyIndex, keptSet)
            ? "true"
            : undefined}
          style:height={isApartIn(startIndex + index, stickyIndex, keptSet)
            ? `${virtualizer.sizeOf(startIndex + index)}px`
            : undefined}
        >
          {#if !isApartIn(startIndex + index, stickyIndex, keptSet)}
            <slot {item} index={startIndex + index} />
          {/if}
        </div>
      {/each}
      <svelte:fragment slot="kept">
        {#each keptRendered as keptIndex (getKey(items[keptIndex], keptIndex))}
          <div
            data-virtual-index={measured ? keptIndex : undefined}
            style:position="absolute"
            style:inset-inline="0"
            style:top="{virtualizer.offsetOf(keptIndex)}px"
          >
            <slot item={items[keptIndex]} index={keptIndex} />
          </div>
        {/each}
      </svelte:fragment>
    </VirtualWindow>
  </div>
{/if}
