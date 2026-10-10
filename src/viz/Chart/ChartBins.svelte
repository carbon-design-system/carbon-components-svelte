<svelte:options immutable />

<script>
  /** @restProps {g} */

  /** Specify the gap between neighboring bins, in pixels */
  export let gap = 1;

  import { getContext } from "svelte";
  import { buildBins } from "./bin-geometry.js";
  import { CHART_CONTEXT } from "./context.js";

  /** @type {import("./context.js").ChartContext} */
  const { groups, scales, hover, clip } = getContext(CHART_CONTEXT);

  // Depends on groups and scales only, so hover never rebuilds a bin.
  $: bins = buildBins($groups, $scales, { gap });
</script>

<g
  clip-path={$clip}
  class:bx--viz-bars={true}
  class:bx--viz-bins={true}
  {...$$restProps}
>
  {#each bins as bin (bin.key)}
    <rect
      class:bx--viz-bars__bar={true}
      class:bx--viz-bars__bar--dimmed={$hover !== null && $hover.x !== bin.at}
      x={bin.x}
      y={bin.y}
      width={bin.width}
      height={bin.height}
      style:--bx-viz-color={bin.color}
    />
  {/each}
</g>
