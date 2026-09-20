<svelte:options immutable />

<script>
  /** @restProps {svg} */

  /**
   * Values to plot. A missing or non-finite entry (`null`, `NaN`) is a gap:
   * it keeps its slot, so the rest of the series stays aligned.
   * @type {ReadonlyArray<number | null | undefined>}
   */
  export let values = [];

  /**
   * Visual representation of the series.
   * @type {"line" | "bar"}
   */
  export let kind = "line";

  /**
   * Stroke or fill color of the series.
   * Use a semantic name, a categorical index from 1 to 14, a viz token name
   * such as `"cat-03"`, or any CSS color.
   * @type {import("../utils/tokens.js").VizColor}
   */
  export let color = "interactive";

  /** Width of the viewBox, in pixels. */
  export let width = 96;

  /** Height of the viewBox, in pixels. */
  export let height = 24;

  /** Stroke width of the line. Only applies when `kind` is `"line"`. */
  export let strokeWidth = 2;

  /** Set to `true` to shade the area under the line. Only applies when `kind` is `"line"`. */
  export let fill = false;

  /**
   * Override the domain floor instead of deriving it from `values`.
   * @type {number}
   */
  export let min = undefined;

  /**
   * Override the domain ceiling instead of deriving it from `values`.
   * @type {number}
   */
  export let max = undefined;

  /** Space between bars, in pixels. Only applies when `kind` is `"bar"`. */
  export let barGap = 2;

  /**
   * Accessible name for the chart, rendered as `aria-label`. Describe the
   * series ("Requests per minute, last 24 hours") whenever the chart conveys
   * information not stated elsewhere. Leave empty to mark the chart as
   * decorative (`aria-hidden`).
   */
  export let label = "";

  import {
    getSparklineBars,
    getSparklinePoints,
    normalizeSparklineValues,
    toAreaPath,
    toLinePath,
  } from "../utils/sparkline.js";
  import { VIZ_SEMANTIC_COLORS, vizColor } from "../utils/tokens.js";

  $: normalizedValues = normalizeSparklineValues(values);
  // Semantic names resolve in CSS, where themes can restyle them.
  $: semantic = VIZ_SEMANTIC_COLORS.includes(color);
  $: linePadding = strokeWidth / 2;
  $: points =
    kind === "line"
      ? getSparklinePoints(normalizedValues, {
          width,
          height,
          padding: linePadding,
          min,
          max,
        })
      : [];
  $: linePath = kind === "line" ? toLinePath(points) : "";
  $: areaPath =
    kind === "line" && fill ? toAreaPath(points, height - linePadding) : "";
  $: bars =
    kind === "bar"
      ? getSparklineBars(normalizedValues, {
          width,
          height,
          gap: barGap,
          min,
          max,
        })
      : [];
</script>

<svg
  class:bx--sparkline={true}
  class:bx--sparkline--line={kind === "line"}
  class:bx--sparkline--bar={kind === "bar"}
  class:bx--sparkline--fill={kind === "line" && fill}
  class:bx--sparkline--neutral={color === "neutral"}
  class:bx--sparkline--success={color === "success"}
  class:bx--sparkline--error={color === "error"}
  class:bx--sparkline--warning={color === "warning"}
  class:bx--sparkline--info={color === "info"}
  style:--bx-viz-color={semantic ? undefined : vizColor(color)}
  viewBox="0 0 {width} {height}"
  {width}
  {height}
  preserveAspectRatio="none"
  role={label ? "img" : undefined}
  aria-label={label || undefined}
  aria-hidden={label ? undefined : "true"}
  focusable="false"
  {...$$restProps}
>
  {#if kind === "line"}
    {#if fill && areaPath}
      <path class:bx--sparkline__area={true} d={areaPath} />
    {/if}
    {#if linePath}
      <path
        class:bx--sparkline__line={true}
        d={linePath}
        stroke-width={strokeWidth}
        vector-effect="non-scaling-stroke"
      />
    {/if}
  {:else}
    {#each bars as bar, i (i)}
      {#if bar}
        <rect
          class:bx--sparkline__bar={true}
          x={bar.x}
          y={bar.y}
          width={bar.width}
          height={bar.height}
        />
      {/if}
    {/each}
  {/if}
</svg>
