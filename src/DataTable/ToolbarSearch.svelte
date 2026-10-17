<script>
  /**
   * @template {import("./DataTable.svelte").DataTableRow} [Row=import("./DataTable.svelte").DataTableRow]
   * @restProps {input}
   * @event {null} clear
   * @event {number | string} search
   */

  /**
   * Specify the value of the search input.
   * @type {number | string}
   * @bindable writable
   */
  export let value = "";

  /**
   * Set to `true` to expand the search bar.
   * @bindable writable
   */
  export let expanded = false;

  /** Set to `true` to keep the search bar expanded */
  export let persistent = false;

  /**
   * Specify the label text. It is visually hidden and names the search
   * field for assistive technology.
   */
  export let labelText = "Search";

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
   * @bindable readonly
   */
  export let filteredRowIds = [];

  /**
   * Specify the tabindex
   * @type {number | string | undefined}
   */
  export let tabindex = "0";

  /**
   * Milliseconds of quiet time before rows are filtered. Filtering waits
   * until typing pauses; `value` still updates immediately; clearing
   * applies at once. `0` filters synchronously on every keystroke. A
   * starting `value` filters on mount without waiting.
   *
   * Unrelated to the `search` event, which fires on <kbd>Enter</kbd>
   * regardless of this delay.
   */
  export let debounce = 0;

  /**
   * Set to `true` to yield to the browser before rows are filtered, so the
   * input and the clear button paint before a large table re-renders.
   * `value` still updates immediately.
   *
   * Filtering becomes asynchronous: `filteredRowIds` and the table rows
   * update shortly after `value`, and clearing no longer applies at once.
   * Rapid changes coalesce, so only the latest value is filtered. Combined
   * with `debounce`, the debounce delay elapses first, then the filter yields.
   * The first filter on mount and server rendering stay synchronous.
   */
  export let deferFilter = false;

  /**
   * Obtain a reference to the input HTML element.
   * @type {null | HTMLInputElement}
   * @bindable readonly
   */
  export let ref = null;

  /** Set to `true` to select the input's text when it receives focus */
  export let selectTextOnFocus = false;

  import { getContext, onMount, tick } from "svelte";
  import Search from "../Search/Search.svelte";
  import { debounce as debounceFn } from "../utils/debounce.js";
  import { rowsEqual } from "./data-table-utils.js";

  const ctx = getContext("carbon:DataTable") ?? {};

  let rows = null;
  let unsubscribe = null;

  $: {
    unsubscribe?.();
    unsubscribe = null;
    if (shouldFilterRows) {
      // Outside a `DataTable` there is no context, so there are no rows to filter.
      unsubscribe = ctx.tableRows?.subscribe((tableRows) => {
        // Only update if the rows have actually changed.
        // This approach works in both Svelte 4 and Svelte 5.
        if (!rowsEqual(tableRows, rows)) {
          rows = tableRows;
        }
      });
    } else {
      rows = null;
    }
  }

  let debouncedFilter = null;

  // Bumped on every filter request so a yielded filter that was overtaken
  // (or outlived the component) skips itself.
  let filterRequest = 0;
  // Filtering defers only in the browser after the first render, so the initial
  // filter and server-rendered markup stay synchronous.
  let mounted = false;

  // Called from the `$:` block below. A function call keeps `filterRequest`
  // out of that block's dependencies.
  function invalidatePending() {
    filterRequest++;
  }

  // The first filter runs right away, so a starting value filters the
  // first render; only later edits wait for the debounce. A function call
  // keeps `mounted` out of the `$:` block's dependencies.
  function canDebounce() {
    return mounted;
  }

  function applyFilter(searchValue, filter) {
    filteredRowIds = ctx.filterRows(searchValue, filter);
  }

  function yieldToBrowser() {
    return typeof globalThis.scheduler?.yield === "function"
      ? globalThis.scheduler.yield()
      : new Promise((resolve) => setTimeout(resolve, 0));
  }

  function runFilter(searchValue, filter) {
    if (!deferFilter || !mounted) {
      applyFilter(searchValue, filter);
      return;
    }
    const request = filterRequest;
    yieldToBrowser().then(() => {
      if (request === filterRequest) applyFilter(searchValue, filter);
    });
  }

  $: {
    debouncedFilter?.cancel();
    debouncedFilter = debounce > 0 ? debounceFn(runFilter, debounce) : null;
  }

  onMount(() => {
    mounted = true;
    return () => {
      mounted = false;
      invalidatePending();
      unsubscribe?.();
      debouncedFilter?.cancel();
    };
  });

  $: if (rows !== null) {
    invalidatePending();
    if (debouncedFilter && canDebounce() && String(value ?? "").length > 0) {
      debouncedFilter(value, shouldFilterRows);
    } else {
      debouncedFilter?.cancel();
      runFilter(value, shouldFilterRows);
    }
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
  {labelText}
  {tabindex}
  {disabled}
  {selectTextOnFocus}
  {...$$restProps}
  searchClass={[classes, $$restProps.class].filter(Boolean).join(" ")}
  bind:ref
  bind:value
  on:clear
  on:clear={clear}
  on:change
  on:input
  on:search
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
