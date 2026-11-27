<script>
  /**
   * @template {import("../utils/icon-component.js").IconComponent} [Separator=any]
   */

  /** @extendProps {"./BreadcrumbSkeleton.svelte"} BreadcrumbSkeletonProps */

  /** Set to `true` to hide the separator after the last breadcrumb item */
  export let noTrailingSlash = false;

  /** Set to `true` to display skeleton state */
  export let skeleton = false;

  /** Specify the ARIA label for the nav */
  export let labelText = "Breadcrumb";

  /**
   * Specify the size of the breadcrumb.
   * @type {"sm" | "md"}
   */
  export let size = "md";

  /**
   * Specify the orientation of the breadcrumb.
   * By default, items stack vertically below the `md` breakpoint
   * and lay out horizontally above it.
   * Set to `"vertical"` to always stack items, or `"horizontal"` to never stack them.
   * @type {"horizontal" | "vertical" | undefined}
   */
  export let orientation = undefined;

  /**
   * Specify the separator rendered between breadcrumb items.
   * Accepts a text character, rendered through CSS, or a component
   * reference (for example an icon or pictogram component), rendered as
   * a decorative DOM node.
   * @type {string | Separator}
   * @example
   * ```svelte
   * <Breadcrumb separator={ArrowRight}>
   *   <BreadcrumbItem href="/">Home</BreadcrumbItem>
   * </Breadcrumb>
   * ```
   */
  export let separator = /** @type {string | Separator} */ ("/");

  /**
   * Specify what happens when the items don't fit on one line.
   * `"wrap"` moves them onto more lines, following `orientation`.
   * `"menu"` keeps one horizontal line and collapses the middle items that
   * don't fit into an overflow menu after the first item. Each menu item
   * keeps its link and `aria-current`. The first and last items stay
   * visible. The items must be `BreadcrumbItem`s; `orientation` does not
   * apply.
   * @type {"wrap" | "menu"}
   */
  export let overflow = "wrap";

  /** Specify the accessible name of the overflow menu button */
  export let overflowMenuDescription = "Show hidden breadcrumb items";

  import { onMount, setContext } from "svelte";
  import { writable } from "svelte/store";
  import { toCssString } from "../utils/css-string.js";
  import { rafThrottle } from "../utils/raf-throttle.js";
  import { observeResize } from "../utils/shared-observer.js";
  import { getVisibleTagCount } from "../utils/tag-overflow.js";
  import BreadcrumbOverflow from "./BreadcrumbOverflow.svelte";
  import BreadcrumbSkeleton from "./BreadcrumbSkeleton.svelte";

  const separatorStore = writable(separator);

  $: separatorStore.set(separator);

  /** @type {import("svelte/store").Writable<{ first: Element | null; hidden: Set<Element>; items: { text: string; href?: string; current?: "page" | "step" | "location" | "date" | "time" | "true" }[] }>} */
  const overflowStore = writable({
    first: null,
    hidden: new Set(),
    items: [],
  });

  /** @type {import("svelte/store").Writable<{ component: typeof import("./BreadcrumbOverflow.svelte").default; size: "sm" | "md"; description: string }>} */
  const overflowMenuStore = writable({
    component: BreadcrumbOverflow,
    size,
    description: overflowMenuDescription,
  });

  $: overflowMenuStore.set({
    component: BreadcrumbOverflow,
    size,
    description: overflowMenuDescription,
  });

  setContext("carbon:Breadcrumb", {
    separator: separatorStore,
    overflow: overflowStore,
    overflowMenu: overflowMenuStore,
  });

  /** @type {null | HTMLOListElement} */
  let listRef = null;

  // The menu button's item, measured once it renders. Until then, a 20px
  // button plus its separator.
  let triggerWidth = 40;

  /** @type {Element | null} */
  let observedLast = null;
  let stopObservingLast = () => {};

  /** @param {Element} el */
  const outerWidth = (el) =>
    /** @type {HTMLElement} */ (el).offsetWidth +
    (Number.parseFloat(getComputedStyle(el).marginInlineEnd) || 0);

  /**
   * @param {Element} li
   * @returns {{ text: string; href?: string; current?: "page" | "step" | "location" | "date" | "time" | "true" }}
   */
  function readItem(li) {
    const link = li.querySelector("a[href]");
    const current =
      /** @type {any} */ (
        li.querySelector("[aria-current]")?.getAttribute("aria-current")
      ) ??
      (li.classList.contains("bx--breadcrumb-item--current")
        ? "page"
        : undefined);
    return {
      text: (li.textContent ?? "").trim(),
      href: link?.getAttribute("href") ?? undefined,
      current,
    };
  }

  function reset() {
    const { first, items } = $overflowStore;
    if (first === null && items.length === 0) return;
    overflowStore.set({ first: null, hidden: new Set(), items: [] });
  }

  // The items are slotted markup, so measure the rendered `li`s. Hidden
  // items stay in the layout, out of flow, so they can be measured again
  // when the list grows.
  function measure() {
    if (overflow !== "menu" || !listRef) return reset();

    const children = Array.from(listRef.children);
    const trigger = children.find((el) =>
      el.classList.contains("bx--breadcrumb-item--overflow"),
    );
    const items = children.filter((el) => el !== trigger);
    if (items.length <= 2) return reset();

    const first = items[0];
    const last = /** @type {HTMLElement} */ (items[items.length - 1]);
    const middle = items.slice(1, -1);

    // The last item wraps when the line is too short for it. Watch it too:
    // it unwraps without the list changing size.
    if (last !== observedLast) {
      stopObservingLast();
      observedLast = last;
      stopObservingLast = observeResize(last, () => scheduleMeasure());
    }

    if (trigger) triggerWidth = outerWidth(trigger);

    // A wrapped last item already has less than its own width.
    const lastWrapped = last.offsetHeight > first.clientHeight + 1;
    const available = lastWrapped
      ? 0
      : listRef.clientWidth - outerWidth(first) - outerWidth(last);

    // Keep the items closest to the current page.
    const visibleCount = getVisibleTagCount({
      tagWidths: middle.map(outerWidth).reverse(),
      availableWidth: Math.max(0, available),
      overflowWidth: triggerWidth,
    });
    const hidden = middle.slice(0, middle.length - visibleCount);

    const previous = $overflowStore;
    if (
      previous.hidden.size === hidden.length &&
      hidden.every((el) => previous.hidden.has(el))
    ) {
      return;
    }

    overflowStore.set({
      first: hidden.length > 0 ? first : null,
      hidden: new Set(hidden),
      items: hidden.map(readItem),
    });

    // The menu button renders now; measure again with its real width.
    if (hidden.length > 0 && !trigger) scheduleMeasure();
  }

  const scheduleMeasure = rafThrottle(measure);

  onMount(() => {
    const stop = listRef
      ? observeResize(listRef, () => scheduleMeasure())
      : null;
    return () => {
      stop?.();
      stopObservingLast();
      scheduleMeasure.cancel();
    };
  });

  $: if (listRef) {
    overflow;
    scheduleMeasure();
  }
</script>

{#if skeleton}
  <BreadcrumbSkeleton
    {noTrailingSlash}
    {size}
    {orientation}
    {separator}
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  />
{:else}
  <nav
    aria-label={labelText}
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    <ol
      bind:this={listRef}
      class:bx--breadcrumb={true}
      class:bx--breadcrumb--no-trailing-slash={noTrailingSlash}
      class:bx--breadcrumb--sm={size === "sm"}
      class:bx--breadcrumb--horizontal={overflow !== "menu" &&
        orientation === "horizontal"}
      class:bx--breadcrumb--vertical={overflow !== "menu" &&
        orientation === "vertical"}
      class:bx--breadcrumb--overflow-menu={overflow === "menu"}
      class:bx--breadcrumb--separator-icon={typeof separator !== "string"}
      style:--ccs-separator={typeof separator === "string"
        ? toCssString(separator)
        : "''"}
    >
      <slot />
    </ol>
  </nav>
{/if}
