<svelte:options immutable />

<script>
  /** @restProps {g} */

  /** Specify the radius of the head, in pixels */
  export let radius = 5;

  /** Specify the gap between slots, as a fraction of the slot */
  export let padding = 0.2;

  /**
   * Specify the series to draw. Defaults to every series, so set it when
   * marks share a chart, as bars and a line do in a combo.
   * @type {ReadonlyArray<string | number>}
   */
  export let series = undefined;

  import { getContext, onMount } from "svelte";
  import { buildBars } from "./bar-geometry.js";
  import { CHART_CONTEXT } from "./context.js";
  import { pickGroups } from "./model.js";

  /** @type {import("./context.js").ChartContext} */
  const { groups, scales, hover, useBand, clip } = getContext(CHART_CONTEXT);

  // A lollipop sits in a slot like a bar, asked for up front so the server
  // render has it.
  const releaseBand = useBand();
  onMount(() => releaseBand);

  // A lollipop is a bar drawn as a stem and a head: the bar geometry already
  // knows its lane, its zero, and which way it grows. Depends on groups and
  // scales only, so hover never rebuilds it.
  $: pops = buildBars(pickGroups($groups, series), $scales, { padding }).map(
    (bar) => {
      const negative = bar.value < 0;
      const middle = $scales.horizontal
        ? bar.y + bar.height / 2
        : bar.x + bar.width / 2;
      const [from, to] = $scales.horizontal
        ? negative
          ? [bar.x + bar.width, bar.x]
          : [bar.x, bar.x + bar.width]
        : negative
          ? [bar.y, bar.y + bar.height]
          : [bar.y + bar.height, bar.y];
      return $scales.horizontal
        ? { ...bar, x1: from, x2: to, y1: middle, y2: middle }
        : { ...bar, x1: middle, x2: middle, y1: from, y2: to };
    },
  );
  $: band =
    $hover && $scales.step
      ? { at: $scales.x.map($hover.x) - $scales.step / 2, size: $scales.step }
      : null;
</script>

<g clip-path={$clip} class:bx--viz-lollipops={true} {...$$restProps}>
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
  {#each pops as pop (pop.key)}
    <g
      class:bx--viz-lollipops__pop={true}
      class:bx--viz-lollipops__pop--dimmed={$hover !== null &&
        $hover.x !== pop.slot}
      style:--bx-viz-color={pop.color}
    >
      <line
        class:bx--viz-lollipops__stem={true}
        x1={pop.x1}
        y1={pop.y1}
        x2={pop.x2}
        y2={pop.y2}
      />
      <circle
        class:bx--viz-lollipops__head={true}
        cx={pop.x2}
        cy={pop.y2}
        r={radius}
      />
    </g>
  {/each}
</g>
