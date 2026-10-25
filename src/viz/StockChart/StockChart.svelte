<script>
  /**
   * @template T
   */

  /**
   * @event {{ datum: T; series: string | number; index: number; originalEvent: Event }} select Fires when the focused price is activated by click, Enter, or Space.
   * @event {{ x: number; points: Array<{ datum: T; series: string | number; index: number; y: number }> } | null} hover Fires when the pointer or keyboard focus moves to another period, and with `null` when it leaves.
   */

  /**
   * Specify the rows, one per period, with the open, high, low, and close
   * prices and optionally the volume. Reassign the array to update.
   * @type {ReadonlyArray<T>}
   */
  export let data = [];

  /**
   * Specify how to read a row's period: a key or a function.
   * @type {import("../utils/accessor.js").Accessor<T, string | number | Date>}
   */
  export let x;

  /** @type {import("../utils/accessor.js").Accessor<T, number>} */
  export let open;

  /** @type {import("../utils/accessor.js").Accessor<T, number>} */
  export let high;

  /** @type {import("../utils/accessor.js").Accessor<T, number>} */
  export let low;

  /** @type {import("../utils/accessor.js").Accessor<T, number>} */
  export let close;

  /**
   * Specify how to read a row's volume. Volume draws as bars along the
   * bottom of the price pane, on its own scale.
   * @type {import("../utils/accessor.js").Accessor<T, number> | undefined}
   */
  export let volume = undefined;

  /**
   * Specify how the price is drawn: candles, a line, or an area, all of the
   * close.
   * @type {"candles" | "line" | "area"}
   */
  export let mode = "candles";

  /**
   * Specify the overlays computed from the close and drawn on the price
   * pane: moving averages and Bollinger bands.
   * @type {ReadonlyArray<{ type: "sma" | "ema" | "bollinger"; period?: number; label?: string; color?: import("../utils/tokens.js").VizColor }>}
   */
  export let overlays = [];

  /**
   * Specify the indicators drawn in their own panes under the price, which
   * share its x axis, hover, and zoom.
   * @type {ReadonlyArray<{ type: "rsi" | "macd"; period?: number; fast?: number; slow?: number; signal?: number; label?: string }>}
   */
  export let indicators = [];

  /** Specify the title of the chart, also its accessible name */
  export let title = "";

  /** Specify a description, for assistive technology */
  export let description = "";

  /** Specify the height of the price pane in pixels */
  export let height = 288;

  /** Specify the height of an indicator pane in pixels */
  export let indicatorHeight = 120;

  /**
   * Specify the width in pixels, or `"auto"` to fill the container.
   * @type {number | "auto"}
   */
  export let width = "auto";

  /** @type {import("../utils/tokens.js").VizColor} */
  export let upColor = "success";

  /** @type {import("../utils/tokens.js").VizColor} */
  export let downColor = "error";

  /** Set to `false` to fill rising candles too */
  export let hollow = true;

  /**
   * Specify the price format.
   * @type {import("../utils/format-compact.js").NumberFormat}
   */
  export let yFormat = undefined;

  /**
   * Specify the volume format.
   * @type {import("../utils/format-compact.js").NumberFormat}
   */
  export let volumeFormat = { notation: "compact" };

  /**
   * Specify the labels of the price rows, the volume, and the change.
   * @type {Partial<{ open: string; high: string; low: string; close: string; volume: string; change: string }>}
   */
  export let labels = {};

  /** Set to `false` to hide the grid */
  export let grid = true;

  /**
   * Set to `false` to hide the tooltip and the ruler, or pass options:
   * `sort` for the order of its rows, `maxRows` to fold the rest into one
   * line, `delay` for how long a pointer rests before it shows.
   * @type {boolean | import("../Chart/model.js").TooltipOptions<T>}
   */
  export let tooltip = true;
  $: tooltipProps = tooltip === true ? {} : tooltip === false ? null : tooltip;

  /** Set to `true` to show the toolbar */
  export let toolbar = false;

  /** Set to `true` to show a zoom bar under the last pane */
  export let zoomBar = false;

  /**
   * Specify the visible range, shared by every pane. `null` shows everything.
   * @type {[number | Date, number | Date] | null}
   */
  export let zoom = null;

  /** Set to `false` to hide the overlay legend */
  export let legend = true;

  /** Specify the title of the x axis */
  export let xTitle = "";

  /** Specify the header of the period column in the table view */
  export let xHeader = "Date";

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
   * Obtain a reference to the root element.
   * @bindable readonly
   * @type {null | HTMLElement}
   */
  export let ref = null;

  import Chart from "../Chart/Chart.svelte";
  import ChartArea from "../Chart/ChartArea.svelte";
  import ChartAxis from "../Chart/ChartAxis.svelte";
  import ChartBars from "../Chart/ChartBars.svelte";
  import ChartCandles from "../Chart/ChartCandles.svelte";
  import ChartGrid from "../Chart/ChartGrid.svelte";
  import ChartLegend from "../Chart/ChartLegend.svelte";
  import ChartLine from "../Chart/ChartLine.svelte";
  import ChartThreshold from "../Chart/ChartThreshold.svelte";
  import ChartToolbar from "../Chart/ChartToolbar.svelte";
  import ChartTooltip from "../Chart/ChartTooltip.svelte";
  import ChartTooltipRow from "../Chart/ChartTooltipRow.svelte";
  import ChartZoomBar from "../Chart/ChartZoomBar.svelte";
  import { toAccessor } from "../utils/accessor.js";
  import { resolveFormat } from "../utils/format-compact.js";
  import { bollinger, ema, macd, rsi, sma } from "../utils/indicators.js";

  // Hover and zoom travel between the panes on a channel of their own.
  const sync = `stock-${Math.random().toString(36).slice(2, 8)}`;
  // Panes share one left margin so their plots line up.
  const margin = { left: 64, right: 16 };

  $: text = {
    open: "Open",
    high: "High",
    low: "Low",
    close: "Close",
    volume: "Volume",
    change: "Change",
    ...labels,
  };
  $: xOf = toAccessor(x);
  $: openOf = toAccessor(open);
  $: highOf = toAccessor(high);
  $: lowOf = toAccessor(low);
  $: closeOf = toAccessor(close);
  $: volumeOf = volume === undefined ? undefined : toAccessor(volume);
  $: periods = data.flatMap((row, i) => {
    const prices = [openOf, highOf, lowOf, closeOf].map((read) => {
      const raw = read(row, i);
      return raw === null || raw === undefined ? Number.NaN : Number(raw);
    });
    if (!prices.every(Number.isFinite)) return [];
    const [o, h, l, c] = prices;
    const v = volumeOf ? Number(volumeOf(row, i)) : Number.NaN;
    return [
      {
        x: String(xOf(row, i)),
        open: o,
        high: Math.max(h, o, c),
        low: Math.min(l, o, c),
        close: c,
        volume: Number.isFinite(v) ? v : null,
        datum: row,
      },
    ];
  });
  $: closes = periods.map((period) => period.close);
  $: maxVolume = periods.reduce(
    (top, period) => Math.max(top, period.volume ?? 0),
    0,
  );

  // Each overlay becomes one or more series, keyed by its label.
  $: overlaySeries = overlays.flatMap((overlay, i) => {
    const period = overlay.period ?? (overlay.type === "bollinger" ? 20 : 20);
    const color = overlay.color ?? i + 1;
    if (overlay.type === "sma") {
      return [
        {
          key: overlay.label ?? `SMA ${period}`,
          values: sma(closes, period),
          color,
          dashed: false,
        },
      ];
    }
    if (overlay.type === "ema") {
      return [
        {
          key: overlay.label ?? `EMA ${period}`,
          values: ema(closes, period),
          color,
          dashed: false,
        },
      ];
    }
    const bands = bollinger(closes, period);
    const label = overlay.label ?? `BB ${period}`;
    return [
      { key: `${label} upper`, values: bands.upper, color, dashed: true },
      { key: label, values: bands.middle, color, dashed: false },
      { key: `${label} lower`, values: bands.lower, color, dashed: true },
    ];
  });
  // One legend entry per overlay: the bands list their middle line only.
  $: legendKeys = overlaySeries.filter((e) => !e.dashed).map((e) => e.key);
  $: solidKeys = overlaySeries.filter((e) => !e.dashed).map((e) => e.key);
  $: dashedKeys = overlaySeries.filter((e) => e.dashed).map((e) => e.key);
  // The prices go in as series, so the tooltip, the table view, the CSV,
  // and the y domain all get them; overlays and volume join them.
  $: rows = periods.flatMap((period, i) => [
    .../** @type {const} */ (["open", "high", "low", "close"]).map((price) => ({
      x: period.x,
      series: text[price],
      value: period[price],
      datum: period.datum,
    })),
    ...overlaySeries.map((entry) => ({
      x: period.x,
      series: entry.key,
      value: entry.values[i],
      datum: period.datum,
    })),
    ...(volumeOf
      ? [
          {
            x: period.x,
            series: text.volume,
            value: period.volume,
            datum: period.datum,
          },
        ]
      : []),
  ]);
  $: colors = {
    [text.open]: "neutral",
    [text.high]: "neutral",
    [text.low]: "neutral",
    [text.close]: mode === "candles" ? "neutral" : "interactive",
    [text.volume]: "neutral",
    ...Object.fromEntries(overlaySeries.map((e) => [e.key, e.color])),
  };
  $: secondary = volumeOf ? [text.volume] : [];
  // Volume keeps to the bottom quarter of the pane.
  $: y2Domain = /** @type {[number, number]} */ ([0, maxVolume * 4 || 1]);
  $: changes = new Map(periods.map((p) => [p.x, p.close - p.open]));
  $: formatPrice = resolveFormat(yFormat, locale);

  // One pane per indicator, with its own rows and marks.
  $: panes = indicators.map((indicator) => {
    if (indicator.type === "rsi") {
      const period = indicator.period ?? 14;
      const key = indicator.label ?? `RSI ${period}`;
      const values = rsi(closes, period);
      return {
        type: "rsi",
        key,
        lines: [key],
        bars: [],
        rows: periods.map((p, i) => ({
          x: p.x,
          series: key,
          value: values[i],
          datum: p.datum,
        })),
        colors: { [key]: "interactive" },
        yDomain: /** @type {[number, number]} */ ([0, 100]),
      };
    }
    const fast = indicator.fast ?? 12;
    const slow = indicator.slow ?? 26;
    const signal = indicator.signal ?? 9;
    const key = indicator.label ?? `MACD ${fast}/${slow}/${signal}`;
    const out = macd(closes, fast, slow, signal);
    const signalKey = `${key} signal`;
    const histKey = `${key} histogram`;
    return {
      type: "macd",
      key,
      lines: [key, signalKey],
      bars: [histKey],
      rows: periods.flatMap((p, i) => [
        { x: p.x, series: key, value: out.macd[i], datum: p.datum },
        { x: p.x, series: signalKey, value: out.signal[i], datum: p.datum },
        { x: p.x, series: histKey, value: out.histogram[i], datum: p.datum },
      ]),
      colors: {
        [key]: "interactive",
        [signalKey]: "warning",
        [histKey]: "neutral",
      },
      yDomain: "nice",
    };
  });

  // Volume reads by the period's direction; a histogram by its sign.
  $: volumeColor = (/** @type {{ x: string }} */ row) =>
    (changes.get(row.x) ?? 0) >= 0 ? upColor : downColor;
  $: overview = periods.map((p, i) => ({ x: i, y: p.close }));

  /** @param {{ value: number | null }} row */
  function signColor(row) {
    return (row.value ?? 0) >= 0 ? "success" : "error";
  }

  /** @param {number} change */
  function formatChange(change) {
    return `${change > 0 ? "+" : ""}${formatPrice(change)}`;
  }
</script>

<div
  bind:this={ref}
  class:bx--viz-stock={true}
  role="group"
  aria-label={title || undefined}
  {...$$restProps}
>
  <!-- Prices move within a band far from zero, which the axis must not include. -->
  <Chart
    bind:zoom
    {title}
    {description}
    {height}
    {width}
    {colors}
    {yFormat}
    y2Format={volumeFormat}
    {y2Domain}
    {secondary}
    {loading}
    {emptyText}
    {locale}
    {xHeader}
    {margin}
    syncId={sync}
    data={rows}
    x="x"
    y="value"
    series="series"
    zero={false}
    legend={false}
    on:select
    on:hover
  >
    {#if grid}
      <ChartGrid />
    {/if}
    {#if panes.length === 0}
      <ChartAxis position="bottom" title={xTitle} />
    {/if}
    <ChartAxis position="left" />
    {#if volumeOf}
      <ChartBars
        series={[text.volume]}
        colorOf={volumeColor}
        class="bx--viz-stock__volume"
      />
    {/if}
    {#if mode === "candles"}
      <ChartCandles candles={periods} {hollow} {upColor} {downColor} />
    {:else if mode === "line"}
      <ChartLine series={[text.close]} curve="monotone" />
    {:else}
      <ChartArea series={[text.close]} curve="monotone" />
    {/if}
    {#if solidKeys.length > 0}
      <ChartLine series={solidKeys} curve="monotone" points="none" />
    {/if}
    {#if dashedKeys.length > 0}
      <ChartLine series={dashedKeys} curve="monotone" points="none" dashed />
    {/if}
    <slot />
    <svelte:fragment slot="toolbar">
      {#if toolbar}
        <ChartToolbar />
      {/if}
    </svelte:fragment>
    <svelte:fragment slot="tooltip">
      {#if tooltipProps}
        <ChartTooltip {...tooltipProps} let:xLabel let:points>
          <div class:bx--viz-chart-tooltip__title={true}>{xLabel}</div>
          {#each points as point (point.series)}
            <ChartTooltipRow label={String(point.series)} value={point.value} />
          {/each}
          <ChartTooltipRow
            indent
            label={text.change}
            value={formatChange(changes.get(xLabel) ?? 0)}
          />
        </ChartTooltip>
      {/if}
    </svelte:fragment>
    <svelte:fragment slot="legend">
      {#if legend && legendKeys.length > 0}
        <ChartLegend series={legendKeys} />
      {/if}
    </svelte:fragment>
    <svelte:fragment slot="zoom">
      {#if zoomBar && panes.length === 0}
        <ChartZoomBar />
      {/if}
    </svelte:fragment>
  </Chart>
  {#each panes as pane, i (pane.key)}
    <Chart
      bind:zoom
      title={pane.key}
      height={indicatorHeight}
      {width}
      colors={pane.colors}
      yDomain={pane.yDomain}
      {loading}
      {emptyText}
      {locale}
      {xHeader}
      {margin}
      syncId={sync}
      data={pane.rows}
      x="x"
      y="value"
      series="series"
      zero={pane.type === "macd"}
      legend={false}
      class="bx--viz-stock__pane"
    >
      {#if grid}
        <ChartGrid />
      {/if}
      {#if i === panes.length - 1}
        <ChartAxis position="bottom" title={xTitle} />
      {/if}
      <ChartAxis position="left" />
      {#if pane.type === "rsi"}
        <ChartThreshold y={70} kind="error" />
        <ChartThreshold y={30} kind="success" />
      {/if}
      {#if pane.bars.length > 0}
        <ChartBars
          series={pane.bars}
          colorOf={signColor}
          class="bx--viz-stock__histogram"
        />
      {/if}
      <ChartLine series={pane.lines} curve="monotone" points="none" />
      <svelte:fragment slot="tooltip">
        {#if tooltipProps}
          <ChartTooltip {...tooltipProps} />
        {/if}
      </svelte:fragment>
      <svelte:fragment slot="zoom">
        {#if zoomBar && i === panes.length - 1}
          <ChartZoomBar {overview} />
        {/if}
      </svelte:fragment>
    </Chart>
  {/each}
</div>
