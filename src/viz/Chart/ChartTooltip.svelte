<svelte:options immutable />

<script>
  /**
   * @restProps {div}
   * @slot {{ x: number; xLabel: string; points: Array<{ series: string | number; datum: any; index: number; y: number; color: string; value: string }> }}
   */

  import { getContext } from "svelte";
  import ChartTooltipRow from "./ChartTooltipRow.svelte";
  import { CHART_CONTEXT } from "./context.js";

  /** @type {import("./context.js").ChartContext} */
  const { scales, size, hover, clearHover } = getContext(CHART_CONTEXT);

  $: points = $hover
    ? $hover.points.map((point) => ({
        ...point,
        value: $scales.yFormat(point.y),
      }))
    : [];
  // Sit beside the ruler, on whichever side has more room.
  $: flipped = $hover ? $hover.px > $size.width * 0.6 : false;
  $: top = $hover
    ? Math.max(
        $scales.plot.y0,
        Math.min(...$hover.points.map((point) => point.py), $scales.plot.y1) -
          16,
      )
    : 0;
</script>

<!--
  The chart's live region announces the focused point, so the tooltip is
  hidden from assistive technology instead of announcing every pointer move.
-->
{#if $hover && points.length > 0}
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class:bx--viz-chart-tooltip={true}
    class:bx--viz-chart-tooltip--flipped={flipped}
    aria-hidden="true"
    style:left="{($hover.px / $size.width) * 100}%"
    style:top="{top}px"
    on:pointerleave={clearHover}
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
