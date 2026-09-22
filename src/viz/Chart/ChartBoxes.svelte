<svelte:options immutable />

<script>
  /** @restProps {g} */

  /**
   * Specify the boxes: a category on the chart's x scale with its quartiles,
   * whisker ends, and outliers. `boxStats` computes them from raw values.
   * @type {ReadonlyArray<import("./box-geometry.js").BoxInput>}
   */
  export let boxes = [];

  /** Specify the gap around a box, as a fraction of the slot */
  export let padding = 0.4;

  /** Specify the widest a box may grow, in pixels */
  export let maxBoxWidth = 64;

  import { getContext, onMount } from "svelte";
  import { buildBoxes } from "./box-geometry.js";
  import { CHART_CONTEXT } from "./context.js";

  /** @type {import("./context.js").ChartContext} */
  const { groups, scales, hover, useBand, includeY, clip } =
    getContext(CHART_CONTEXT);

  const releaseBand = useBand();

  /** @type {Array<() => void>} */
  let releases = [];
  /** @type {[number, number] | null} */
  let registered = null;

  // Outliers and whisker ends lie beyond the quartiles the chart knows about.
  // Registering changes the domain, which runs this again: only write when
  // the extent itself moved, or it never settles.
  /** @param {typeof boxes} current */
  function include(current) {
    let low = Number.POSITIVE_INFINITY;
    let high = Number.NEGATIVE_INFINITY;
    for (const box of current) {
      for (const value of [box.whiskerLow, box.whiskerHigh, ...box.outliers]) {
        if (!Number.isFinite(value)) continue;
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

  $: include(boxes);
  // Depends on the boxes and the scales only, so hover never rebuilds a box.
  $: shapes = buildBoxes(boxes, $scales, { padding, maxBoxWidth });
  $: color = $groups.find((group) => !group.hidden)?.color;
  $: flipped = $scales.horizontal;

  onMount(() => () => {
    releaseBand();
    for (const release of releases) release();
  });
</script>

<g
  clip-path={$clip}
  class:bx--viz-boxes={true}
  style:--bx-viz-color={color}
  {...$$restProps}
>
  {#each shapes as shape (shape.key)}
    {@const half = shape.width / 2}
    {@const cap = shape.width / 4}
    <g
      class:bx--viz-boxes__box={true}
      class:bx--viz-boxes__box--dimmed={$hover !== null &&
        $hover.x !== shape.slot}
    >
      <!-- Whiskers, from each end of the box out to its cap. -->
      {#each [[shape.q1, shape.whiskerLow], [shape.q3, shape.whiskerHigh]] as [from, to], i (i)}
        <line
          class:bx--viz-boxes__whisker={true}
          x1={flipped ? from : shape.center}
          y1={flipped ? shape.center : from}
          x2={flipped ? to : shape.center}
          y2={flipped ? shape.center : to}
        />
        <line
          class:bx--viz-boxes__whisker={true}
          x1={flipped ? to : shape.center - cap}
          y1={flipped ? shape.center - cap : to}
          x2={flipped ? to : shape.center + cap}
          y2={flipped ? shape.center + cap : to}
        />
      {/each}
      <rect
        class:bx--viz-boxes__range={true}
        x={flipped ? shape.boxStart : shape.center - half}
        y={flipped ? shape.center - half : shape.boxStart}
        width={flipped ? shape.boxLength : shape.width}
        height={flipped ? shape.width : shape.boxLength}
      />
      <line
        class:bx--viz-boxes__median={true}
        x1={flipped ? shape.median : shape.center - half}
        y1={flipped ? shape.center - half : shape.median}
        x2={flipped ? shape.median : shape.center + half}
        y2={flipped ? shape.center + half : shape.median}
      />
      {#each shape.outliers as at, i (i)}
        <circle
          class:bx--viz-boxes__outlier={true}
          cx={flipped ? at : shape.center}
          cy={flipped ? shape.center : at}
          r="3"
        />
      {/each}
    </g>
  {/each}
</g>
