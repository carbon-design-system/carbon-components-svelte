<svelte:options immutable />

<script>
  /** @restProps {g} */

  /**
   * Specify the x value to mark. Unlike `ChartThreshold`, a marker never
   * grows the domain: outside it, nothing is drawn.
   * @type {number | Date}
   */
  export let x;

  /** Specify the label, drawn at the top of the rule */
  export let label = "";

  import { getContext, onMount } from "svelte";
  import { CHART_CONTEXT } from "./context.js";

  /** @type {import("./context.js").ChartContext} */
  const { scales, reserveMargin } = getContext(CHART_CONTEXT);

  /** @type {(() => void) | undefined} */
  let release;
  let reservedSide = "";

  // The label sits outside the plot. Reserving rebuilds the scales, which
  // runs this again: only act on a change.
  /**
   * @param {boolean} needed
   * @param {boolean} horizontal
   */
  function reserve(needed, horizontal) {
    const side = needed ? (horizontal ? "right" : "top") : "";
    if (side === reservedSide) return;
    release?.();
    release = side ? reserveMargin(side, side === "top" ? 14 : 32) : undefined;
    reservedSide = side;
  }

  $: reserve(Boolean(label), $scales.horizontal);
  $: at = $scales.x.map(x);
  $: [from, to] = $scales.horizontal
    ? [$scales.plot.y0, $scales.plot.y1]
    : [$scales.plot.x0, $scales.plot.x1];
  $: inside = Number.isFinite(at) && at >= from - 0.5 && at <= to + 0.5;

  onMount(() => () => release?.());
</script>

{#if inside}
  <g class:bx--viz-marker={true} aria-hidden="true" {...$$restProps}>
    <line
      class:bx--viz-marker__line={true}
      x1={$scales.horizontal ? $scales.plot.x0 : at}
      x2={$scales.horizontal ? $scales.plot.x1 : at}
      y1={$scales.horizontal ? at : $scales.plot.y0}
      y2={$scales.horizontal ? at : $scales.plot.y1}
    />
    {#if label}
      <text
        class:bx--viz-marker__label={true}
        x={$scales.horizontal ? $scales.plot.x1 + 4 : at}
        y={$scales.horizontal ? at : $scales.plot.y0 - 6}
        dy={$scales.horizontal ? "0.32em" : undefined}
        text-anchor={$scales.horizontal ? "start" : "middle"}
      >
        {label}
      </text>
    {/if}
  </g>
{/if}
