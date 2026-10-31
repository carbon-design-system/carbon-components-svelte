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
   * Set to `true` when a column is pinned (`position: sticky`) so the table
   * stacks its pinned cells among themselves, under anything outside it.
   * `DataTable` sets this from `columnPinned`.
   */
  export let pinnedColumns = false;

  /**
   * Set to `true` for `role="grid"`, when the cells are keyboard navigable.
   * `DataTable` sets this from `cellFocus`.
   */
  export let grid = false;

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
   * Obtain a reference to the section HTML element (when stickyHeader is enabled) or table HTML element.
   * @type {null | HTMLElement | HTMLTableElement}
   * @bindable readonly
   */
  export let ref = null;

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
  // A grid scrolls as its cells take focus, so the region is not a second tab stop.
  $: tabbableScroll = scrollable && !grid;
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
    tabindex={tabbableScroll ? 0 : undefined}
    aria-labelledby={tabbableScroll ? ariaLabelledby : undefined}
    {...sectionProps}
    style={containerStyle}
  >
    <table
      bind:this={tableRef}
      role={grid ? "grid" : undefined}
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
      class:bx--data-table--pinned-columns={pinnedColumns}
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
    tabindex={tabbableScroll ? 0 : undefined}
    role={tabbableScroll && ariaLabelledby ? "region" : undefined}
    aria-labelledby={tabbableScroll ? ariaLabelledby : undefined}
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
      class:bx--data-table--pinned-columns={pinnedColumns}
      role={grid ? "grid" : undefined}
      {...$$restProps}
      aria-labelledby={ariaLabelledby}
      aria-describedby={ariaDescribedby}
      style={tableStyle}
    >
      <slot />
    </table>
  </div>
{/if}
