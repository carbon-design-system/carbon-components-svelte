<script>
  /**
   * @event {string} change
   * @restProps {nav}
   */

  /**
   * Specify the id of the active section.
   * Tracks the scroll position unless `noScrollSpy` is `true`.
   * @bindable writable
   * @type {string | undefined}
   */
  export let selectedId = undefined;

  /**
   * Set to `true` to stop updating `selectedId` from the scroll position.
   * Clicking an item still selects it.
   */
  export let noScrollSpy = false;

  /**
   * Specify the distance in pixels from the top of the scroll container at
   * which a section becomes active. Match the height of a sticky header.
   * Defaults to the scroll container's `scroll-padding-top`, where a native
   * hash jump lands a section.
   * @type {number | undefined}
   */
  export let scrollOffset = undefined;

  /**
   * Specify where a section becomes active, as a fraction of the scroll
   * container's visible height below `scrollOffset`: `0` when the section's
   * top reaches the top, `0.5` when it reaches the middle, `1` as soon as it
   * scrolls into view.
   */
  export let activationLine = 0;

  /**
   * Specify the element that scrolls the sections.
   * Defaults to the window.
   * @type {HTMLElement | null}
   */
  export let scrollContainer = null;

  /** Specify the ARIA label for the nav */
  export let labelText = "Table of contents";

  /**
   * Obtain a reference to the nav HTML element.
   * @type {null | HTMLElement}
   * @bindable readonly
   */
  export let ref = null;

  import { createEventDispatcher, onMount, setContext } from "svelte";
  import { writable } from "svelte/store";
  import {
    focusSection,
    getActiveSectionId,
    revealItem,
    scrollToSection,
  } from "../utils/active-section.js";
  import { rafThrottle } from "../utils/raf-throttle.js";
  import { sortByDomOrder } from "../utils/sort-by-dom-order.js";

  const dispatch = createEventDispatcher();

  // Idle time after the last scroll event before a click's selection hands
  // back to the scroll spy, so a smooth scroll doesn't step through every
  // section on its way to the target.
  const CLICK_LOCK_MS = 100;

  /** @type {import("svelte/store").Writable<string | undefined>} */
  const selectedStore = writable(selectedId);
  $: selectedStore.set(selectedId);

  /** @type {Array<{ id: string; node: HTMLElement }>} */
  let items = [];
  let itemsSyncQueued = false;

  let mounted = false;
  let locked = false;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let unlockTimer;

  let barTop = 0;
  let barHeight = 0;
  let barVisible = false;
  // Off for the first placement so the bar appears in place instead of
  // sliding in from the top.
  let barAnimated = false;
  /** @type {string | undefined} */
  let revealedId;

  /**
   * @param {string} id
   * @param {boolean} [notify]
   */
  function setSelected(id, notify = true) {
    if (id === selectedId) return;
    selectedId = id;
    if (notify) dispatch("change", id);
  }

  function spy() {
    if (locked) return;
    const id = getActiveSectionId(
      items.map((item) => item.id),
      {
        container: scrollContainer,
        offset: scrollOffset,
        line: activationLine,
      },
    );
    // Filling in an empty selection on mount isn't a change, as with Tabs,
    // so a `change` handler that writes the URL hash doesn't run on load.
    if (id !== undefined) setSelected(id, selectedId !== undefined);
  }

  function measure() {
    const active = items.find((item) => item.id === selectedId);
    // A hidden nav (`display: none`, such as a desktop-only sidebar) has no
    // box to measure. Leaving the bar unplaced lets it appear in place once
    // the nav shows, instead of sliding in from the top.
    if (!active || active.node.offsetHeight === 0) {
      barVisible = barAnimated = false;
      return;
    }
    barAnimated = barVisible;
    barTop = active.node.offsetTop;
    barHeight = active.node.offsetHeight;
    barVisible = true;

    // A long table of contents in a scrolling sidebar follows the reader.
    if (active.id === revealedId) return;
    revealedId = active.id;
    const section = document.getElementById(active.id);
    if (section) revealItem(active.node, section);
  }

  const scheduleSpy = rafThrottle(spy);
  const scheduleMeasure = rafThrottle(measure);

  function lock() {
    locked = true;
    clearTimeout(unlockTimer);
    unlockTimer = setTimeout(() => {
      locked = false;
    }, CLICK_LOCK_MS);
  }

  function handleScroll() {
    if (locked) lock();
    else scheduleSpy();
  }

  // Items register in mount order; sort once per batch so the spy walks
  // sections in document order.
  function queueItemsSync() {
    if (itemsSyncQueued) return;
    itemsSyncQueued = true;
    Promise.resolve().then(() => {
      itemsSyncQueued = false;
      items = sortByDomOrder(items);
      if (mounted && !noScrollSpy) scheduleSpy();
    });
  }

  /**
   * @type {(item: { id: string; node: HTMLElement }) => () => void}
   */
  function register(item) {
    items = [...items, item];
    queueItemsSync();
    return () => {
      items = items.filter((entry) => entry !== item);
      queueItemsSync();
    };
  }

  /**
   * @type {(id: string, event: MouseEvent) => void}
   */
  function select(id, event) {
    if (!noScrollSpy) lock();
    setSelected(id);

    // A native hash jump scrolls every scrollable ancestor of the section:
    // the window around a `scrollContainer`, or the parent page around an
    // iframe. Scroll only the section's own scroller instead. A top-level
    // window is already the outermost scroller, so it keeps the native jump
    // (URL hash, `:target`, focus start point, routers). Focus follows so
    // the next Tab continues from the section, as it does after a hash jump.
    if (event.defaultPrevented) return;
    if (scrollContainer === null && window.self === window.top) return;
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    scrollToSection(target, {
      container: scrollContainer,
      offset: scrollOffset,
    });
    focusSection(target);
  }

  setContext("carbon:TableOfContents", {
    selectedId: selectedStore,
    register,
    select,
  });

  /** @type {undefined | (() => void)} */
  let unbindSpy;

  /**
   * @param {boolean} enabled
   * @param {HTMLElement | null} container
   */
  function bindSpy(enabled, container) {
    unbindSpy?.();
    unbindSpy = undefined;
    scheduleSpy.cancel();
    if (!enabled) return;

    /** @type {HTMLElement | Window} */
    const target = container ?? window;
    target.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    unbindSpy = () => {
      target.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
    scheduleSpy();
  }

  $: if (mounted) bindSpy(!noScrollSpy, scrollContainer);

  // Moving the activation line can change the active section without a
  // scroll, such as a sticky header that resizes at a breakpoint.
  $: {
    scrollOffset;
    activationLine;
    if (mounted && !noScrollSpy) scheduleSpy();
  }

  // Re-place the bar after the DOM settles from a selection or item change.
  $: {
    selectedId;
    items;
    if (mounted) scheduleMeasure();
  }

  onMount(() => {
    mounted = true;

    // Items wrap differently as the nav resizes, which moves the active row.
    const observer = new ResizeObserver(() => scheduleMeasure());
    if (ref) observer.observe(ref);

    return () => {
      mounted = false;
      observer.disconnect();
      unbindSpy?.();
      scheduleSpy.cancel();
      scheduleMeasure.cancel();
      clearTimeout(unlockTimer);
    };
  });
</script>

<nav
  bind:this={ref}
  aria-label={labelText}
  class:bx--toc={true}
  class:bx--toc--measured={barVisible}
  {...$$restProps}
>
  <div
    aria-hidden="true"
    class:bx--toc__bar={true}
    class:bx--toc__bar--animated={barAnimated}
    style:transform="translateY({barTop}px)"
    style:height="{barHeight}px"
    style:opacity={barVisible ? 1 : 0}
  ></div>
  <ul class:bx--toc__list={true}>
    <slot />
  </ul>
</nav>
