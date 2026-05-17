<script>
  /**
   * @template {import("./DataTable.svelte").DataTableRow} [Row=import("./DataTable.svelte").DataTableRow]
   * @restProps {input}
   * @event {null} clear
   */

  /**
   * Specify the value of the search input.
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
   * @type {boolean | ((row: Row, value: number | string) => boolean)}
   */
  export let shouldFilterRows = false;

  /**
   * The filtered row ids.
   * @type {ReadonlyArray<Row["id"]>}
   */
  export let filteredRowIds = [];

  /**
   * Specify the tabindex
   * @type {number | string | undefined}
   */
  export let tabindex = "0";

  /**
   * Obtain a reference to the input HTML element.
   * @type {null | HTMLInputElement}
   */
  export let ref = null;

  import { getContext, onMount, tick } from "svelte";
  import Search from "../Search/Search.svelte";
  import { rowsEqual } from "./data-table-utils.js";

  const ctx = getContext("carbon:DataTable") ?? {};

  let rows = null;
  let unsubscribe = null;

  $: if (shouldFilterRows) {
    unsubscribe = ctx?.tableRows.subscribe((tableRows) => {
      // Only update if the rows have actually changed.
      // This approach works in both Svelte 4 and Svelte 5.
      if (!rowsEqual(tableRows, rows)) {
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

  $: if (rows !== null) {
    filteredRowIds = ctx.filterRows(value, shouldFilterRows);
  }

  async function expandSearch() {
    await tick();
    if (disabled || persistent || expanded) return;
    expanded = true;
    await tick();
    ref.focus();
  }

  /**
   * Programmatically clear the search input.
   * Resets `value` and collapses the search bar (unless `persistent`).
   * @type {() => void}
   * @example
   * ```svelte
   * <ToolbarSearch bind:this={search} />
   * <Button on:click={() => search.clear()}>Clear search</Button>
   * ```
   */
  export function clear() {
    value = "";
    if (!persistent) expanded = false;
  }

  $: if (!persistent) expanded = String(value ?? "").length > 0;
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
  searchClass={[classes, $$restProps.class].filter(Boolean).join(" ")}
  bind:ref
  bind:value
  on:clear
  on:clear={clear}
  on:change
  on:input
  on:focus
  on:focus={expandSearch}
  on:blur
  on:blur={() => {
    expanded = !persistent && String(value ?? "").length > 0;
  }}
  on:keyup
  on:keydown
  on:paste
/>
