<svelte:options immutable />

<script>
  /**
   * @restProps {g}
   */

  /**
   * Specify which series' y value the badge on the y axis shows. Defaults
   * to the first hovered point.
   * @type {string | number | undefined}
   */
  export let series = undefined;

  /** Set to `false` to leave out the badge on the y axis */
  export let yBadge = true;

  import { getContext } from "svelte";
  import { CHART_CONTEXT } from "./context.js";
  import { labelWidth } from "./label-layout.js";

  const HEIGHT = 18;
  const PAD = 6;

  /** @type {import("./context.js").ChartContext} */
  const { scales, hover } = getContext(CHART_CONTEXT);

  $: point =
    $hover && $hover.points.length > 0
      ? ($hover.points.find((p) => p.series === series) ?? $hover.points[0])
      : null;
  $: xText = $hover ? $scales.xLabel($hover.x) : "";
  $: yText = point
    ? (point.axis === "y2" ? $scales.y2Format : $scales.yFormat)(point.y)
    : "";
  $: xWidth = labelWidth(xText) + PAD;
  $: yWidth = labelWidth(yText) + PAD;
  // The x badge sits in the axis margin under the ruler, the y badge in the
  // margin beside the point, each kept inside the chart.
  $: xBadge =
    $hover && !$scales.horizontal
      ? {
          x: Math.min(
            Math.max($hover.px - xWidth / 2, 0),
            $scales.plot.x1 + $scales.margin.right - xWidth,
          ),
          y: $scales.plot.y1 + 2,
        }
      : null;
  $: yBadgeBox =
    point && yBadge && !$scales.horizontal
      ? {
          x: Math.max($scales.plot.x0 - yWidth - 2, 0),
          y: Math.min(
            Math.max(point.py - HEIGHT / 2, $scales.plot.y0),
            $scales.plot.y1 - HEIGHT,
          ),
        }
      : null;
</script>

{#if $hover}
  <g class:bx--viz-crosshair={true} aria-hidden="true" {...$$restProps}>
    <line
      class:bx--viz-ruler={true}
      x1={$scales.horizontal ? $scales.plot.x0 : $hover.px}
      x2={$scales.horizontal ? $scales.plot.x1 : $hover.px}
      y1={$scales.horizontal ? $hover.px : $scales.plot.y0}
      y2={$scales.horizontal ? $hover.px : $scales.plot.y1}
    />
    {#if point && !$scales.horizontal}
      <line
        class:bx--viz-crosshair__y={true}
        x1={$scales.plot.x0}
        x2={$scales.plot.x1}
        y1={point.py}
        y2={point.py}
      />
    {/if}
    {#if xBadge}
      <g class:bx--viz-crosshair__badge={true}>
        <rect x={xBadge.x} y={xBadge.y} width={xWidth} height={HEIGHT} rx="1" />
        <text
          x={xBadge.x + xWidth / 2}
          y={xBadge.y + HEIGHT - 5}
          text-anchor="middle"
        >
          {xText}
        </text>
      </g>
    {/if}
    {#if yBadgeBox}
      <g class:bx--viz-crosshair__badge={true}>
        <rect
          x={yBadgeBox.x}
          y={yBadgeBox.y}
          width={yWidth}
          height={HEIGHT}
          rx="1"
        />
        <text
          x={yBadgeBox.x + yWidth / 2}
          y={yBadgeBox.y + HEIGHT - 5}
          text-anchor="middle"
        >
          {yText}
        </text>
      </g>
    {/if}
  </g>
{/if}
