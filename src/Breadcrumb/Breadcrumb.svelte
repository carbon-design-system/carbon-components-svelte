<script>
  /**
   * @template [Separator=any]
   */

  /** @extends {"./BreadcrumbSkeleton.svelte"} BreadcrumbSkeletonProps */

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
   * Specify the separator rendered between breadcrumb items.
   * Accepts a text character, rendered through CSS, or a component
   * reference (for example an icon or pictogram component), rendered as
   * a decorative DOM node.
   * @type {string | Separator}
   * @example
   * ```svelte
   * <Breadcrumb separator={ArrowRight}>
   * ```
   */
  export let separator = /** @type {string | Separator} */ ("/");

  /**
   * Set to `true` to collapse items that don't fit the available width into
   * an overflow menu, keeping the first and last items visible. Opt-in
   * because it forces a single, non-wrapping row regardless of viewport
   * (measurement needs a stable single line to fit against), which changes
   * `Breadcrumb`'s default wrapping behavior below the `md` breakpoint.
   */
  export let enableOverflow = false;

  import { onMount, setContext, tick } from "svelte";
  import { writable } from "svelte/store";
  import OverflowMenu from "../OverflowMenu/OverflowMenu.svelte";
  import OverflowMenuItem from "../OverflowMenu/OverflowMenuItem.svelte";
  import { rafThrottle } from "../utils/raf-throttle.js";
  import { getVisibleTagCount } from "../utils/tag-overflow.js";
  import BreadcrumbItem from "./BreadcrumbItem.svelte";
  import BreadcrumbSkeleton from "./BreadcrumbSkeleton.svelte";

  const separatorStore = writable(separator);

  $: separatorStore.set(separator);

  setContext("carbon:Breadcrumb", { separator: separatorStore });

  let listRef = null;
  let triggerRef = null;

  /** @type {{ text: string; href: string | undefined }[]} */
  let hiddenItems = [];

  function readItemData(li) {
    const link = li.querySelector(":scope > .bx--link, :scope > a");
    return {
      text: (li.textContent || "").trim(),
      href: link ? (link.getAttribute("href") ?? undefined) : undefined,
    };
  }

  // Breadcrumb items are slotted, arbitrary markup rather than an array this
  // component controls, so the fit is measured directly off the rendered
  // `<li>` children instead of a registry (unlike `TagSet`). They are
  // typically static after mount, so a resize-driven remeasure is enough;
  // this does not watch for slotted items being added or removed.
  function measure() {
    if (!listRef) return;

    const items = Array.from(listRef.children).filter(
      (el) => el !== triggerRef,
    );

    if (!enableOverflow || items.length <= 2) {
      for (const el of items) el.removeAttribute("data-overflow");
      if (items[0]) items[0].style.order = "";
      hiddenItems = [];
      return;
    }

    const first = items[0];
    const last = items[items.length - 1];
    const middle = items.slice(1, -1);

    const availableWidth = listRef.offsetWidth;
    const triggerWidth = triggerRef?.offsetWidth ?? 0;
    const availableForMiddle = Math.max(
      0,
      availableWidth - first.offsetWidth - last.offsetWidth,
    );

    // Fit as many trailing (closest to the current page) middle items as
    // possible, since those are the most relevant to keep visible; reversing
    // lets `getVisibleTagCount`'s existing backtracking (for when the
    // trigger itself needs room) apply unchanged.
    const reversedMiddleWidths = middle.map((el) => el.offsetWidth).reverse();

    const visibleTrailingCount = getVisibleTagCount({
      tagWidths: reversedMiddleWidths,
      availableWidth: availableForMiddle,
      overflowWidth: triggerWidth,
    });

    const hiddenCount = middle.length - visibleTrailingCount;

    middle.forEach((el, index) => {
      if (index < hiddenCount) {
        el.setAttribute("data-overflow", "true");
      } else {
        el.removeAttribute("data-overflow");
      }
    });

    // The trigger sits between the first item and the visible tail. It is
    // rendered before the slotted items in the DOM (so the last item stays
    // the actual `:last-child`), so pulling the first item ahead of it with
    // `order` is enough to visually reposition it without touching the
    // slotted items themselves.
    first.style.order = hiddenCount > 0 ? "-1" : "";

    hiddenItems =
      hiddenCount > 0 ? middle.slice(0, hiddenCount).map(readItemData) : [];
  }

  const throttledMeasure = rafThrottle(measure);

  onMount(() => {
    measure();

    const observer = new ResizeObserver(throttledMeasure);
    if (listRef) observer.observe(listRef);

    return () => {
      observer.disconnect();
      throttledMeasure.cancel();
    };
  });

  $: {
    enableOverflow;
    if (listRef) tick().then(measure);
  }
</script>

{#if skeleton}
  <BreadcrumbSkeleton
    {noTrailingSlash}
    {size}
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
      class:bx--breadcrumb--separator-icon={typeof separator !== "string"}
      style:--ccs-separator={typeof separator === "string"
        ? `'${separator}'`
        : "''"}
      class:bx--breadcrumb--overflow={enableOverflow}
    >
      {#if enableOverflow}
        <BreadcrumbItem
          bind:ref={triggerRef}
          class="bx--breadcrumb-item--overflow{hiddenItems.length === 0
            ? ' bx--breadcrumb-item--overflow-empty'
            : ''}"
        >
          <OverflowMenu
            size={size === "sm" ? "sm" : undefined}
            iconDescription="Show hidden breadcrumb items"
          >
            {#each hiddenItems as item (item.text)}
              <OverflowMenuItem text={item.text} href={item.href} />
            {/each}
          </OverflowMenu>
        </BreadcrumbItem>
      {/if}
      <slot />
    </ol>
  </nav>
{/if}
