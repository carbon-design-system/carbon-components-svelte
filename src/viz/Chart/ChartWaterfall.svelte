<svelte:options immutable />

<script>
  /** @restProps {g} */

  /**
   * Specify the categories drawn as subtotals: their bar rises from zero
   * to the running total, and their own value is ignored.
   * @type {ReadonlyArray<string>}
   */
  export let totals = [];

  /** Specify the gap between slots, as a fraction of the slot */
  export let padding = 0.3;

  /** Specify the widest a bar may grow, in pixels */
  export let maxBarWidth = 64;

  /** Set to `false` to hide the connectors between bars */
  export let connectors = true;

  import { getContext, onMount } from "svelte";
  import { CHART_CONTEXT } from "./context.js";
  import { buildWaterfall } from "./waterfall-geometry.js";

  /** @type {import("./context.js").ChartContext} */
  const { groups, scales, hover, useBand, includeY, clip } =
    getContext(CHART_CONTEXT);

  const releaseBand = useBand();

  /** @type {Array<() => void>} */
  let releases = [];
  /** @type {[number, number] | null} */
  let registered = null;

  // The running total climbs past any one value, so the domain has to know.
  // Registering changes the domain, which runs this again: only write when
  // the extent itself moved, or it never settles.
  /** @param {[number, number] | null} next */
  function include(next) {
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

  // Depends on groups and scales only, so hover never rebuilds a bar.
  $: waterfall = buildWaterfall($groups, $scales, {
    totals,
    padding,
    maxBarWidth,
  });
  $: include(waterfall.extent);
  $: band =
    $hover && $scales.step
      ? { at: $scales.x.map($hover.x) - $scales.step / 2, size: $scales.step }
      : null;

  onMount(() => () => {
    releaseBand();
    for (const release of releases) release();
  });
</script>

<g clip-path={$clip} class:bx--viz-waterfall={true} {...$$restProps}>
  {#if band}
    <rect
      class:bx--viz-bars__band={true}
      x={$scales.horizontal ? $scales.plot.x0 : band.at}
      y={$scales.horizontal ? band.at : $scales.plot.y0}
      width={$scales.horizontal ? $scales.plot.x1 - $scales.plot.x0 : band.size}
      height={$scales.horizontal
        ? band.size
        : $scales.plot.y1 - $scales.plot.y0}
      aria-hidden="true"
    />
  {/if}
  {#if connectors}
    {#each waterfall.connectors as line (line.key)}
      <line
        class:bx--viz-waterfall__connector={true}
        x1={line.x1}
        y1={line.y1}
        x2={line.x2}
        y2={line.y2}
      />
    {/each}
  {/if}
  {#each waterfall.bars as bar (bar.key)}
    <rect
      class:bx--viz-waterfall__bar={true}
      class:bx--viz-waterfall__bar--increase={bar.kind === "increase"}
      class:bx--viz-waterfall__bar--decrease={bar.kind === "decrease"}
      class:bx--viz-waterfall__bar--total={bar.kind === "total"}
      class:bx--viz-bars__bar--dimmed={$hover !== null && $hover.x !== bar.slot}
      x={bar.x}
      y={bar.y}
      width={bar.width}
      height={bar.height}
    />
  {/each}
</g>
