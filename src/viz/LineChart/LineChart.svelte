<svelte:options immutable />

<script>
  /**
   * @template [T=any]
   */

  /**
   * @extends {"../Chart/Chart.svelte"} ChartProps
   * @event {{ datum: T; series: string | number; index: number; originalEvent: Event }} select Fires when the focused datum is activated by click, Enter, or Space.
   * @event {{ x: number; points: Array<{ datum: T; series: string | number; index: number; y: number }> } | null} hover Fires when the pointer or keyboard focus moves to another x, and with `null` when it leaves.
   * @event {{ series: string | number; hidden: boolean }} legend:toggle Fires when a series is shown or hidden.
   * @event {{ xDomain: [number, number]; yDomain: [number, number]; count: number }} update Fires after the data or its domain changes. Requires `emitUpdate`.
   */

  /**
   * Specify the curve. `"monotone"` is smooth and never overshoots the data.
   * @type {"linear" | "step" | "step-before" | "step-after" | "monotone"}
   */
  export let curve = "linear";

  /**
   * Specify when to draw a point on each datum.
   * @type {"none" | "hover" | "all"}
   */
  export let points = "hover";

  /**
   * Set to `true` to dash every line, or pass the series keys to dash.
   * @type {boolean | ReadonlyArray<string | number>}
   */
  export let dashed = false;

  /** Set to `false` to draw every point of a long series */
  export let downsample = true;

  /**
   * Specify the x from which the data is projected. The lines are dashed
   * from there, and a marker stands at the boundary.
   * @type {number | Date}
   */
  export let forecastFrom = undefined;

  /** Specify the label of the marker at `forecastFrom` */
  export let forecastLabel = "";

  /**
   * Set to `true` to include zero in the y domain.
   * A line chart shows change, so by default it fits the data.
   */
  export let zero = false;

  /** Set to `false` to hide the grid */
  export let grid = true;

  /** Set to `false` to hide the legend */
  export let legend = true;

  /** Set to `false` to hide the tooltip and the ruler */
  export let tooltip = true;

  /** Set to `true` to show a toolbar with a data table view and a CSV download */
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

  /** Specify the x axis title */
  export let xTitle = "";

  /** Specify the y axis title */
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
   * Obtain a reference to the figure element.
   * @bindable readonly
   * @type {null | HTMLElement}
   */
  export let ref = null;

  import Chart from "../Chart/Chart.svelte";
  import ChartAxis from "../Chart/ChartAxis.svelte";
  import ChartGrid from "../Chart/ChartGrid.svelte";
  import ChartLegend from "../Chart/ChartLegend.svelte";
  import ChartLine from "../Chart/ChartLine.svelte";
  import ChartMarker from "../Chart/ChartMarker.svelte";
  import ChartRuler from "../Chart/ChartRuler.svelte";
  import ChartToolbar from "../Chart/ChartToolbar.svelte";
  import ChartTooltip from "../Chart/ChartTooltip.svelte";
  import ChartZoomBar from "../Chart/ChartZoomBar.svelte";
</script>

<Chart
  {zero}
  bind:zoom
  bind:hidden
  bind:selected
  bind:view
  bind:ref
  {...$$restProps}
  on:select
  on:hover
  on:update
  on:legend:toggle
>
  {#if grid}
    <ChartGrid />
  {/if}
  <ChartAxis position="bottom" title={xTitle} />
  <ChartAxis position="left" title={yTitle} />
  <slot />
  {#if forecastFrom !== undefined}
    <ChartMarker x={forecastFrom} label={forecastLabel} />
  {/if}
  <ChartLine {curve} {points} {dashed} {downsample} {forecastFrom} />
  {#if tooltip}
    <ChartRuler />
  {/if}
  <svelte:fragment slot="toolbar">
    {#if toolbar}
      <ChartToolbar />
    {/if}
  </svelte:fragment>
  <svelte:fragment slot="tooltip">
    {#if tooltip}
      <slot name="tooltip"><ChartTooltip /></slot>
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
