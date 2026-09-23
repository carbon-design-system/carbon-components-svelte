<svelte:options immutable />

<script>
  /** @restProps {g} */

  /** Specify the radius, in pixels, when there is no `size` */
  export let radius = 4;

  /**
   * Specify how to read a size from a row, for a bubble chart: a key or a
   * function. The circle's area follows the value.
   * @type {string | ((row: any, index: number) => unknown)}
   */
  export let size = undefined;

  /**
   * Specify the smallest and largest radius, in pixels, when `size` is set.
   * @type {readonly [number, number]}
   */
  export let sizeRange = [4, 24];

  /**
   * Specify the series to draw. Defaults to every series, so set it when
   * marks share a chart, as bars and a line do in a combo.
   * @type {ReadonlyArray<string | number>}
   */
  export let series = undefined;

  /**
   * Set to `true` to draw nothing while still answering hover and the
   * keyboard, as under a density layer that stands in for the points.
   */
  export let hidden = false;

  import { getContext, onMount } from "svelte";
  import { toAccessor } from "../utils/accessor.js";
  import { CHART_CONTEXT } from "./context.js";
  import { pickGroups } from "./model.js";
  import { buildPoints } from "./point-geometry.js";

  /** @type {import("./context.js").ChartContext} */
  const { groups, scales, hover, usePointHover, clip } =
    getContext(CHART_CONTEXT);

  // Points rarely share an x, so hover follows the nearest point instead.
  const release = usePointHover();
  onMount(() => release);

  $: sizeOf = size === undefined ? undefined : toAccessor(size);
  // Depends on groups and scales only, so hover never rebuilds a circle.
  $: circles = buildPoints(pickGroups($groups, series), $scales, {
    radius,
    size: sizeOf,
    sizeRange,
  });
  $: active =
    $hover && $hover.points.length > 0
      ? `${$hover.points[0].series}:${$hover.points[0].index}`
      : null;
</script>

<g
  clip-path={$clip}
  class:bx--viz-points={true}
  class:bx--viz-points--sized={size !== undefined}
  {...$$restProps}
>
  {#each circles as circle (circle.key)}
    {#if !hidden || circle.key === active}
      <circle
        class:bx--viz-points__point={true}
        class:bx--viz-points__point--active={circle.key === active}
        class:bx--viz-points__point--dimmed={!hidden &&
          active !== null &&
          circle.key !== active}
        cx={circle.cx}
        cy={circle.cy}
        r={circle.r}
        style:--bx-viz-color={circle.color}
      />
    {/if}
  {/each}
</g>
