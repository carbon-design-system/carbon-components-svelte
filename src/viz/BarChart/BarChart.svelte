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
   * Specify how series share a slot.
   * `"normalized"` shows each series as a share of its slot, from 0% to 100%.
   * @type {"grouped" | "stacked" | "normalized"}
   */
  export let mode = "grouped";

  /** Specify the gap between slots, as a fraction of the slot */
  export let padding = 0.2;

  /** Specify the widest a bar may grow, in pixels */
  export let maxBarWidth = 48;

  /** Set to `false` to hide the grid */
  export let grid = true;

  /** Set to `false` to hide the legend */
  export let legend = true;

  /** Set to `false` to hide the tooltip */
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
  import ChartBars from "../Chart/ChartBars.svelte";
  import ChartGrid from "../Chart/ChartGrid.svelte";
  import ChartLegend from "../Chart/ChartLegend.svelte";
  import ChartTooltip from "../Chart/ChartTooltip.svelte";

  const PERCENT = { style: "percent", maximumFractionDigits: 0 };

  // Shares only make sense from 0 to 1, written as percentages. Bar length
  // encodes the value, so the axis always includes zero.
  $: normalized =
    mode === "normalized" ? { yDomain: [0, 1], yFormat: PERCENT } : {};
</script>

<Chart
  bind:hidden
  bind:selected
  bind:ref
  {...$$restProps}
  {...normalized}
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
  <ChartBars {mode} {padding} {maxBarWidth} />
  <slot />
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
