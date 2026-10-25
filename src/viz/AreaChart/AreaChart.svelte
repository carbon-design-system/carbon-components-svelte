<svelte:options immutable />

<script>
  /**
   * @template [T=any]
   */

  /**
   * @extends {"../Chart/Chart.svelte"} ChartProps<T>
   * @event {{ datum: T; series: string | number; index: number; originalEvent: Event }} select Fires when the focused datum is activated by click, Enter, or Space.
   * @event {{ x: number; points: Array<{ datum: T; series: string | number; index: number; y: number }> } | null} hover Fires when the pointer or keyboard focus moves to another x, and with `null` when it leaves.
   * @event {{ series: string | number; hidden: boolean }} legend:toggle Fires when a series is shown or hidden.
   * @event {{ xDomain: [number, number]; yDomain: [number, number]; count: number }} update Fires after the data or its domain changes. Requires `emitUpdate`.
   */

  /**
   * Specify how series share the plot.
   * `"stacked"` piles them up, `"normalized"` shows each as a share from 0% to
   * 100%, and `"stream"` centers the stack on a middle line.
   * @type {"none" | "stacked" | "normalized" | "stream"}
   */
  export let stack = "none";

  /**
   * Specify the curve. `"monotone"` is smooth and never overshoots the data.
   * @type {"linear" | "step" | "step-before" | "step-after" | "monotone"}
   */
  export let curve = "linear";

  /**
   * Specify the fill opacity.
   * @type {number}
   */
  export let opacity = undefined;

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
   * @type {ReadonlyArray<{ series: string | number; index: number; key?: string | number }>}
   */
  export let selection = [];

  /**
   * Specify a fill pattern per series, so series tell apart in print and
   * under forced colors: `"auto"` cycles the patterns in series order, or
   * a map names one per series.
   * @type {"auto" | Partial<Record<string, import("../Chart/shapes.js").Pattern>> | undefined}
   */
  export let patterns = undefined;

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

  /**
   * Set to `true` to show a toolbar with a data table view and downloads,
   * or pass the toolbar's own props, such as `filename` or `copy`.
   * @type {boolean | Partial<import("../Chart/ChartToolbar.svelte").ChartToolbarProps>}
   */
  export let toolbar = false;
  $: toolbarProps = toolbar === true ? {} : toolbar || {};

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
   * @type {{ series: string | number; index: number; key?: string | number } | null}
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
  import ChartBrush from "../Chart/ChartBrush.svelte";
  import ChartGrid from "../Chart/ChartGrid.svelte";
  import ChartLegend from "../Chart/ChartLegend.svelte";
  import ChartRuler from "../Chart/ChartRuler.svelte";
  import ChartToolbar from "../Chart/ChartToolbar.svelte";
  import ChartTooltip from "../Chart/ChartTooltip.svelte";
  import ChartZoomBar from "../Chart/ChartZoomBar.svelte";

  const PERCENT = { style: "percent", maximumFractionDigits: 0 };

  // Shares only make sense from 0 to 1, written as percentages. A stream has
  // no baseline, so its y values mean nothing and the axis labels go.
  $: normalized =
    stack === "normalized" ? { yDomain: [0, 1], yFormat: PERCENT } : {};
</script>

<Chart
  bind:zoom
  bind:hidden
  bind:selected
  bind:view
  bind:ref
  bind:brush
  bind:selection
  on:brush
  {...$$restProps}
  {...normalized}
  zero={stack !== "stream"}
  on:select
  on:hover
  on:update
  on:legend:toggle
>
  {#if grid}
    <ChartGrid />
  {/if}
  <ChartAxis position="bottom" title={xTitle} />
  <ChartAxis position="left" title={yTitle} hideLabels={stack === "stream"} />
  {#if brushable}
    <ChartBrush />
  {/if}
  <slot />
  <ChartArea pattern={patterns} {stack} {curve} {opacity} />
  {#if tooltipProps}
    <ChartRuler />
  {/if}
  <svelte:fragment slot="toolbar">
    {#if toolbar}
      <ChartToolbar {...toolbarProps} />
    {/if}
  </svelte:fragment>
  <svelte:fragment slot="tooltip">
    {#if tooltipProps}
      <slot name="tooltip"
        ><ChartTooltip
          sort={stack === "none" ? "series" : "stack"}
          {...tooltipProps}
        /></slot
      >
    {/if}
  </svelte:fragment>
  <svelte:fragment slot="zoom">
    {#if zoomBar}
      <ChartZoomBar />
    {/if}
  </svelte:fragment>
  <svelte:fragment slot="legend">
    {#if legend}
      <ChartLegend maxItems={maxLegendItems} />
    {/if}
  </svelte:fragment>
</Chart>
