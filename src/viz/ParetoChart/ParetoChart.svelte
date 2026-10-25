<svelte:options immutable />

<script>
  /**
   * @template [T=any]
   */

  /**
   * @extends {"../Chart/Chart.svelte"} ChartProps<T>
   * @event {{ datum: T; series: string | number; index: number; originalEvent: Event; selection: Array<{ series: string | number; index: number }> }} select Fires when the focused bar is activated by click, Enter, or Space.
   * @event {{ x: number; points: Array<{ datum: T; series: string | number; index: number; y: number }> } | null} hover Fires when the pointer or keyboard focus moves to another category, and with `null` when it leaves.
   */

  /**
   * Specify the share of the total at which to draw the threshold, as a
   * fraction. The categories left of where the cumulative line crosses it
   * are the ones to act on.
   */
  export let threshold = 0.8;

  /** Specify the label of the bars in the tooltip and the table */
  export let valueLabel = "Count";

  /** Specify the label of the cumulative line */
  export let cumulativeLabel = "Cumulative";

  /**
   * Specify the label of the threshold. Defaults to the share as a percentage.
   * @type {string | undefined}
   */
  export let thresholdLabel = undefined;

  /** Set to `false` to hide the grid */
  export let grid = true;

  /** Set to `false` to hide the legend */
  export let legend = true;

  /**
   * Set to `false` to hide the tooltip and the ruler, or pass options.
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
   * Specify the view: the chart, or its data table.
   * @type {"chart" | "table"}
   */
  export let view = "chart";

  /** Specify the title of the x axis */
  export let xTitle = "";

  /** Specify the title of the y axis */
  export let yTitle = "";

  /**
   * Specify the selected bar.
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
  import ChartGrid from "../Chart/ChartGrid.svelte";
  import ChartLegend from "../Chart/ChartLegend.svelte";
  import ChartLine from "../Chart/ChartLine.svelte";
  import ChartThreshold from "../Chart/ChartThreshold.svelte";
  import ChartToolbar from "../Chart/ChartToolbar.svelte";
  import ChartTooltip from "../Chart/ChartTooltip.svelte";
  import ChartTooltipRow from "../Chart/ChartTooltipRow.svelte";
  import { toAccessor } from "../utils/accessor.js";

  /** @type {ReadonlyArray<T>} */
  export let data = [];

  /**
   * Specify how to read a row's category: a key or a function.
   * @type {(keyof T & string) | ((row: T, index: number) => number | Date | string)}
   */
  export let x;

  /**
   * Specify how to read a row's value.
   * @type {(keyof T & string) | ((row: T, index: number) => number | null | undefined)}
   */
  export let y;

  $: xOf = toAccessor(x);
  $: yOf = toAccessor(y);
  // Largest first, then the running share of the total beside each bar.
  $: sorted = data
    .map((row, i) => ({
      row,
      category: String(xOf(row, i)),
      value: Number(yOf(row, i)),
    }))
    .filter((entry) => Number.isFinite(entry.value) && entry.value > 0)
    .sort((a, b) => b.value - a.value);
  $: total = sorted.reduce((sum, entry) => sum + entry.value, 0);
  $: rows = (() => {
    let running = 0;
    return sorted.flatMap((entry) => {
      running += entry.value;
      return [
        {
          category: entry.category,
          series: valueLabel,
          value: entry.value,
          datum: entry.row,
        },
        {
          category: entry.category,
          series: cumulativeLabel,
          value: total > 0 ? running / total : 0,
          datum: entry.row,
        },
      ];
    });
  })();
  $: colors = { [valueLabel]: "interactive", [cumulativeLabel]: "neutral" };
  $: thresholdText = thresholdLabel ?? `${Math.round(threshold * 100)}%`;
</script>

<Chart
  band
  bind:view
  bind:ref
  bind:selected
  {...$$restProps}
  data={rows}
  x="category"
  y="value"
  series="series"
  secondary={[cumulativeLabel]}
  y2Domain={[0, 1]}
  y2Format={{ style: "percent", maximumFractionDigits: 0 }}
  {colors}
  zero
  on:select
  on:hover
  on:update
>
  {#if grid}
    <ChartGrid />
  {/if}
  <ChartAxis position="bottom" title={xTitle} />
  <ChartAxis position="left" title={yTitle} />
  <ChartAxis position="right" />
  <ChartThreshold y={threshold} axis="y2" kind="info" label={thresholdText} />
  <ChartBars series={[valueLabel]} />
  <ChartLine series={[cumulativeLabel]} points="all" curve="monotone" />
  <slot />
  <svelte:fragment slot="actions"><slot name="actions" /></svelte:fragment>
  <svelte:fragment slot="toolbar">
    {#if toolbar}
      <ChartToolbar {...toolbarProps} />
    {/if}
  </svelte:fragment>
  <svelte:fragment slot="tooltip">
    {#if tooltipProps}
      <ChartTooltip {...tooltipProps} let:xLabel let:points>
        <div class:bx--viz-chart-tooltip__title={true}>{xLabel}</div>
        {#each points as point (point.series)}
          <ChartTooltipRow
            color={point.color}
            label={String(point.series)}
            value={point.value}
          />
        {/each}
      </ChartTooltip>
    {/if}
  </svelte:fragment>
  <svelte:fragment slot="legend">
    {#if legend}
      <ChartLegend />
    {/if}
  </svelte:fragment>
</Chart>
