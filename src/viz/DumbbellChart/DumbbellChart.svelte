<svelte:options immutable />

<script>
  /**
   * @template [T=any]
   */

  /**
   * @extends {"../Chart/Chart.svelte"} ChartProps
   * @event {{ datum: T; series: string | number; index: number; originalEvent: Event }} select Fires when the focused datum is activated by click, Enter, or Space.
   * @event {{ x: number; points: Array<{ datum: T; series: string | number; index: number; y: number }> } | null} hover Fires when the pointer or keyboard focus moves to another category, and with `null` when it leaves.
   * @event {{ series: string | number; hidden: boolean }} legend:toggle Fires when a series is shown or hidden.
   * @event {{ xDomain: [number, number]; yDomain: [number, number]; count: number }} update Fires after the data or its domain changes. Requires `emitUpdate`.
   */

  /**
   * Specify the series the bar starts at, such as the earlier period.
   * Defaults to the first series.
   * @type {string | number}
   */
  export let from = undefined;

  /**
   * Specify the series the bar ends at. Defaults to the second series.
   * @type {string | number}
   */
  export let to = undefined;

  /** Specify the radius of the dots, in pixels */
  export let radius = 5;

  /**
   * Specify the orientation. Categories read best down the left side.
   * @type {"vertical" | "horizontal"}
   */
  export let orientation = "horizontal";

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

  /** Specify the title of the x (category) axis */
  export let xTitle = "";

  /** Specify the title of the y (value) axis */
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
  import ChartDumbbells from "../Chart/ChartDumbbells.svelte";
  import ChartGrid from "../Chart/ChartGrid.svelte";
  import ChartLegend from "../Chart/ChartLegend.svelte";
  import ChartToolbar from "../Chart/ChartToolbar.svelte";
  import ChartTooltip from "../Chart/ChartTooltip.svelte";
</script>

<!-- The bar is the gap between two values, not a length from zero. -->
<Chart
  bind:hidden
  bind:selected
  bind:view
  bind:ref
  zero={false}
  {...$$restProps}
  {orientation}
  on:select
  on:hover
  on:update
  on:legend:toggle
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
  <ChartDumbbells {from} {to} {radius} />
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
