<svelte:options immutable />

<script>
  /**
   * @template [T=any]
   */

  /**
   * @extends {"../LineChart/LineChart.svelte"} LineChartProps
   * @event {{ datum: T; series: string | number; index: number; originalEvent: Event }} select Fires when the focused datum is activated by click, Enter, or Space.
   * @event {{ x: number; points: Array<{ datum: T; series: string | number; index: number; y: number }> } | null} hover Fires when the pointer or keyboard focus moves to another x, and with `null` when it leaves.
   * @event {{ series: string | number; hidden: boolean }} legend:toggle Fires when a cohort is shown or hidden.
   * @event {{ xDomain: [number, number]; yDomain: [number, number]; count: number }} update Fires after the data or its domain changes. Requires `emitUpdate`.
   */

  /**
   * Specify a retention rate to mark, as a fraction, such as a target or
   * the average across cohorts.
   * @type {number}
   */
  export let baseline = undefined;

  /** Specify the label of the baseline rule */
  export let baselineLabel = "Baseline";

  /**
   * Specify the curve. `"monotone"` is smooth and never overshoots the data.
   * @type {"linear" | "step" | "step-before" | "step-after" | "monotone"}
   */
  export let curve = "monotone";

  /**
   * Specify when to draw a point on each datum. Every period is a
   * measurement, so by default all are marked.
   * @type {"none" | "hover" | "all"}
   */
  export let points = "all";

  /**
   * Specify the hidden cohorts.
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

  import ChartThreshold from "../Chart/ChartThreshold.svelte";
  import LineChart from "../LineChart/LineChart.svelte";

  const PERCENT = { style: "percent", maximumFractionDigits: 0 };
</script>

<!-- Retention is a share of the cohort, so the axis runs from nothing to all. -->
<LineChart
  yDomain={[0, 1]}
  yFormat={PERCENT}
  {curve}
  {points}
  bind:hidden
  bind:selected
  bind:ref
  {...$$restProps}
  on:select
  on:hover
  on:update
  on:legend:toggle
>
  {#if baseline !== undefined}
    <ChartThreshold y={baseline} label={baselineLabel} kind="warning" />
  {/if}
  <slot />
  <svelte:fragment slot="tooltip">
    <slot name="tooltip" />
  </svelte:fragment>
</LineChart>
