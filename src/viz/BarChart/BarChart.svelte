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
   * Specify how series share a slot.
   * `"normalized"` shows each series as a share of its slot, from 0% to 100%.
   * @type {"grouped" | "stacked" | "normalized"}
   */
  export let mode = "grouped";

  /** Specify the gap between slots, as a fraction of the slot */
  export let padding = 0.2;

  /** Specify the widest a bar may grow, in pixels */
  export let maxBarWidth = 48;

  /**
   * Specify where value labels sit: outside the bar's end, inside it, or
   * `"auto"`, outside where the bar is wide enough. Stacked bars label
   * their totals.
   * @type {"none" | "auto" | "outside" | "inside"}
   */
  export let labels = "none";

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
   * Set to `true` to show a zoom bar under the plot, which narrows the
   * categories shown.
   */
  export let zoomBar = false;

  /**
   * Specify the visible range, as category indexes. `null` shows everything.
   * Narrower than `Chart`'s `zoom`, which also takes dates on a time axis.
   * @type {[number, number] | null}
   * @sveld-ignore sveld/extend-props-override
   */
  export let zoom = null;

  /**
   * Specify whether to show the chart or its data as a table.
   * @type {"chart" | "table"}
   */
  export let view = "chart";

  /**
   * Specify the orientation. `"horizontal"` lists the categories down the
   * left side, which suits long labels and ranked lists.
   * @type {"vertical" | "horizontal"}
   */
  export let orientation = "vertical";

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
  import ChartAxis from "../Chart/ChartAxis.svelte";
  import ChartBars from "../Chart/ChartBars.svelte";
  import ChartBrush from "../Chart/ChartBrush.svelte";
  import ChartGrid from "../Chart/ChartGrid.svelte";
  import ChartLegend from "../Chart/ChartLegend.svelte";
  import ChartToolbar from "../Chart/ChartToolbar.svelte";
  import ChartTooltip from "../Chart/ChartTooltip.svelte";
  import ChartZoomBar from "../Chart/ChartZoomBar.svelte";

  const PERCENT = { style: "percent", maximumFractionDigits: 0 };

  // Shares only make sense from 0 to 1, written as percentages. Bar length
  // encodes the value, so the axis always includes zero.
  $: normalized =
    mode === "normalized" ? { yDomain: [0, 1], yFormat: PERCENT } : {};
</script>

<Chart
  band
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
  {orientation}
  zero
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
  <ChartBars pattern={patterns} {labels} {mode} {padding} {maxBarWidth} />
  {#if brushable}
    <ChartBrush />
  {/if}
  <slot />
  <svelte:fragment slot="toolbar">
    {#if toolbar}
      <ChartToolbar {...toolbarProps} />
    {/if}
  </svelte:fragment>
  <svelte:fragment slot="tooltip">
    {#if tooltipProps}
      <slot name="tooltip"
        ><ChartTooltip
          sort={mode === "stacked" ? "stack" : "series"}
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
