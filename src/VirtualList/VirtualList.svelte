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
   * Specify an ancestor element that scrolls the list, such as the
   * `scrollElementRef` of a `ScrollGradient`.
   * When set, the list does not scroll itself.
   * @type {null | HTMLElement}
   */
  export let scrollElement = null;

  /**
   * Obtain a reference to the list container element.
   * @type {null | HTMLDivElement}
   * @bindable readonly
   */
  export let ref = null;

  import { afterUpdate, createEventDispatcher, onMount } from "svelte";
  import { createHeightMeasurer } from "../utils/height-measurer.js";
  import { createScrollEndTracker } from "../utils/is-scroll-near-end.js";
  import { noop } from "../utils/noop.js";
  import { virtualize } from "../utils/virtualize.js";

  const dispatch = createEventDispatcher();
  const scrollEndTracker = createScrollEndTracker();

  let scrollTop = 0;
  /** @type {number[]} */
  let heights = [];
  let detachScrollElement = noop;

  function handleMeasure(nextHeights) {
    heights = nextHeights;
  }

  const heightMeasurer = createHeightMeasurer({ onMeasure: handleMeasure });

  $: scrollEndTracker.noteItemCount(items.length);

  $: virtualData = virtualize({
    items,
    itemHeight,
    containerHeight,
    scrollTop,
    overscan,
    threshold,
    measured,
    heights: measured ? heights : undefined,
  });

  /** @param {Event} event */
  function handleScroll(event) {
    const target = /** @type {HTMLElement} */ (event.currentTarget);

    // An outer scroller can hold content above the list, so measure how far
    // the list's top has scrolled past the scroller's inner top edge.
    scrollTop =
      target === ref || !ref
        ? target.scrollTop
        : target.getBoundingClientRect().top +
          target.clientTop -
          ref.getBoundingClientRect().top;

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
    detachScrollElement = () => {
      element.removeEventListener("scroll", handleScroll);
    };
  }

  $: attachScrollElement(scrollElement);

  // The measurer observes the rows in the committed DOM, so it syncs after
  // every update that can move the window, as `menu-window.js` does.
  afterUpdate(() => {
    heightMeasurer.sync(measured ? ref : null);
  });

  onMount(() => {
    return () => {
      detachScrollElement();
      heightMeasurer.disconnect();
    };
  });
</script>

<div
  bind:this={ref}
  class:bx--virtual-list={true}
  {...$$restProps}
  style:height={scrollElement ? undefined : `${containerHeight}px`}
  on:scroll={handleScroll}
>
  <div style:height="{virtualData.totalHeight}px" style:position="relative">
    <div style:transform="translateY({virtualData.offsetY}px)">
      {#each virtualData.visibleItems as item, index (getKey(item, virtualData.startIndex + index))}
        <div
          data-virtual-index={measured
            ? virtualData.startIndex + index
            : undefined}
        >
          <slot {item} index={virtualData.startIndex + index} />
        </div>
      {/each}
    </div>
  </div>
</div>
