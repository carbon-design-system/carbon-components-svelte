<svelte:options immutable />

<script>
  /** @restProps {g} */

  /**
   * Specify which side of the plot the axis sits on.
   * Bottom and top read the x scale, left and right the y scale. A
   * horizontal chart swaps them. When the chart has a secondary y axis, the
   * far side (right, or top when horizontal) reads that instead.
   * @type {"bottom" | "left" | "top" | "right"}
   */
  export let position = "bottom";

  /** Specify the axis title */
  export let title = "";

  /**
   * Override the tick label format for this axis.
   * @type {(value: number) => string}
   */
  export let format = undefined;

  /** Set to `true` to hide the axis line */
  export let hideLine = false;

  /** Set to `true` to hide the tick labels */
  export let hideLabels = false;

  import { getContext, onMount } from "svelte";
  import { CHART_CONTEXT } from "./context.js";
  import { thinLabels } from "./model.js";

  /** @type {import("./context.js").ChartContext} */
  const { scales, size, reserveMargin } = getContext(CHART_CONTEXT);

  const TITLE_SPACE = 20;

  /** @type {(() => void) | undefined} */
  let release;

  // A title needs room beyond the tick labels, on this axis's side.
  /** @param {boolean} titled */
  function reserve(titled) {
    release?.();
    release = titled ? reserveMargin(position, TITLE_SPACE) : undefined;
  }

  $: reserve(Boolean(title));

  const ROW_HEIGHT = 16;

  /** @param {ReadonlyArray<number>} at */
  function thinRows(at) {
    if (at.length < 2) return at.map(() => true);
    const spacing = Math.abs(at[at.length - 1] - at[0]) / (at.length - 1);
    const every =
      spacing > 0 ? Math.max(1, Math.ceil(ROW_HEIGHT / spacing)) : 1;
    return at.map((_, index) => index % every === 0);
  }

  onMount(() => () => release?.());

  $: horizontal = position === "bottom" || position === "top";
  $: readsX = horizontal !== $scales.horizontal;
  $: secondary =
    !readsX &&
    $scales.y2 !== null &&
    (position === "right" || position === "top");
  $: values = readsX
    ? $scales.xTicks
    : secondary
      ? $scales.y2Ticks
      : $scales.yTicks;
  $: write =
    format ??
    (readsX ? $scales.xFormat : secondary ? $scales.y2Format : $scales.yFormat);
  $: labels = values.map((value) => write(value));
  $: positions = values.map((value) =>
    readsX
      ? $scales.x.map(value)
      : secondary && $scales.y2
        ? $scales.y2.map(value)
        : $scales.y.map(value),
  );
  // Labels run along a horizontal axis, so their width can crowd it. Down a
  // vertical axis only their height can, which matters once it holds the x
  // scale of a horizontal chart.
  $: visible = horizontal ? thinLabels(positions, labels) : thinRows(positions);
  $: plot = $scales.plot;
  $: edge =
    position === "bottom"
      ? plot.y1
      : position === "top"
        ? plot.y0
        : position === "left"
          ? plot.x0
          : plot.x1;
</script>

<!-- The table view and the chart's announcements carry the data. -->
<g
  class:bx--viz-axis={true}
  class:bx--viz-axis--bottom={position === "bottom"}
  class:bx--viz-axis--top={position === "top"}
  class:bx--viz-axis--left={position === "left"}
  class:bx--viz-axis--right={position === "right"}
  aria-hidden="true"
  {...$$restProps}
>
  {#if !hideLine}
    {#if horizontal}
      <line
        class:bx--viz-axis__line={true}
        x1={plot.x0}
        x2={plot.x1}
        y1={edge}
        y2={edge}
      />
    {:else}
      <line
        class:bx--viz-axis__line={true}
        x1={edge}
        x2={edge}
        y1={plot.y0}
        y2={plot.y1}
      />
    {/if}
  {/if}
  {#if !hideLabels}
    {#each values as value, i (value)}
      {#if visible[i]}
        {#if horizontal}
          <text
            class:bx--viz-axis__label={true}
            x={positions[i]}
            y={position === "bottom" ? edge + 18 : edge - 8}
            text-anchor="middle"
          >
            {labels[i]}
          </text>
        {:else}
          <text
            class:bx--viz-axis__label={true}
            x={position === "left" ? edge - 8 : edge + 8}
            y={positions[i]}
            dy="0.32em"
            text-anchor={position === "left" ? "end" : "start"}
          >
            {labels[i]}
          </text>
        {/if}
      {/if}
    {/each}
  {/if}
  {#if title}
    {#if horizontal}
      <text
        class:bx--viz-axis__title={true}
        x={(plot.x0 + plot.x1) / 2}
        y={position === "bottom" ? $size.height - 2 : 10}
        text-anchor="middle"
      >
        {title}
      </text>
    {:else}
      <text
        class:bx--viz-axis__title={true}
        transform="translate({position === "left"
          ? 10
          : $size.width - 4},{(plot.y0 + plot.y1) / 2}) rotate(-90)"
        text-anchor="middle"
      >
        {title}
      </text>
    {/if}
  {/if}
</g>
