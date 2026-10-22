<svelte:options immutable />

<script>
  /**
   * @restProps {div}
   * @slot {{ x: number; xLabel: string; points: Array<{ series: string | number; datum: any; index: number; y: number; color: string; value: string }> }}
   */

  /**
   * Specify how long a pointer must rest on the chart before the tooltip
   * shows, in milliseconds, so a pointer passing over never flashes it.
   * A key press shows it at once, and once shown it follows without delay.
   */
  export let delay = 150;

  import { getContext, onMount } from "svelte";
  import { readable } from "svelte/store";
  import ChartTooltipRow from "./ChartTooltipRow.svelte";
  import { CHART_CONTEXT, FACETS_CONTEXT } from "./context.js";
  import {
    estimateTooltipSize,
    freeCorner,
    seriesSegments,
  } from "./tooltip-placement.js";

  /** @type {import("./context.js").ChartContext} */
  const { groups, scales, size, hover, hoverOrigin, banded } =
    getContext(CHART_CONTEXT);

  let shown = false;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;

  /**
   * @param {unknown} current
   * @param {"pointer" | "keyboard" | "sync"} origin
   */
  function settle(current, origin) {
    if (!current) {
      clearTimeout(timer);
      timer = undefined;
      shown = false;
      return;
    }
    if (shown || origin === "keyboard" || delay <= 0) {
      shown = true;
      return;
    }
    if (timer === undefined) {
      timer = setTimeout(() => {
        timer = undefined;
        shown = $hover !== null;
      }, delay);
    }
  }

  $: settle($hover, $hoverOrigin);
  onMount(() => () => clearTimeout(timer));
  // Inside a facet grid the tooltip sits in a corner of the plot that no
  // series crosses, top left first, so the tooltips of a row line up and
  // cover nothing. When every corner is taken it follows the point as
  // usual. The ruler still marks the hovered x.
  /** @type {import("./context.js").FacetsContext | undefined} */
  const facets = getContext(FACETS_CONTEXT);
  const tooltipAlign = facets ? facets.tooltipAlign : readable("follow");

  $: points = $hover
    ? $hover.points.map((point) => ({
        ...point,
        value: (point.axis === "y2" ? $scales.y2Format : $scales.yFormat)(
          point.y,
        ),
      }))
    : [];
  // `px` runs along the x scale and `py` along the y scale. A horizontal
  // chart draws the x scale down the plot, so the tooltip sits under the
  // hovered row, or over it in the lower half, instead of beside a ruler.
  $: sideways = $scales.horizontal;
  $: half = ($scales.step ?? 0) / 2 + 4;
  $: fixed = $tooltipAlign === "fixed";
  // Depends on the data and the scales only, so hover never rebuilds it.
  $: segments = fixed
    ? seriesSegments($groups, $scales, { toBaseline: $banded })
    : [];
  // The box may sit over the margins: a facet's plot alone is often too
  // small to hold it, and covering a tick beats covering the data.
  $: spot =
    fixed && $hover
      ? freeCorner(
          { x0: 0, y0: 0, x1: $size.width, y1: $size.height },
          estimateTooltipSize(
            $scales.xLabel($hover.x),
            points.map((point) => ({
              label: String(point.series),
              value: point.value,
            })),
          ),
          segments,
          4,
        )
      : null;
  $: atTop = spot !== null;
  $: above = $hover
    ? !atTop && sideways && $hover.px > ($scales.plot.y0 + $scales.plot.y1) / 2
    : false;
  $: left = $hover
    ? spot
      ? spot.x
      : sideways
        ? $scales.plot.x0
        : $hover.px
    : 0;
  // Sit beside the ruler, on whichever side has more room, and never flip
  // into a wall: past the middle it moves left only when it fits there.
  $: estimate = $hover
    ? estimateTooltipSize(
        $scales.xLabel($hover.x),
        points.map((point) => ({
          label: String(point.series),
          value: point.value,
        })),
      )
    : { width: 0, height: 0 };
  $: flipped =
    !sideways &&
    !atTop &&
    left > $size.width * 0.6 &&
    left - estimate.width - 12 >= 0;
  $: top = $hover
    ? spot
      ? spot.y
      : sideways
        ? $hover.px + (above ? -half : half)
        : Math.max(
            $scales.plot.y0,
            Math.min(
              ...$hover.points.map((point) => point.py),
              $scales.plot.y1,
            ) - 16,
          )
    : 0;
</script>

<!--
  The chart's live region announces the focused point, so the tooltip is
  hidden from assistive technology instead of announcing every pointer move.
-->
{#if $hover && shown && points.length > 0}
  <div
    class:bx--viz-chart-tooltip={true}
    class:bx--viz-chart-tooltip--flipped={flipped}
    class:bx--viz-chart-tooltip--above={above}
    class:bx--viz-chart-tooltip--fixed={spot !== null}
    aria-hidden="true"
    style:left="{(left / $size.width) * 100}%"
    style:top="{top}px"
    {...$$restProps}
  >
    <slot x={$hover.x} xLabel={$scales.xLabel($hover.x)} {points}>
      <div class:bx--viz-chart-tooltip__title={true}>
        {$scales.xLabel($hover.x)}
      </div>
      {#each points as point (point.series)}
        <ChartTooltipRow
          color={point.color}
          label={String(point.series)}
          value={point.value}
        />
      {/each}
    </slot>
  </div>
{/if}
