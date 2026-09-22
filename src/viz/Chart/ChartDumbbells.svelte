<svelte:options immutable />

<script>
  /** @restProps {g} */

  /**
   * Specify the series the bar starts at. Defaults to the first visible series.
   * @type {string | number}
   */
  export let from = undefined;

  /**
   * Specify the series the bar ends at. Defaults to the second visible series.
   * @type {string | number}
   */
  export let to = undefined;

  /** Specify the radius of the dots, in pixels */
  export let radius = 5;

  import { getContext, onMount } from "svelte";
  import { CHART_CONTEXT } from "./context.js";
  import { buildDumbbells } from "./dumbbell-geometry.js";

  /** @type {import("./context.js").ChartContext} */
  const { groups, scales, hover, useBand } = getContext(CHART_CONTEXT);

  // A dumbbell sits in a slot like a bar, asked for up front so the server
  // render has it.
  const releaseBand = useBand();
  onMount(() => releaseBand);

  // Depends on groups and scales only, so hover never rebuilds a pair.
  $: pairs = buildDumbbells($groups, $scales, { from, to });
  $: flipped = $scales.horizontal;
  $: band =
    $hover && $scales.step
      ? { at: $scales.x.map($hover.x) - $scales.step / 2, size: $scales.step }
      : null;
</script>

<g class:bx--viz-dumbbells={true} {...$$restProps}>
  {#if band}
    <rect
      class:bx--viz-bars__band={true}
      x={flipped ? $scales.plot.x0 : band.at}
      y={flipped ? band.at : $scales.plot.y0}
      width={flipped ? $scales.plot.x1 - $scales.plot.x0 : band.size}
      height={flipped ? band.size : $scales.plot.y1 - $scales.plot.y0}
      aria-hidden="true"
    />
  {/if}
  {#each pairs as pair (pair.key)}
    <g
      class:bx--viz-dumbbells__pair={true}
      class:bx--viz-dumbbells__pair--up={pair.change > 0}
      class:bx--viz-dumbbells__pair--down={pair.change < 0}
      class:bx--viz-dumbbells__pair--dimmed={$hover !== null &&
        $hover.x !== pair.slot}
    >
      <line
        class:bx--viz-dumbbells__bar={true}
        x1={flipped ? pair.start : pair.along}
        y1={flipped ? pair.along : pair.start}
        x2={flipped ? pair.end : pair.along}
        y2={flipped ? pair.along : pair.end}
      />
      <circle
        class:bx--viz-dumbbells__dot={true}
        class:bx--viz-dumbbells__dot--from={true}
        cx={flipped ? pair.start : pair.along}
        cy={flipped ? pair.along : pair.start}
        r={radius}
        style:--bx-viz-color={pair.fromColor}
      />
      <circle
        class:bx--viz-dumbbells__dot={true}
        class:bx--viz-dumbbells__dot--to={true}
        cx={flipped ? pair.end : pair.along}
        cy={flipped ? pair.along : pair.end}
        r={radius}
        style:--bx-viz-color={pair.toColor}
      />
    </g>
  {/each}
</g>
