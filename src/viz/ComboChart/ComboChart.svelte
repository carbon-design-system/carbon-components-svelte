<svelte:options immutable />

<script>
  /**
   * @template [T=any]
   */

  /**
   * @extends {"../Chart/Chart.svelte"} ChartProps<T>
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

  /** Set to `true` to let a drag across the plot brush an x range */
  export let brushable = false;

  /**
   * Specify the brushed x range. Bind it; `null` for none.
   * @type {[number | Date, number | Date] | null}
   */
  export let brush = null;

  /**
   * Specify every selected datum: Shift-click adds to it, a plain click
   * replaces it. Bind it.
   * @type {ReadonlyArray<{ series: string | number; index: number }>}
   */
  export let selection = [];

  /** Set to `false` to hide the grid */
  export let grid = true;

  /** Set to `false` to hide the legend */
  export let legend = true;

  /** Specify how many legend items show before the rest fold behind a "more" button */
  export let maxLegendItems = 8;

  /**
   * Set to `false` to hide the tooltip and the ruler, or pass options:
   * `sort` for the order of its rows, `maxRows` to fold the rest into one
   * line, `delay` for how long a pointer rests before it shows.
   * @type {boolean | import("../Chart/model.js").TooltipOptions<T>}
   */
  export let tooltip = true;
  $: tooltipProps = tooltip === true ? {} : tooltip === false ? null : tooltip;

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
  import ChartBrush from "../Chart/ChartBrush.svelte";
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
  bind:brush
  bind:selection
  on:brush
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
  {#if brushable}
    <ChartBrush />
  {/if}
  <slot />
  <svelte:fragment slot="toolbar">
    {#if toolbar}
      <ChartToolbar />
    {/if}
  </svelte:fragment>
  <svelte:fragment slot="tooltip">
    {#if tooltipProps}
      <slot name="tooltip"
        ><ChartTooltip
          sort={barMode === "stacked" ? "stack" : "series"}
          {...tooltipProps}
        /></slot
      >
    {/if}
  </svelte:fragment>
  <svelte:fragment slot="legend">
    {#if legend}
      <ChartLegend maxItems={maxLegendItems} />
    {/if}
  </svelte:fragment>
</Chart>
