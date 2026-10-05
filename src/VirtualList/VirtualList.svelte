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
   * Specify a tag to render items straight into the parent element,
   * such as the list of a `ContainedList`, without a container of their own.
   * Two elements of this tag above and below the items hold the scroll height,
   * so use one the parent accepts as a child, like `"li"` inside a list.
   * Requires `scrollElement`. Each item must render exactly one element.
   * Rest props have no element to land on, so they are dropped.
   * @type {undefined | keyof HTMLElementTagNameMap}
   */
  export let spacerTag = undefined;

  /**
   * Obtain a reference to the list container element.
   * `null` when `spacerTag` is set.
   * @type {null | HTMLDivElement}
   * @bindable readonly
   */
  export let ref = null;

  import { afterUpdate, createEventDispatcher, onMount, tick } from "svelte";
  import {
    createHeightMeasurer,
    VIRTUAL_INDEX_ATTRIBUTE,
  } from "../utils/height-measurer.js";
  import { createScrollEndTracker } from "../utils/is-scroll-near-end.js";
  import { noop } from "../utils/noop.js";
  import { virtualize } from "../utils/virtualize.js";

  const dispatch = createEventDispatcher();
  const scrollEndTracker = createScrollEndTracker();

  let scrollTop = 0;
  /** @type {number[]} */
  let heights = [];
  let detachScrollElement = noop;
  /** @type {null | HTMLElement} */
  let startSpacer = null;
  /** @type {null | HTMLElement} */
  let endSpacer = null;

  /**
   * Roles that take `aria-posinset` and `aria-setsize`, so assistive
   * technology announces an item's place in the full list, not the window.
   */
  const POSITIONED_ITEM = "li, [role=listitem], [role=option], [role=article]";

  function handleMeasure(nextHeights) {
    heights = nextHeights;
  }

  // Rows in a parent list sit straight in its flow, where a margin such as
  // ContainedList's 1px overlap changes how far each row advances. Read once:
  // the measurer is created with the component.
  const heightMeasurer = createHeightMeasurer({
    onMeasure: handleMeasure,
    includeMargins: Boolean(spacerTag),
  });

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
    const listTop = spacerTag ? startSpacer : ref;
    scrollTop =
      target === listTop || !listTop
        ? target.scrollTop
        : target.getBoundingClientRect().top +
          target.clientTop -
          listTop.getBoundingClientRect().top;

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

  /**
   * The elements after the start spacer, one per rendered item. Without a
   * container, they are the only handle on the rows.
   * @returns {Element[]} The rows, or none if they do not match the window.
   */
  function getSpacedRows() {
    /** @type {Element[]} */
    const rows = [];
    let node = startSpacer?.nextElementSibling;
    while (
      node &&
      node !== endSpacer &&
      rows.length < virtualData.visibleItems.length
    ) {
      rows.push(node);
      node = node.nextElementSibling;
    }
    if (rows.length !== virtualData.visibleItems.length) return [];
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
      const index = virtualData.startIndex + offset;
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
    return () => {
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
    style:height="{virtualData.offsetY}px"
  />
  {#each virtualData.visibleItems as item, index (getKey(
    item,
    virtualData.startIndex + index,
  ))}
    <slot {item} index={virtualData.startIndex + index} />
  {/each}
  <!-- Rendered only when items follow the window, so the true last item
    still matches `:last-of-type`, as list styles such as separators expect. -->
  {#if virtualData.totalHeight > virtualData.endOffsetY}
    <svelte:element
      this={spacerTag}
      bind:this={endSpacer}
      aria-hidden="true"
      style:display={spacerTag === "li" ? "block" : undefined}
      style:height="{virtualData.totalHeight - virtualData.endOffsetY}px"
    />
  {/if}
{:else}
  <div
    bind:this={ref}
    class:bx--virtual-list={true}
    {...$$restProps}
    style:height={scrollElement ? undefined : `${containerHeight}px`}
    on:scroll={handleScroll}
  >
    <div style:height="{virtualData.totalHeight}px" style:position="relative">
      <div style:transform="translateY({virtualData.offsetY}px)">
        {#each virtualData.visibleItems as item, index (getKey(
          item,
          virtualData.startIndex + index,
        ))}
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
{/if}
