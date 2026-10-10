<svelte:options immutable />

<script>
  /** @restProps {div} */

  /** Specify the accessible name of the legend */
  export let label = "Series";

  /** Set to `true` to show the legend even for a single series */
  export let showSingle = false;

  import { getContext } from "svelte";
  import { CHART_CONTEXT } from "./context.js";

  /** @type {import("./context.js").ChartContext} */
  const { groups, toggleSeries, isolateSeries } = getContext(CHART_CONTEXT);
</script>

{#if $groups.length > 1 || (showSingle && $groups.length === 1)}
  <div
    class:bx--viz-legend={true}
    role="group"
    aria-label={label}
    {...$$restProps}
  >
    {#each $groups as group (group.key)}
      <button
        type="button"
        class:bx--viz-legend__item={true}
        class:bx--viz-legend__item--hidden={group.hidden}
        aria-pressed={!group.hidden}
        style:--bx-viz-color={group.color}
        on:click={(event) =>
          event.altKey ? isolateSeries(group.key) : toggleSeries(group.key)}
      >
        <span class:bx--viz-legend__swatch={true}></span>
        <slot series={group.key} hidden={group.hidden}>{group.key}</slot>
      </button>
    {/each}
  </div>
{/if}
