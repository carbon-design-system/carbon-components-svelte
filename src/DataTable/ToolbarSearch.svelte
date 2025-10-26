<script>
  /**
   * @restProps {input}
   * @event {null} clear
   */

  /**
   * Specify the value of the search input
   * @type {number | string}
   */
  export let value = "";

  /** Set to `true` to expand the search bar */
  export let expanded = false;

  /** Set to `true` to keep the search bar expanded */
  export let persistent = false;

  /** Set to `true` to disable the search bar */
  export let disabled = false;

  /**
   * Set to `true` to filter table rows using the search value.
   *
   * If `true`, the default search excludes `id`, `cells` fields and
   * only does a basic comparison on string and number type cell values.
   *
   * To implement your own client-side filtering, pass a function
   * that accepts a row and value and returns a boolean.
   * @type {boolean | ((row: import("./DataTable.svelte").DataTableRow, value: number | string) => boolean)}
   */
  export let shouldFilterRows = false;

  /**
   * The filtered row ids
   * @type {ReadonlyArray<import("./DataTable.svelte").DataTableRowId>}
   */
  export let filteredRowIds = [];

  /** Specify the tabindex */
  export let tabindex = "0";

  /**
   * Obtain a reference to the input HTML element
   * @type {null | HTMLInputElement}
   */
  export let ref = null;

  import { afterUpdate, getContext, onMount, tick } from "svelte";
  import Search from "../Search/Search.svelte";

  const ctx = getContext("DataTable") ?? {};

  let rows = null;
  let unsubscribe = null;

  $: if (shouldFilterRows) {
    unsubscribe = ctx?.tableRows.subscribe((tableRows) => {
      // Only update if the rows have actually changed.
      // This approach works in both Svelte 4 and Svelte 5.
      if (JSON.stringify(tableRows) !== JSON.stringify(rows)) {
        rows = tableRows;
      }
    });
  } else {
    rows = null;
  }

  onMount(() => {
    return () => {
      unsubscribe?.();
    };
  });

  afterUpdate(() => {
    // Only filter rows in a callback to avoid an infinite update loop.
    if (rows !== null) {
      filteredRowIds = ctx?.filterRows(value, shouldFilterRows);
    }
  });

  async function expandSearch() {
    await tick();
    if (disabled || persistent || expanded) return;
    expanded = true;
    await tick();
    ref.focus();
  }

  $: expanded = !!value.length;
  $: classes = [
    expanded && "bx--toolbar-search-container-active",
    persistent
      ? "bx--toolbar-search-container-persistent"
      : "bx--toolbar-search-container-expandable",
    disabled && "bx--toolbar-search-container-disabled",
  ]
    .filter(Boolean)
    .join(" ");
</script>

<Search
  {tabindex}
  {disabled}
  {...$$restProps}
  searchClass="{classes} {$$restProps.class}"
  bind:ref
  bind:value
  on:clear
  on:clear={expandSearch}
  on:change
  on:input
  on:focus
  on:focus={expandSearch}
  on:blur
  on:blur={() => {
    expanded = !persistent && !!value.length;
  }}
  on:keyup
  on:keydown
  on:paste
/>
