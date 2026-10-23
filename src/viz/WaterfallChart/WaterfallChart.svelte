<svelte:options immutable />

<script>
  /**
   * @template [T=any]
   */

  /**
   * @extends {"../Chart/Chart.svelte"} ChartProps
   * @event {{ datum: T; series: string | number; index: number; originalEvent: Event }} select Fires when the focused step is activated by click, Enter, or Space.
   * @event {{ x: number; points: Array<{ datum: T; series: string | number; index: number; y: number }> } | null} hover Fires when the pointer or keyboard focus moves to another step, and with `null` when it leaves.
   * @event {{ xDomain: [number, number]; yDomain: [number, number]; count: number }} update Fires after the data or its domain changes. Requires `emitUpdate`.
   */

  /**
   * Specify the categories drawn as subtotals, from zero to the running
   * total. Their own value is ignored.
   * @type {ReadonlyArray<string>}
   */
  export let totals = [];

  /** Specify the gap between slots, as a fraction of the slot */
  export let padding = 0.3;

  /** Specify the widest a bar may grow, in pixels */
  export let maxBarWidth = 64;

  /** Set to `false` to hide the connectors between bars */
  export let connectors = true;

  /**
   * Specify the orientation. `"horizontal"` lists the steps down the left.
   * @type {"vertical" | "horizontal"}
   */
  export let orientation = "vertical";

  /** Set to `false` to hide the grid */
  export let grid = true;

  /** Set to `false` to hide the tooltip */
  export let tooltip = true;

  /** Set to `true` to show the toolbar, which swaps in a data table */
  export let toolbar = false;

  /**
   * Specify whether to show the chart or its data as a table.
   * @type {"chart" | "table"}
   */
  export let view = "chart";

  /** Specify the title of the x (step) axis */
  export let xTitle = "";

  /** Specify the title of the y (value) axis */
  export let yTitle = "";

  /**
   * Specify the selected step.
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
  import ChartToolbar from "../Chart/ChartToolbar.svelte";
  import ChartTooltip from "../Chart/ChartTooltip.svelte";
  import ChartWaterfall from "../Chart/ChartWaterfall.svelte";
</script>

<!-- A step's own size means nothing on the axis: only where the running total
     goes, which the mark registers. Every bar floats from zero at some point,
     so the axis always includes it. -->
<Chart
  bind:selected
  bind:view
  bind:ref
  yDomain="marks"
  {...$$restProps}
  {orientation}
  zero
  on:select
  on:hover
  on:update
>
  {#if grid}
    <ChartGrid />
  {/if}
  <ChartAxis
    position="bottom"
    title={orientation === "horizontal" ? yTitle : xTitle}
  />
  <ChartAxis
    position="left"
    title={orientation === "horizontal" ? xTitle : yTitle}
  />
  <ChartWaterfall {totals} {padding} {maxBarWidth} {connectors} />
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
</Chart>
