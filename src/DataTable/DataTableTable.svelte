<script>
  /**
   * Set the size of the table.
   * @type {"compact" | "short" | "medium" | "tall"}
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
   * Set the style attribute on the `table` element.
   * @type {string}
   */
  export let tableStyle = undefined;

  /**
   * Obtain a reference to the section HTML element (when stickyHeader is enabled) or table HTML element.
   * @type {null | HTMLElement | HTMLTableElement}
   * @bindable readonly
   */
  export let ref = null;

  /**
   * Id of an element that labels the table (e.g. `DataTable`'s title heading).
   * Internal: set directly by `DataTable`. Standalone compositions
   * (`TableContainer` wrapping `DataTableTable`) get this from context instead.
   * @type {string | undefined}
   */
  export let labelledBy = undefined;

  /**
   * Id of an element that describes the table (e.g. `DataTable`'s description text).
   * Internal: set directly by `DataTable`. Standalone compositions
   * (`TableContainer` wrapping `DataTableTable`) get this from context instead.
   * @type {string | undefined}
   */
  export let describedBy = undefined;

  import { getContext } from "svelte";
  import { writable } from "svelte/store";

  // Context is only consulted for the standalone `TableContainer` + `DataTableTable`
  // composition: an explicit `labelledBy`/`describedBy` prop (set by
  // `DataTable`, which renders its own title/description markup) always wins.
  const tableContainerCtx = getContext("carbon:TableContainer");
  const hasContextTitle = tableContainerCtx?.hasTitle ?? writable(false);
  const hasContextDescription =
    tableContainerCtx?.hasDescription ?? writable(false);

  // A consumer-supplied aria-label/aria-labelledby/aria-describedby always
  // wins over the id `TableContainer`/`DataTable` provide.
  $: ariaLabelledby =
    !$$restProps["aria-label"] && !$$restProps["aria-labelledby"]
      ? (labelledBy ??
        ($hasContextTitle ? tableContainerCtx.titleId : undefined))
      : undefined;
  $: ariaDescribedby = $$restProps["aria-describedby"]
    ? undefined
    : (describedBy ??
      ($hasContextDescription ? tableContainerCtx.descriptionId : undefined));
</script>

{#if stickyHeader}
  <section
    class:bx--data-table_inner-container={true}
    bind:this={ref}
    {...$$restProps}
  >
    <table
      aria-labelledby={ariaLabelledby}
      aria-describedby={ariaDescribedby}
      class:bx--data-table={true}
      class:bx--data-table--compact={size === "compact"}
      class:bx--data-table--short={size === "short"}
      class:bx--data-table--tall={size === "tall"}
      class:bx--data-table--md={size === "medium"}
      class:bx--data-table--sort={sortable}
      class:bx--data-table--zebra={zebra}
      class:bx--data-table--static={useStaticWidth}
      class:bx--data-table--sticky-header={stickyHeader}
      style={tableStyle}
    >
      <slot />
    </table>
  </section>
{:else}
  <table
    aria-labelledby={ariaLabelledby}
    aria-describedby={ariaDescribedby}
    class:bx--data-table={true}
    class:bx--data-table--compact={size === "compact"}
    class:bx--data-table--short={size === "short"}
    class:bx--data-table--tall={size === "tall"}
    class:bx--data-table--md={size === "medium"}
    class:bx--data-table--sort={sortable}
    class:bx--data-table--zebra={zebra}
    class:bx--data-table--static={useStaticWidth}
    class:bx--data-table--sticky-header={stickyHeader}
    {...$$restProps}
    style={tableStyle}
  >
    <slot />
  </table>
{/if}
