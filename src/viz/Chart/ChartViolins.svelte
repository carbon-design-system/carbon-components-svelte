<svelte:options immutable />

<script>
  /** @restProps {g} */

  /**
   * Specify the violins: a category on the chart's x scale with its raw
   * values and its quartiles. `boxStats` computes the quartiles.
   * @type {ReadonlyArray<import("./violin-geometry.js").ViolinInput>}
   */
  export let violins = [];

  /** Specify the gap around a violin, as a fraction of the slot */
  export let padding = 0.2;

  /** Specify the widest a violin may grow, in pixels */
  export let maxWidth = 96;

  /**
   * Specify the kernel bandwidth, in data units. Defaults to Silverman's
   * rule of thumb per violin.
   * @type {number}
   */
  export let bandwidth = undefined;

  /** Set to `false` to hide the quartile box and median inside each violin */
  export let inner = true;

  import { getContext, onMount } from "svelte";
  import { CHART_CONTEXT } from "./context.js";
  import { buildViolins } from "./violin-geometry.js";

  /** @type {import("./context.js").ChartContext} */
  const { groups, scales, hover, useBand, includeY, clip } =
    getContext(CHART_CONTEXT);

  const releaseBand = useBand();

  /** @type {Array<() => void>} */
  let releases = [];
  /** @type {[number, number] | null} */
  let registered = null;

  // The curve tapers past the extremes the chart knows about as series.
  // Registering changes the domain, which runs this again: only write when
  // the extent itself moved, or it never settles.
  /** @param {import("./violin-geometry.js").ViolinShape[]} current */
  function include(current) {
    let low = Number.POSITIVE_INFINITY;
    let high = Number.NEGATIVE_INFINITY;
    for (const shape of current) {
      const a = $scales.y.invert(shape.start);
      const b = $scales.y.invert(shape.end);
      low = Math.min(low, a, b);
      high = Math.max(high, a, b);
    }
    /** @type {[number, number] | null} */
    const next = low <= high ? [low, high] : null;
    if (
      next === registered ||
      (next &&
        registered &&
        Math.abs(next[0] - registered[0]) < 1e-9 &&
        Math.abs(next[1] - registered[1]) < 1e-9)
    ) {
      return;
    }
    for (const release of releases) release();
    releases = next ? [includeY(next[0]), includeY(next[1])] : [];
    registered = next;
  }

  // Depends on the violins and the scales only, so hover never rebuilds one.
  $: shapes = buildViolins(violins, $scales, { padding, maxWidth, bandwidth });
  $: include(shapes);
  $: color = $groups.find((group) => !group.hidden)?.color;
  $: flipped = $scales.horizontal;

  onMount(() => () => {
    releaseBand();
    for (const release of releases) release();
  });
</script>

<g
  clip-path={$clip}
  class:bx--viz-violins={true}
  style:--bx-viz-color={color}
  {...$$restProps}
>
  {#each shapes as shape (shape.key)}
    <g
      class:bx--viz-violins__violin={true}
      class:bx--viz-violins__violin--dimmed={$hover !== null &&
        $hover.x !== shape.slot}
    >
      <path class:bx--viz-violins__body={true} d={shape.d} />
      {#if inner}
        <!-- A slim box from the lower to the upper quartile, and a dot at
             the median, so the summary reads inside the shape. -->
        <line
          class:bx--viz-violins__box={true}
          x1={flipped ? shape.q1 : shape.center}
          y1={flipped ? shape.center : shape.q1}
          x2={flipped ? shape.q3 : shape.center}
          y2={flipped ? shape.center : shape.q3}
        />
        <circle
          class:bx--viz-violins__median={true}
          cx={flipped ? shape.median : shape.center}
          cy={flipped ? shape.center : shape.median}
          r="3"
        />
      {/if}
    </g>
  {/each}
</g>
