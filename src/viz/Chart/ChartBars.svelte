<svelte:options immutable />

<script>
  /** @restProps {g} */

  /**
   * Specify how series share a slot.
   * `"normalized"` expects the chart's `yDomain` to be `[0, 1]`.
   * @type {"grouped" | "stacked" | "normalized"}
   */
  export let mode = "grouped";

  /** Specify the gap between slots, as a fraction of the slot */
  export let padding = 0.2;

  /** Specify the widest a bar may grow, in pixels */
  export let maxBarWidth = 48;

  import { getContext, onMount } from "svelte";
  import { buildBars, stackedExtent } from "./bar-geometry.js";
  import { CHART_CONTEXT } from "./context.js";

  /** @type {import("./context.js").ChartContext} */
  const { groups, scales, hover, useBand, includeY } =
    getContext(CHART_CONTEXT);

  // Bars need one slot per x, asked for up front so the server render has it.
  const releaseBand = useBand();

  /** @type {Array<() => void>} */
  let releases = [];
  /** @type {[number, number] | null} */
  let registered = null;

  // A stack is taller than any one value, so the domain has to know about it.
  // Registering changes the domain, which rebuilds the groups, which runs
  // this again: only write when the extent itself moved, or it never settles.
  /**
   * @param {typeof $groups} current
   * @param {typeof mode} currentMode
   */
  function include(current, currentMode) {
    const next = currentMode === "stacked" ? stackedExtent(current) : null;
    if (
      next === registered ||
      (next &&
        registered &&
        next[0] === registered[0] &&
        next[1] === registered[1])
    ) {
      return;
    }
    for (const release of releases) release();
    releases = next ? [includeY(next[0]), includeY(next[1])] : [];
    registered = next;
  }

  $: include($groups, mode);
  // Depends on groups and scales only, so hover never rebuilds a bar.
  $: bars = buildBars($groups, $scales, { mode, padding, maxBarWidth });
  $: band =
    $hover && $scales.step
      ? {
          x: $scales.x.map($hover.x) - $scales.step / 2,
          width: $scales.step,
        }
      : null;

  onMount(() => () => {
    releaseBand();
    for (const release of releases) release();
  });
</script>

<g class:bx--viz-bars={true} {...$$restProps}>
  {#if band}
    <rect
      class:bx--viz-bars__band={true}
      x={band.x}
      y={$scales.plot.y0}
      width={band.width}
      height={$scales.plot.y1 - $scales.plot.y0}
      aria-hidden="true"
    />
  {/if}
  {#each bars as bar (bar.key)}
    <rect
      class:bx--viz-bars__bar={true}
      class:bx--viz-bars__bar--dimmed={$hover !== null &&
        $hover.x !== bar.slot}
      x={bar.x}
      y={bar.y}
      width={bar.width}
      height={bar.height}
      style:--bx-viz-color={bar.color}
    />
  {/each}
</g>
