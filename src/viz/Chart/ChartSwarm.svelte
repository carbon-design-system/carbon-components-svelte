<svelte:options immutable />

<script>
  /** @restProps {g} */

  /**
   * Specify the swarms: a category on the chart's x scale with its raw
   * values, one dot each.
   * @type {ReadonlyArray<import("./swarm-geometry.js").SwarmInput>}
   */
  export let swarms = [];

  /** Specify the radius of a dot, in pixels */
  export let radius = 3;

  /** Specify the gap around a swarm, as a fraction of the slot */
  export let padding = 0.2;

  import { getContext, onMount } from "svelte";
  import { CHART_CONTEXT } from "./context.js";
  import { buildSwarms } from "./swarm-geometry.js";

  /** @type {import("./context.js").ChartContext} */
  const { groups, scales, hover, useBand, includeY, clip } =
    getContext(CHART_CONTEXT);

  const releaseBand = useBand();

  /** @type {Array<() => void>} */
  let releases = [];
  /** @type {[number, number] | null} */
  let registered = null;

  // Every value must fit, beyond the summary the chart knows about as
  // series. Only write when the extent itself moved, or it never settles.
  /** @param {typeof swarms} current */
  function include(current) {
    let low = Number.POSITIVE_INFINITY;
    let high = Number.NEGATIVE_INFINITY;
    for (const swarm of current) {
      for (const value of swarm.values) {
        if (typeof value !== "number" || !Number.isFinite(value)) continue;
        if (value < low) low = value;
        if (value > high) high = value;
      }
    }
    /** @type {[number, number] | null} */
    const next = low <= high ? [low, high] : null;
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

  $: include(swarms);
  // Depends on the swarms and the scales only, so hover never places a dot.
  $: shapes = buildSwarms(swarms, $scales, { radius, padding });
  $: color = $groups.find((group) => !group.hidden)?.color;
  $: flipped = $scales.horizontal;

  onMount(() => () => {
    releaseBand();
    for (const release of releases) release();
  });
</script>

<g
  clip-path={$clip}
  class:bx--viz-swarm={true}
  style:--bx-viz-color={color}
  {...$$restProps}
>
  {#each shapes as shape (shape.key)}
    <g
      class:bx--viz-swarm__group={true}
      class:bx--viz-swarm__group--dimmed={$hover !== null &&
        $hover.x !== shape.slot}
    >
      {#each shape.dots as dot (dot.index)}
        <circle
          class:bx--viz-swarm__dot={true}
          cx={flipped ? dot.along : dot.across}
          cy={flipped ? dot.across : dot.along}
          r={shape.radius}
        />
      {/each}
    </g>
  {/each}
</g>
