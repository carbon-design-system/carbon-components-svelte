<svelte:options immutable />

<script>
  /**
   * @event {{ dimension: string; value: unknown }} remove Fires when a chip is dismissed, after the filter is removed.
   * @event {null} clear Fires when every filter is cleared from the button.
   */

  /** @restProps {div} */

  /**
   * Specify the dashboard store, from `createDashboard`. The chips show
   * its filters and remove them. Without one there is nothing to show.
   * @type {import("../utils/dashboard.js").Dashboard}
   */
  export let board = createDashboard();

  /**
   * Specify how a dimension is named on a chip: a map, or a function.
   * Defaults to the dimension itself.
   * @type {Record<string, string> | ((dimension: string) => string)}
   */
  export let labels = {};

  /**
   * Specify how a value is written.
   * @type {(value: unknown, dimension: string) => string}
   */
  export let format = (value) => String(value);

  /** Specify the clear-all button's text; empty hides the button */
  export let clearLabel = "Clear filters";

  /** Specify the text when there are no filters; empty renders nothing */
  export let emptyText = "";

  import { createEventDispatcher } from "svelte";
  import Button from "../../Button/Button.svelte";
  import Tag from "../../Tag/Tag.svelte";
  import { createDashboard } from "../utils/dashboard.js";

  const dispatch = createEventDispatcher();

  /** @param {string} dimension */
  function nameOf(dimension) {
    return typeof labels === "function"
      ? labels(dimension)
      : (labels[dimension] ?? dimension);
  }
</script>

{#if $board.filters.length > 0 || emptyText}
  <div class:bx--viz-filter-chips={true} role="group" {...$$restProps}>
    {#each $board.filters as filter (`${filter.dimension}:${String(filter.value)}`)}
      <Tag
        filter
        size="sm"
        title="Remove filter"
        on:close={() => {
          board.unfilter(filter.dimension, filter.value);
          dispatch("remove", filter);
        }}
      >
        {nameOf(filter.dimension)}: {format(filter.value, filter.dimension)}
      </Tag>
    {:else}
      <span class:bx--viz-filter-chips__empty={true}>{emptyText}</span>
    {/each}
    {#if clearLabel && $board.filters.length > 1}
      <Button
        kind="ghost"
        size="small"
        on:click={() => {
          board.clearFilters();
          dispatch("clear", null);
        }}
        >{clearLabel}</Button
      >
    {/if}
  </div>
{/if}
