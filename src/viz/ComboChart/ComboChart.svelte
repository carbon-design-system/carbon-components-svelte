<svelte:options immutable />

<script>
  /**
   * @template [T=any]
   */

  /**
   * @extends {"../Chart/Chart.svelte"} ChartProps
   * @event {{ datum: T; series: string | number; index: number; originalEvent: Event }} select Fires when the focused datum is activated by click, Enter, or Space.
   * @event {{ x: number; points: Array<{ datum: T; series: string | number; index: number; y: number }> } | null} hover Fires when the pointer or keyboard focus moves to another slot, and with `null` when it leaves.
   * @event {{ series: string | number; hidden: boolean }} legend:toggle Fires when a series is shown or hidden.
   * @event {{ xDomain: [number, number]; yDomain: [number, number]; count: number }} update Fires after the data or its domain changes. Requires `emitUpdate`.
   */

  /**
   * Specify the series drawn as bars.
   * @type {ReadonlyArray<string | number>}
   */
  export let bars = [];

  /**
   * Specify the series drawn as lines.
   * @type {ReadonlyArray<string | number>}
   */
  export let lines = [];

  /**
   * Specify the series drawn as areas.
   * @type {ReadonlyArray<string | number>}
   */
  export let areas = [];

  /**
   * Specify the series plotted on a secondary y axis, drawn on the right.
   * Use it when the series have different units, such as revenue and a rate.
   * @type {ReadonlyArray<string | number>}
   */
  export let secondary = [];

  /**
   * Specify how bar series share a slot.
   * @type {"grouped" | "stacked"}
   */
  export let barMode = "grouped";

  /**
   * Specify the line curve.
   * @type {"linear" | "step" | "step-before" | "step-after" | "monotone"}
   */
  export let curve = "linear";

  /** Set to `false` to hide the grid */
  export let grid = true;

  /** Set to `false` to hide the legend */
  export let legend = true;

  /** Set to `false` to hide the tooltip */
  export let tooltip = true;

  /** Set to `true` to show the toolbar, which swaps in a data table */
  export let toolbar = false;

  /**
   * Specify whether to show the chart or its data as a table.
   * @type {"chart" | "table"}
   */
  export let view = "chart";

  /** Specify the x axis title */
  export let xTitle = "";

  /** Specify the y axis title */
  export let yTitle = "";

  /** Specify the secondary y axis title */
  export let y2Title = "";

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
  import ChartArea from "../Chart/ChartArea.svelte";
  import ChartAxis from "../Chart/ChartAxis.svelte";
  import ChartBars from "../Chart/ChartBars.svelte";
  import ChartGrid from "../Chart/ChartGrid.svelte";
  import ChartLegend from "../Chart/ChartLegend.svelte";
  import ChartLine from "../Chart/ChartLine.svelte";
  import ChartToolbar from "../Chart/ChartToolbar.svelte";
  import ChartTooltip from "../Chart/ChartTooltip.svelte";
</script>

<!-- Bar length encodes the value, so the axes always include zero. -->
<Chart
  bind:hidden
  bind:selected
  bind:view
  bind:ref
  {...$$restProps}
  {secondary}
  zero
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
  {#if secondary.length > 0}
    <ChartAxis position="right" title={y2Title} />
  {/if}
  <!-- Back to front: areas, then bars, then lines, so nothing hides a line. -->
  {#if areas.length > 0}
    <ChartArea series={areas} {curve} />
  {/if}
  {#if bars.length > 0}
    <ChartBars series={bars} mode={barMode} />
  {/if}
  {#if lines.length > 0}
    <ChartLine series={lines} {curve} points="all" />
  {/if}
  <slot />
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
  <svelte:fragment slot="legend">
    {#if legend}
      <ChartLegend />
    {/if}
  </svelte:fragment>
</Chart>
