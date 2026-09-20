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
  // `px` runs along the x scale and `py` along the y scale. A horizontal
  // chart draws the x scale down the plot, so the tooltip sits under the
  // hovered row, or over it in the lower half, instead of beside a ruler.
  $: sideways = $scales.horizontal;
  $: half = ($scales.step ?? 0) / 2 + 4;
  $: above = $hover
    ? sideways && $hover.px > ($scales.plot.y0 + $scales.plot.y1) / 2
    : false;
  $: left = $hover ? (sideways ? $scales.plot.x0 : $hover.px) : 0;
  // Sit beside the ruler, on whichever side has more room.
  $: flipped = !sideways && left > $size.width * 0.6;
  $: top = $hover
    ? sideways
      ? $hover.px + (above ? -half : half)
      : Math.max(
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
    class:bx--viz-chart-tooltip--above={above}
    aria-hidden="true"
    style:left="{(left / $size.width) * 100}%"
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
