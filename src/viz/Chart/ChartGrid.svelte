<svelte:options immutable />

<script>
  /** @restProps {g} */

  /** Set to `true` to draw a line at every x tick */
  export let x = false;

  /** Set to `false` to hide the line at every y tick */
  export let y = true;

  /** Set to `true` for dashed lines */
  export let dashed = false;

  import { getContext } from "svelte";
  import { CHART_CONTEXT } from "./context.js";

  /** @type {import("./context.js").ChartContext} */
  const { scales } = getContext(CHART_CONTEXT);
</script>

<g
  class:bx--viz-grid={true}
  class:bx--viz-grid--dashed={dashed}
  aria-hidden="true"
  {...$$restProps}
>
  {#if y}
    {#each $scales.yTicks as tick (tick)}
      <line
        class:bx--viz-grid__line={true}
        x1={$scales.plot.x0}
        x2={$scales.plot.x1}
        y1={$scales.y.map(tick)}
        y2={$scales.y.map(tick)}
      />
    {/each}
  {/if}
  {#if x}
    {#each $scales.xTicks as tick (tick)}
      <line
        class:bx--viz-grid__line={true}
        x1={$scales.x.map(tick)}
        x2={$scales.x.map(tick)}
        y1={$scales.plot.y0}
        y2={$scales.plot.y1}
      />
    {/each}
  {/if}
</g>
