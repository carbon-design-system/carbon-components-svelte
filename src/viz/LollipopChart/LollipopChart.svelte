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

  /** Specify the radius of the head, in pixels */
  export let radius = 5;

  /** Specify the gap between slots, as a fraction of the slot */
  export let padding = 0.2;

  /**
   * Specify the orientation. `"horizontal"` lists the categories down the
   * left side, which suits long labels and ranked lists.
   * @type {"vertical" | "horizontal"}
   */
  export let orientation = "vertical";

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
  import ChartGrid from "../Chart/ChartGrid.svelte";
  import ChartLegend from "../Chart/ChartLegend.svelte";
  import ChartLollipops from "../Chart/ChartLollipops.svelte";
  import ChartToolbar from "../Chart/ChartToolbar.svelte";
  import ChartTooltip from "../Chart/ChartTooltip.svelte";
</script>

<!-- Stem length encodes the value, so the axis always includes zero. -->
<Chart
  band
  bind:hidden
  bind:selected
  bind:view
  bind:ref
  {...$$restProps}
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
  <ChartLollipops {radius} {padding} />
  <slot />
  <svelte:fragment slot="actions"><slot name="actions" /></svelte:fragment>
  <svelte:fragment slot="toolbar">
    {#if toolbar}
      <ChartToolbar {...toolbarProps} />
    {/if}
  </svelte:fragment>
  <svelte:fragment slot="tooltip">
    {#if tooltipProps}
      <slot name="tooltip"><ChartTooltip {...tooltipProps} /></slot>
    {/if}
  </svelte:fragment>
  <svelte:fragment slot="legend">
    {#if legend}
      <ChartLegend maxItems={maxLegendItems} />
    {/if}
  </svelte:fragment>
</Chart>
