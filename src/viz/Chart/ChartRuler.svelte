<svelte:options immutable />

<script>
  /** @restProps {line} */

  import { getContext } from "svelte";
  import { CHART_CONTEXT } from "./context.js";

  /** @type {import("./context.js").ChartContext} */
  const { scales, hover } = getContext(CHART_CONTEXT);
</script>

{#if $hover}
  <line
    class:bx--viz-ruler={true}
    x1={$scales.horizontal ? $scales.plot.x0 : $hover.px}
    x2={$scales.horizontal ? $scales.plot.x1 : $hover.px}
    y1={$scales.horizontal ? $hover.px : $scales.plot.y0}
    y2={$scales.horizontal ? $hover.px : $scales.plot.y1}
    aria-hidden="true"
    {...$$restProps}
  />
{/if}
