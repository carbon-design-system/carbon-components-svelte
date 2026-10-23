<svelte:options immutable />

<script>
  /** @restProps {g} */

  /**
   * Specify the candles: a category on the chart's x scale with its open,
   * high, low, and close.
   * @type {ReadonlyArray<import("./candle-geometry.js").CandleInput>}
   */
  export let candles = [];

  /** Specify the gap around a body, as a fraction of the slot */
  export let padding = 0.3;

  /** Specify the widest a body may grow, in pixels */
  export let maxBodyWidth = 24;

  /**
   * Set to `true` to draw a rising candle hollow, so direction never rests
   * on color alone.
   */
  export let hollow = true;

  /**
   * Specify the color of a rising candle.
   * @type {import("../utils/tokens.js").VizColor}
   */
  export let upColor = "success";

  /**
   * Specify the color of a falling candle.
   * @type {import("../utils/tokens.js").VizColor}
   */
  export let downColor = "error";

  import { getContext, onMount } from "svelte";
  import { vizColor } from "../utils/tokens.js";
  import { buildCandles } from "./candle-geometry.js";
  import { CHART_CONTEXT } from "./context.js";

  /** @type {import("./context.js").ChartContext} */
  const { scales, hover, useBand, includeY, clip } = getContext(CHART_CONTEXT);

  const releaseBand = useBand();

  /** @type {Array<() => void>} */
  let releases = [];
  /** @type {[number, number] | null} */
  let registered = null;

  // Wicks reach past the open and close the chart knows about as series.
  // Registering changes the domain, which runs this again: only write when
  // the extent itself moved, or it never settles.
  /** @param {typeof candles} current */
  function include(current) {
    let low = Number.POSITIVE_INFINITY;
    let high = Number.NEGATIVE_INFINITY;
    for (const candle of current) {
      if (Number.isFinite(candle.low) && candle.low < low) low = candle.low;
      if (Number.isFinite(candle.high) && candle.high > high)
        high = candle.high;
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

  $: include(candles);
  // Depends on the candles and the scales only, so hover never rebuilds one.
  $: shapes = buildCandles(candles, $scales, { padding, maxBodyWidth });
  $: flipped = $scales.horizontal;
  $: rising = vizColor(upColor);
  $: falling = vizColor(downColor);

  onMount(() => () => {
    releaseBand();
    for (const release of releases) release();
  });
</script>

<g
  clip-path={$clip}
  class:bx--viz-candles={true}
  style:--bx-viz-up={rising}
  style:--bx-viz-down={falling}
  {...$$restProps}
>
  {#each shapes as shape (shape.key)}
    {@const half = shape.width / 2}
    <g
      class:bx--viz-candles__candle={true}
      class:bx--viz-candles__candle--up={shape.up}
      class:bx--viz-candles__candle--down={shape.down}
      class:bx--viz-candles__candle--hollow={hollow && shape.up}
      class:bx--viz-candles__candle--dimmed={$hover !== null &&
        $hover.x !== shape.slot}
    >
      <line
        class:bx--viz-candles__wick={true}
        x1={flipped ? shape.wickLow : shape.center}
        y1={flipped ? shape.center : shape.wickLow}
        x2={flipped ? shape.wickHigh : shape.center}
        y2={flipped ? shape.center : shape.wickHigh}
      />
      <rect
        class:bx--viz-candles__body={true}
        x={flipped ? shape.bodyStart : shape.center - half}
        y={flipped ? shape.center - half : shape.bodyStart}
        width={flipped ? shape.bodyLength : shape.width}
        height={flipped ? shape.width : shape.bodyLength}
      />
    </g>
  {/each}
</g>
