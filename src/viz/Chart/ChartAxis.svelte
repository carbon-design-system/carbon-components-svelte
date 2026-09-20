<svelte:options immutable />

<script>
  /** @restProps {g} */

  /**
   * Specify which side of the plot the axis sits on.
   * Bottom and top read the x scale, left and right the y scale.
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

  import { getContext } from "svelte";
  import { CHART_CONTEXT } from "./context.js";
  import { thinLabels } from "./model.js";

  /** @type {import("./context.js").ChartContext} */
  const { scales, size } = getContext(CHART_CONTEXT);

  $: horizontal = position === "bottom" || position === "top";
  $: values = horizontal ? $scales.xTicks : $scales.yTicks;
  $: write = format ?? (horizontal ? $scales.xFormat : $scales.yFormat);
  $: labels = values.map((value) => write(value));
  $: positions = values.map((value) =>
    horizontal ? $scales.x.map(value) : $scales.y.map(value),
  );
  // Only a horizontal axis can crowd: its labels run along the axis.
  $: visible = horizontal
    ? thinLabels(positions, labels)
    : values.map(() => true);
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
        transform="translate({position === 'left'
          ? 10
          : $size.width - 4},{(plot.y0 + plot.y1) / 2}) rotate(-90)"
        text-anchor="middle"
      >
        {title}
      </text>
    {/if}
  {/if}
</g>
