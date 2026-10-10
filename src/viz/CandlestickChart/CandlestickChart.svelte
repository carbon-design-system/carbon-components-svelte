<svelte:options immutable />

<script>
  /**
   * @template [T=any]
   */

  /**
   * @restProps {figure}
   * @event {{ datum: T; series: string | number; index: number; originalEvent: Event }} select Fires when the focused datum is activated by click, Enter, or Space.
   * @event {{ x: number; points: Array<{ datum: T; series: string | number; index: number; y: number }> } | null} hover Fires when the pointer or keyboard focus moves to another period, and with `null` when it leaves.
   */

  /**
   * Specify the rows, one per period.
   * @type {ReadonlyArray<T>}
   */
  export let data = [];

  /**
   * Specify how to read a row's period, one candle each: a key or a
   * function. Periods are categories, so closed days leave no gap.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let x;

  /**
   * Specify how to read the open.
   * @type {import("../utils/accessor.js").Accessor<T, number | null | undefined>}
   */
  export let open;

  /**
   * Specify how to read the high.
   * @type {import("../utils/accessor.js").Accessor<T, number | null | undefined>}
   */
  export let high;

  /**
   * Specify how to read the low.
   * @type {import("../utils/accessor.js").Accessor<T, number | null | undefined>}
   */
  export let low;

  /**
   * Specify how to read the close.
   * @type {import("../utils/accessor.js").Accessor<T, number | null | undefined>}
   */
  export let close;

  /** Specify the title, shown as the caption and used as the accessible name */
  export let title = "";

  /** Specify a longer description for assistive technology */
  export let description = "";

  /** Specify the height of the chart, in pixels */
  export let height = 288;

  /**
   * Specify the width of the chart, in pixels, or `"auto"` to fill the container.
   * @type {number | "auto"}
   */
  export let width = "auto";

  /**
   * Specify the color of a rising candle.
   * @type {import("../utils/tokens.js").VizColor}
   */
  export let upColor = "success";

  /**
   * Specify the color of a falling candle.
   * @type {import("../utils/tokens.js").VizColor}
   */
  export let downColor = "error";

  /** Set to `false` to fill rising candles instead of drawing them hollow */
  export let hollow = true;

  /**
   * Specify how prices are written: `Intl.NumberFormat` options or a function.
   * @type {import("../utils/format-compact.js").NumberFormat}
   */
  export let yFormat = undefined;

  /**
   * Override the labels of the four prices and the change.
   * @type {{ open?: string; high?: string; low?: string; close?: string; change?: string }}
   */
  export let priceLabels = {};

  /** Specify the gap around a body, as a fraction of the slot */
  export let padding = 0.3;

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

  /** Specify the title of the x axis */
  export let xTitle = "";

  /** Specify the header of the period column in the table view */
  export let xHeader = "Period";

  /** Specify the title of the y axis */
  export let yTitle = "";

  /** Set to `true` to show the loading state */
  export let loading = false;

  /** Specify the text shown when there is no data */
  export let emptyText = "No data";

  /**
   * Specify the locale.
   * @type {string}
   */
  export let locale = undefined;

  /**
   * Obtain a reference to the figure element.
   * @bindable readonly
   * @type {null | HTMLElement}
   */
  export let ref = null;

  import Chart from "../Chart/Chart.svelte";
  import ChartAxis from "../Chart/ChartAxis.svelte";
  import ChartCandles from "../Chart/ChartCandles.svelte";
  import ChartGrid from "../Chart/ChartGrid.svelte";
  import ChartToolbar from "../Chart/ChartToolbar.svelte";
  import ChartTooltip from "../Chart/ChartTooltip.svelte";
  import ChartTooltipRow from "../Chart/ChartTooltipRow.svelte";
  import { toAccessor } from "../utils/accessor.js";
  import { resolveFormat } from "../utils/format-compact.js";

  $: labels = {
    open: "Open",
    high: "High",
    low: "Low",
    close: "Close",
    change: "Change",
    ...priceLabels,
  };
  $: xOf = toAccessor(x);
  $: openOf = toAccessor(open);
  $: highOf = toAccessor(high);
  $: lowOf = toAccessor(low);
  $: closeOf = toAccessor(close);
  $: candles = data.flatMap((row, i) => {
    const prices = [openOf, highOf, lowOf, closeOf].map((read) => {
      const raw = read(row, i);
      return raw === null || raw === undefined ? Number.NaN : Number(raw);
    });
    if (!prices.every(Number.isFinite)) return [];
    const [o, h, l, c] = prices;
    return [
      {
        x: String(xOf(row, i)),
        open: o,
        high: Math.max(h, o, c),
        low: Math.min(l, o, c),
        close: c,
        datum: row,
      },
    ];
  });
  // The four prices go in as series, so the tooltip, the table view, the
  // CSV, and the y domain all get them with no extra work.
  $: rows = candles.flatMap((candle) =>
    /** @type {const} */ (["open", "high", "low", "close"]).map((price) => ({
      x: candle.x,
      price: labels[price],
      value: candle[price],
      datum: candle.datum,
    })),
  );
  $: changes = new Map(
    candles.map((candle) => [candle.x, candle.close - candle.open]),
  );
  $: formatValue = resolveFormat(yFormat, locale);
  $: colors = {
    [labels.open]: "neutral",
    [labels.high]: "neutral",
    [labels.low]: "neutral",
    [labels.close]: "neutral",
  };

  /** @param {number} change */
  function formatChange(change) {
    return `${change > 0 ? "+" : ""}${formatValue(change)}`;
  }
</script>

<!-- Prices move within a band far from zero, which the axis must not include. -->
<Chart
  bind:view
  bind:ref
  {...$$restProps}
  {title}
  {description}
  {height}
  {width}
  {colors}
  {yFormat}
  {loading}
  {emptyText}
  {locale}
  {xHeader}
  data={rows}
  x="x"
  y="value"
  series="price"
  zero={false}
  legend={false}
  on:select
  on:hover
>
  {#if grid}
    <ChartGrid />
  {/if}
  <ChartAxis position="bottom" title={xTitle} />
  <ChartAxis position="left" title={yTitle} />
  <ChartCandles {candles} {padding} {hollow} {upColor} {downColor} />
  <slot />
  <svelte:fragment slot="toolbar">
    {#if toolbar}
      <ChartToolbar />
    {/if}
  </svelte:fragment>
  <svelte:fragment slot="tooltip">
    {#if tooltip}
      <slot name="tooltip">
        <ChartTooltip let:xLabel let:points>
          <div class:bx--viz-chart-tooltip__title={true}>{xLabel}</div>
          {#each points as point (point.series)}
            <ChartTooltipRow label={String(point.series)} value={point.value} />
          {/each}
          <ChartTooltipRow
            label={labels.change}
            value={formatChange(changes.get(xLabel) ?? 0)}
          />
        </ChartTooltip>
      </slot>
    {/if}
  </svelte:fragment>
</Chart>
