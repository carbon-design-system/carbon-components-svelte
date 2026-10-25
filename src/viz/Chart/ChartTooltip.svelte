<svelte:options immutable />

<script>
  /**
   * @restProps {div}
   * @slot {{ x: number; xLabel: string; points: Array<import("./model.js").TooltipPoint>; hidden: number }}
   */

  /**
   * Specify how long a pointer must rest on the chart before the tooltip
   * shows, in milliseconds, so a pointer passing over never flashes it.
   * A key press shows it at once; once shown it follows without delay,
   * stays a moment after the pointer leaves, and shows at once again to a
   * pointer back soon after.
   */
  export let delay = 150;

  /**
   * Specify the order of the rows: as the series are, the top of a stack
   * first, by value, or a comparison of two points.
   * @type {import("./model.js").TooltipSort}
   */
  export let sort = "series";

  /**
   * Specify how many rows show before the rest fold into one "+N more"
   * line. The slot receives the rows that fit, and `hidden` for the count.
   */
  export let maxRows = Number.POSITIVE_INFINITY;

  /**
   * Specify the text of the fold line.
   * @type {(count: number) => string}
   */
  export let moreLabel = (count) => `+${count} more`;

  /** Specify the label of a prior-period row, under `compare` */
  export let priorLabel = "prior";

  import { getContext } from "svelte";
  import { readable } from "svelte/store";
  import ChartTooltipRow from "./ChartTooltipRow.svelte";
  import { CHART_CONTEXT, FACETS_CONTEXT } from "./context.js";
  import {
    estimateTooltipSize,
    freeCorner,
    seriesSegments,
  } from "./tooltip-placement.js";

  /** @type {import("./context.js").ChartContext} */
  const {
    groups,
    scales,
    size,
    hover,
    hoverOrigin,
    banded,
    pinned,
    tooltipTiming: timing,
  } = getContext(CHART_CONTEXT);

  const { shown } = timing;

  $: timing.configure({ delay });
  $: timing.settle($hover, $hoverOrigin);
  // Inside a facet grid the tooltip sits in a corner of the plot that no
  // series crosses, top left first, so the tooltips of a row line up and
  // cover nothing. When every corner is taken it follows the point as
  // usual. The ruler still marks the hovered x.
  /** @type {import("./context.js").FacetsContext | undefined} */
  const facets = getContext(FACETS_CONTEXT);
  const tooltipAlign = facets ? facets.tooltipAlign : readable("follow");

  // The rows in order, then only as many as fit; the slot sees the same.
  $: ordered = orderPoints(all, sort);
  $: points = ordered.slice(0, Math.max(0, maxRows));
  $: hiddenCount = ordered.length - points.length;
  $: ghostOf = new Map(
    $groups
      .filter((group) => group.ghost !== undefined)
      .map((group) => [
        group.key,
        /** @type {string | number} */ (group.ghost),
      ]),
  );
  // A ghost point is the prior period of its base: it rides under that row.
  $: priors = new Map(
    $hover
      ? $hover.points
          .filter((point) => ghostOf.has(point.series))
          .map((point) => [ghostOf.get(point.series), point])
      : [],
  );
  $: all = $hover
    ? $hover.points
        .filter((point) => !ghostOf.has(point.series))
        .map((point) => ({
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

  /**
   * The prior value, and the change from it as a signed percentage.
   * @param {{ y: number; axis?: "y" | "y2" }} point
   * @param {{ y: number; axis?: "y" | "y2" } | undefined} prior
   */
  function priorValue(point, prior) {
    if (!prior) return "";
    const format = prior.axis === "y2" ? $scales.y2Format : $scales.yFormat;
    const written = format(prior.y);
    if (!Number.isFinite(prior.y) || prior.y === 0) return written;
    const change = ((point.y - prior.y) / Math.abs(prior.y)) * 100;
    const sign = change > 0 ? "+" : "";
    return `${written} (${sign}${change.toFixed(1)}%)`;
  }

  /**
   * @param {import("./model.js").TooltipPoint[]} list
   * @param {import("./model.js").TooltipSort} by
   */
  function orderPoints(list, by) {
    if (by === "series") return list;
    const copy = [...list];
    if (by === "stack") return copy.reverse();
    if (by === "value") return copy.sort((a, b) => b.y - a.y);
    if (by === "value-asc") return copy.sort((a, b) => a.y - b.y);
    return copy.sort(by);
  }
</script>

<!--
  The chart's live region announces the focused point, so the tooltip is
  hidden from assistive technology instead of announcing every pointer move.
-->
{#if $hover && $shown && points.length > 0}
  <div
    class:bx--viz-chart-tooltip={true}
    class:bx--viz-chart-tooltip--flipped={flipped}
    class:bx--viz-chart-tooltip--above={above}
    class:bx--viz-chart-tooltip--fixed={spot !== null}
    class:bx--viz-chart-tooltip--pinned={$pinned}
    aria-hidden="true"
    style:left="{(left / $size.width) * 100}%"
    style:top="{top}px"
    {...$$restProps}
  >
    <slot
      x={$hover.x}
      xLabel={$scales.xLabel($hover.x)}
      {points}
      hidden={hiddenCount}
    >
      <div class:bx--viz-chart-tooltip__title={true}>
        {$scales.xLabel($hover.x)}
      </div>
      {#each points as point (point.series)}
        <ChartTooltipRow
          color={point.color}
          label={String(point.series)}
          value={point.value}
        />
        {#if priors.has(point.series)}
          {@const prior = priors.get(point.series)}
          <ChartTooltipRow
            indent
            class="bx--viz-chart-tooltip__prior"
            label={priorLabel}
            value={priorValue(point, prior)}
          />
        {/if}
      {/each}
      {#if hiddenCount > 0}
        <ChartTooltipRow
          indent
          class="bx--viz-chart-tooltip__more"
          label={moreLabel(hiddenCount)}
        />
      {/if}
    </slot>
  </div>
{/if}
