<svelte:options immutable />

<script>
  /**
   * @template [T=any]
   */

  /**
   * @event {{ datum: { x0: number; x1: number; x: number; count: number }; series: string | number; index: number; originalEvent: Event }} select Fires when the focused bin is activated by click, Enter, or Space.
   * @event {{ x: number; points: Array<{ datum: { x0: number; x1: number; x: number; count: number }; series: string | number; index: number; y: number }> } | null} hover Fires when the pointer or keyboard focus moves to another bin, and with `null` when it leaves.
   */

  /** @restProps {figure} */

  /**
   * Specify the rows to count into bins.
   * Ignored when `bins` is a list of bins.
   * @type {ReadonlyArray<T>}
   */
  export let data = [];

  /**
   * Specify how to read the value from a row: a key or a function.
   * @type {import("../utils/accessor.js").Accessor<T, number | null | undefined>}
   */
  export let x = undefined;

  /**
   * Specify a target bin count, a rule that derives one, or bins counted
   * elsewhere.
   * @type {number | "sturges" | "freedman-diaconis" | ReadonlyArray<import("../utils/bin.js").Bin>}
   */
  export let bins = "sturges";

  /**
   * Specify the range to bin over. Defaults to the extent of the values.
   * @type {readonly [number, number]}
   */
  export let domain = undefined;

  /**
   * Specify values to mark with a labelled rule, such as percentiles.
   * @type {ReadonlyArray<{ x: number; label?: string }>}
   */
  export let markers = [];

  /** Specify the title, shown as the caption and used as the accessible name */
  export let title = "";

  /** Specify a longer description, appended to the accessible name */
  export let description = "";

  /** Specify the height, in pixels */
  export let height = 288;

  /**
   * Specify the width in pixels, or `"auto"` to follow the container.
   * @type {number | "auto"}
   */
  export let width = "auto";

  /**
   * Specify the bar color.
   * @type {import("../utils/tokens.js").VizColor}
   */
  export let color = undefined;

  /**
   * Specify how counts are written: `Intl.NumberFormat` options or a function.
   * @type {import("../utils/format-compact.js").NumberFormat}
   */
  export let yFormat = undefined;

  /**
   * Override the x tick label format.
   * @type {(value: number) => string}
   */
  export let xFormat = undefined;

  /** Set to `true` while the data loads */
  export let loading = false;

  /** Specify the text shown in place of the plot when there is no data */
  export let emptyText = "No data";

  /**
   * Specify the locale.
   * @type {string}
   */
  export let locale = undefined;

  /** Specify the label of the series, used in the tooltip and the table */
  export let seriesLabel = "Count";

  /**
   * Specify how a bin's range is written in the tooltip, the table, and
   * announcements.
   * @type {(x0: number, x1: number) => string}
   */
  export let rangeFormat = undefined;

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

  /** Specify the x axis title */
  export let xTitle = "";

  /** Specify the y axis title */
  export let yTitle = "";

  /**
   * Specify the selected bin.
   * @type {{ series: string | number; index: number } | null}
   */
  export let selected = null;

  /**
   * Obtain a reference to the HTML element.
   * @bindable readonly
   * @type {null | HTMLElement}
   */
  export let ref = null;

  import Chart from "../Chart/Chart.svelte";
  import ChartAxis from "../Chart/ChartAxis.svelte";
  import ChartBins from "../Chart/ChartBins.svelte";
  import ChartGrid from "../Chart/ChartGrid.svelte";
  import ChartMarker from "../Chart/ChartMarker.svelte";
  import ChartToolbar from "../Chart/ChartToolbar.svelte";
  import ChartTooltip from "../Chart/ChartTooltip.svelte";
  import { toAccessor } from "../utils/accessor.js";
  import { bin } from "../utils/bin.js";
  import { formatCompact } from "../utils/format-compact.js";

  $: counted = count(data, x, bins, domain);
  $: rows = counted.map((entry) => ({
    x0: entry.x0,
    x1: entry.x1,
    x: (entry.x0 + entry.x1) / 2,
    count: entry.count,
  }));
  $: span =
    counted.length > 0
      ? /** @type {[number, number]} */ ([
          counted[0].x0,
          counted[counted.length - 1].x1,
        ])
      : undefined;
  // Hoisted: an inline accessor is a new function on every render.
  $: seriesOf = () => seriesLabel;
  $: colors = color === undefined ? undefined : { [seriesLabel]: color };
  $: writeRange =
    rangeFormat ??
    ((/** @type {number} */ from, /** @type {number} */ to) =>
      `${formatCompact(from, { locale })}–${formatCompact(to, { locale })}`);
  // Hover lands on a bin's midpoint: label it with the bin's range instead.
  $: byMid = new Map(rows.map((row) => [row.x, row]));
  $: label = (/** @type {number} */ mid) => {
    const row = byMid.get(mid);
    return row ? writeRange(row.x0, row.x1) : "";
  };

  /**
   * @param {ReadonlyArray<T>} list
   * @param {typeof x} accessor
   * @param {typeof bins} spec
   * @param {typeof domain} range
   */
  function count(list, accessor, spec, range) {
    if (typeof spec !== "number" && typeof spec !== "string") return spec;
    if (accessor === undefined) return [];
    const read = toAccessor(accessor);
    const values = new Array(list.length);
    for (let i = 0; i < list.length; i++) values[i] = read(list[i], i);
    return bin(values, { bins: spec, domain: range });
  }
</script>

<Chart
  bind:selected
  bind:view
  bind:ref
  {...$$restProps}
  {title}
  {description}
  {height}
  {width}
  {colors}
  {yFormat}
  {xFormat}
  {loading}
  {emptyText}
  {locale}
  data={rows}
  x="x"
  y="count"
  series={seriesOf}
  xDomain={span}
  xLabelFormat={label}
  zero
  on:select
  on:hover
>
  {#if grid}
    <ChartGrid />
  {/if}
  <ChartAxis position="bottom" title={xTitle} />
  <ChartAxis position="left" title={yTitle} />
  <ChartBins />
  {#each markers as marker (marker.x)}
    <ChartMarker x={marker.x} label={marker.label ?? ""} />
  {/each}
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
</Chart>
