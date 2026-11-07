<script>
  /**
   * Set the size of the table.
   * Accepts the same Carbon v11 aliases as `DataTable`.
   * @type {"compact" | "short" | "medium" | "tall" | "xs" | "sm" | "md" | "lg" | "xl" | undefined}
   */
  export let size = undefined;

  /** Set to `true` to use zebra styles */
  export let zebra = false;

  /** Set to `true` to use static width */
  export let useStaticWidth = false;

  /** Set to `true` for the sortable variant */
  export let sortable = false;

  /** Set to `true` to enable a sticky header */
  export let stickyHeader = false;

  /**
   * Set to `true` to use a fixed table layout, typically when headers specify an explicit `width`/`minWidth`.
   */
  export let fixedLayout = false;

  /**
   * Set the style attribute on the `table` element.
   * @type {string | undefined}
   */
  export let tableStyle = undefined;

  /**
   * Set the style attribute on the outer `section` element when `stickyHeader` is `true`.
   * @type {string | undefined}
   */
  export let containerStyle = undefined;

  /**
   * Obtain a reference to the section HTML element. Only set when `stickyHeader` is true.
   * @type {null | HTMLElement}
   * @bindable readonly
   */
  export let ref = null;

  /**
   * Internal: set by `DataTable` when its rows can stack. A stacked row is
   * not a table row to CSS, so the table, its rows and cells say what they
   * are.
   */
  export let explicitRoles = false;

  /**
   * Id of an element that labels the table (e.g. `DataTable`'s title heading).
   * Internal: set directly by `DataTable`. Standalone compositions
   * (`TableContainer` wrapping `Table`) get this from context instead.
   * @type {string | undefined}
   */
  export let labelledBy = undefined;

  /**
   * Id of an element that describes the table (e.g. `DataTable`'s description text).
   * Internal: set directly by `DataTable`. Standalone compositions
   * (`TableContainer` wrapping `Table`) get this from context instead.
   * @type {string | undefined}
   */
  export let describedBy = undefined;

  import { getContext, onMount } from "svelte";
  import { writable } from "svelte/store";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { joinDescribedBy } from "../utils/field-status.js";
  import { noop } from "../utils/noop.js";
  import { observeResize } from "../utils/shared-observer.js";
  import {
    DATA_TABLE_SIZE_ALIASES,
    normalizeSize,
  } from "../utils/size-aliases.js";

  // Context is only consulted for the standalone `TableContainer` + `Table`
  // composition: an explicit `labelledBy`/`describedBy` prop (set by
  // `DataTable`, which renders its own title/description markup) always wins.
  $: effectiveSize = normalizeSize(size, DATA_TABLE_SIZE_ALIASES);

  const tableContainerCtx = getContext("carbon:TableContainer");
  const hasContextTitle = tableContainerCtx?.hasTitle ?? writable(false);
  const hasContextDescription =
    tableContainerCtx?.hasDescription ?? writable(false);

  // Naming and description always go on the `table`, even when the sticky
  // header wraps it in a `section`. A consumer-supplied
  // aria-label/aria-labelledby wins over the id `TableContainer`/`DataTable`
  // provide. A consumer aria-describedby joins the built-in description id.
  $: ({
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: sectionProps,
  } = splitAriaNaming($$restProps));
  $: ariaLabelledby =
    ariaLabelledBy ??
    (ariaLabel
      ? undefined
      : (labelledBy ??
        ($hasContextTitle ? tableContainerCtx.titleId : undefined)));
  $: ariaDescribedby = joinDescribedBy(
    describedBy ??
      ($hasContextDescription ? tableContainerCtx.descriptionId : undefined),
    ariaDescribedBy,
  );

  /** @type {null | HTMLDivElement} */
  let contentRef = null;
  /** @type {null | HTMLTableElement} */
  let tableRef = null;

  // A table that overflows its scroll container (`.bx--data-table-content`,
  // or the sticky-header section) scrolls inside it. Keyboard users can only
  // scroll that region once it takes focus, so it does while it overflows.
  let scrollable = false;
  let stopObserving = noop;
  /** @type {null | HTMLElement} */
  let scrollRef = null;

  function updateScrollable() {
    if (!scrollRef) return;
    // 1px absorbs sub-pixel sizes, as in `Tabs`.
    scrollable =
      scrollRef.scrollWidth - scrollRef.clientWidth > 1 ||
      scrollRef.scrollHeight - scrollRef.clientHeight > 1;
  }

  // A browser scrolls a focused control just into the scroll region, which
  // leaves it behind the sticky header when it comes in from above. Scroll
  // its row to the header's bottom edge first: the control is then in view,
  // so the browser has nothing left to scroll. Padding the region with
  // `scroll-padding` would not do: Firefox ignores it for a control that
  // only partly sits under the header.
  /** @param {FocusEvent} event */
  function clearStickyHeader(event) {
    // Each `th` sticks on its own, so `thead` itself scrolls away.
    const head = tableRef?.tHead?.querySelector("th");
    const target = event.target;
    if (!(target instanceof Element) || !head || !scrollRef) return;
    if (!target.closest("tbody")) return;
    const top = (target.closest("td") ?? target).getBoundingClientRect().top;
    const covered = head.getBoundingClientRect().bottom - top;
    if (covered > 0) scrollRef.scrollTop -= covered;
  }

  /**
   * @param {null | HTMLElement} content
   * @param {null | HTMLTableElement} table
   */
  function observeOverflow(content, table) {
    stopObserving();
    scrollRef = content;
    if (!content) {
      stopObserving = noop;
      scrollable = false;
      return;
    }
    const stopContent = observeResize(content, updateScrollable);
    const stopTable = table ? observeResize(table, updateScrollable) : noop;
    stopObserving = () => {
      stopContent();
      stopTable();
    };
  }

  $: observeOverflow(stickyHeader ? ref : contentRef, tableRef);

  onMount(() => () => stopObserving());
</script>

{#if stickyHeader}
  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
  <section
    class:bx--data-table_inner-container={true}
    bind:this={ref}
    tabindex={scrollable ? 0 : undefined}
    aria-labelledby={scrollable ? ariaLabelledby : undefined}
    {...sectionProps}
    style={containerStyle}
    on:focusin={clearStickyHeader}
  >
    <table
      bind:this={tableRef}
      role={explicitRoles ? "table" : undefined}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      aria-describedby={ariaDescribedby}
      class:bx--data-table={true}
      class:bx--data-table--compact={effectiveSize === "compact"}
      class:bx--data-table--short={effectiveSize === "short"}
      class:bx--data-table--tall={effectiveSize === "tall"}
      class:bx--data-table--md={effectiveSize === "medium"}
      class:bx--data-table--sort={sortable}
      class:bx--data-table--zebra={zebra}
      class:bx--data-table--static={useStaticWidth}
      class:bx--data-table--sticky-header={stickyHeader}
      class:bx--data-table--fixed-layout={fixedLayout}
      class:bx--data-table--stacked={explicitRoles}
      style={tableStyle}
    >
      <slot />
    </table>
  </section>
{:else}
  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
  <div
    bind:this={contentRef}
    class:bx--data-table-content={true}
    tabindex={scrollable ? 0 : undefined}
    role={scrollable && ariaLabelledby ? "region" : undefined}
    aria-labelledby={scrollable ? ariaLabelledby : undefined}
  >
    <table
      bind:this={tableRef}
      class:bx--data-table={true}
      class:bx--data-table--compact={effectiveSize === "compact"}
      class:bx--data-table--short={effectiveSize === "short"}
      class:bx--data-table--tall={effectiveSize === "tall"}
      class:bx--data-table--md={effectiveSize === "medium"}
      class:bx--data-table--sort={sortable}
      class:bx--data-table--zebra={zebra}
      class:bx--data-table--static={useStaticWidth}
      class:bx--data-table--sticky-header={stickyHeader}
      class:bx--data-table--fixed-layout={fixedLayout}
      class:bx--data-table--stacked={explicitRoles}
      role={explicitRoles ? "table" : undefined}
      {...$$restProps}
      aria-labelledby={ariaLabelledby}
      aria-describedby={ariaDescribedby}
      style={tableStyle}
    >
      <slot />
    </table>
  </div>
{/if}
