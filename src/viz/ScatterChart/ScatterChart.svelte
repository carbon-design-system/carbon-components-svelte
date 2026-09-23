<svelte:options immutable />

<script>
  /**
   * @template [T=any]
   */

  /**
   * @extends {"../Chart/Chart.svelte"} ChartProps
   * @event {{ datum: T; series: string | number; index: number; originalEvent: Event }} select Fires when the focused point is activated by click, Enter, or Space.
   * @event {{ x: number; points: Array<{ datum: T; series: string | number; index: number; y: number }> } | null} hover Fires when the pointer or keyboard focus moves to another point, and with `null` when it leaves.
   * @event {{ series: string | number; hidden: boolean }} legend:toggle Fires when a series is shown or hidden.
   * @event {{ xDomain: [number, number]; yDomain: [number, number]; count: number }} update Fires after the data or its domain changes. Requires `emitUpdate`.
   */

  /**
   * Specify the rows, one per point.
   * @type {ReadonlyArray<T>}
   */
  export let data = [];

  /**
   * Specify how to read a size from a row, which makes this a bubble chart:
   * a key or a function. The circle's area follows the value.
   * @type {import("../utils/accessor.js").Accessor<T, number | null | undefined>}
   */
  export let size = undefined;

  /**
   * Specify the smallest and largest radius, in pixels, when `size` is set.
   * @type {readonly [number, number]}
   */
  export let sizeRange = [4, 24];

  /** Specify the radius, in pixels, when there is no `size` */
  export let radius = 4;

  /**
   * Specify a density layer for a crowded scatter: hexagons colored by
   * count, or contour lines of a smoothed density.
   * @type {"none" | "hexbin" | "contour"}
   */
  export let density = "none";

  /** Specify the hexagon radius, in pixels, for `density="hexbin"` */
  export let hexSize = 12;

  /** Specify how many contour levels to draw for `density="contour"` */
  export let contourLevels = 6;

  /** Specify the contour smoothing bandwidth, in pixels */
  export let bandwidth = 20;

  /**
   * Specify the sequential hue of the density layer.
   * @type {import("../utils/tokens.js").VizSequentialHue}
   */
  export let densityHue = "blue";

  /**
   * Specify where the points sit against a density layer: faded behind
   * it, in front of it, or not drawn. Hover and keyboard still find them.
   * @type {"behind" | "front" | "none"}
   */
  export let points = "behind";

  /**
   * Specify how the points are drawn: as SVG elements, as pixels on a
   * canvas, or whichever suits the count. Hover, the keyboard, and the
   * tooltip work the same either way.
   * @type {"auto" | "svg" | "canvas"}
   */
  export let renderer = "auto";

  /** Specify the point count above which `renderer="auto"` paints on a canvas */
  export let canvasThreshold = 5000;

  /** Specify the label of the size in the tooltip */
  export let sizeLabel = "Size";

  /**
   * Specify how sizes are written: `Intl.NumberFormat` options or a function.
   * @type {import("../utils/format-compact.js").NumberFormat}
   */
  export let sizeFormat = undefined;

  /** Set to `false` to hide the grid */
  export let grid = true;

  /** Set to `false` to hide the legend */
  export let legend = true;

  /** Set to `false` to hide the tooltip */
  export let tooltip = true;

  /** Set to `true` to show the toolbar, which swaps in a data table */
  export let toolbar = false;

  /**
   * Set to `true` to show a zoom bar under the plot, for a time or numeric x.
   */
  export let zoomBar = false;

  /**
   * Specify the visible x range. `null` shows everything.
   * @type {[number | Date, number | Date] | null}
   */
  export let zoom = null;

  /**
   * Specify whether to show the chart or its data as a table.
   * @type {"chart" | "table"}
   */
  export let view = "chart";

  /** Specify the x axis title, also used for x in the tooltip */
  export let xTitle = "";

  /** Specify the y axis title, also used for y in the tooltip */
  export let yTitle = "";

  /**
   * Specify the hidden series keys.
   * @type {ReadonlyArray<string | number>}
   */
  export let hidden = [];

  /**
   * Specify the selected datum.
   * @type {{ series: string | number; index: number } | null}
   */
  export let selected = null;

  /**
   * Obtain a reference to the HTML element.
   * @bindable readonly
   * @type {null | HTMLElement}
   */
  export let ref = null;

  import Chart from "../Chart/Chart.svelte";
  import ChartAxis from "../Chart/ChartAxis.svelte";
  import ChartContours from "../Chart/ChartContours.svelte";
  import ChartGrid from "../Chart/ChartGrid.svelte";
  import ChartHexbin from "../Chart/ChartHexbin.svelte";
  import ChartLegend from "../Chart/ChartLegend.svelte";
  import ChartPoints from "../Chart/ChartPoints.svelte";
  import ChartToolbar from "../Chart/ChartToolbar.svelte";
  import ChartTooltip from "../Chart/ChartTooltip.svelte";
  import ChartTooltipRow from "../Chart/ChartTooltipRow.svelte";
  import ChartZoomBar from "../Chart/ChartZoomBar.svelte";
  import { toAccessor } from "../utils/accessor.js";
  import { resolveFormat } from "../utils/format-compact.js";

  $: sizeOf = size === undefined ? undefined : toAccessor(size);
  $: painting =
    renderer === "canvas" ||
    (renderer === "auto" && data.length > canvasThreshold);
  $: writeSize = resolveFormat(sizeFormat, $$restProps.locale);
</script>

<!-- Both axes are measures, so neither is forced to zero and x rounds out. -->
<Chart
  bind:zoom
  bind:hidden
  bind:selected
  bind:view
  bind:ref
  xDomain="nice"
  zero={false}
  {data}
  {...$$restProps}
  on:select
  on:hover
  on:update
  on:legend:toggle
>
  {#if grid}
    <ChartGrid x />
  {/if}
  <ChartAxis position="bottom" title={xTitle} />
  <ChartAxis position="left" title={yTitle} />
  <!-- The density layer is drawn first, so points sit over it unless
       they are hidden. Hidden points still drive hover and the keyboard. -->
  {#if density === "hexbin"}
    <ChartHexbin radius={hexSize} hue={densityHue} />
  {:else if density === "contour"}
    <ChartContours levels={contourLevels} {bandwidth} hue={densityHue} />
  {/if}
  <ChartPoints
    {radius}
    {size}
    {sizeRange}
    class={density !== "none" && points === "behind"
      ? "bx--viz-points--behind"
      : undefined}
    hidden={density !== "none" && points === "none"}
    renderer={painting ? "canvas" : "svg"}
  />
  <slot />
  <svelte:fragment slot="toolbar">
    {#if toolbar}
      <ChartToolbar />
    {/if}
  </svelte:fragment>
  <svelte:fragment slot="tooltip">
    {#if tooltip}
      <slot name="tooltip">
        <ChartTooltip let:xLabel let:points>
          {#each points as point (point.series)}
            <div class:bx--viz-chart-tooltip__title={true}>
              <ChartTooltipRow
                color={point.color}
                label={String(point.series)}
              />
            </div>
            <ChartTooltipRow label={xTitle || "x"} value={xLabel} />
            <ChartTooltipRow label={yTitle || "y"} value={point.value} />
            {#if sizeOf}
              <ChartTooltipRow
                label={sizeLabel}
                value={writeSize(Number(sizeOf(point.datum, point.index)))}
              />
            {/if}
          {/each}
        </ChartTooltip>
      </slot>
    {/if}
  </svelte:fragment>
  <svelte:fragment slot="zoom">
    {#if zoomBar}
      <ChartZoomBar />
    {/if}
  </svelte:fragment>
  <svelte:fragment slot="legend">
    {#if legend}
      <ChartLegend />
    {/if}
  </svelte:fragment>
</Chart>
