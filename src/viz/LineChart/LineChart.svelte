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
  import ChartRuler from "../Chart/ChartRuler.svelte";
  import ChartTooltip from "../Chart/ChartTooltip.svelte";
</script>

<Chart
  {zero}
  bind:hidden
  bind:selected
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
  <ChartLine {curve} {points} {dashed} {downsample} />
  {#if tooltip}
    <ChartRuler />
  {/if}
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
