<svelte:options immutable />

<script>
  /**
   * @template T
   */

  /**
   * @event {{ datum: { x: string; stat: string; value: number }; series: string | number; index: number; originalEvent: Event }} select Fires when the focused group is activated by click, Enter, or Space.
   * @event {{ x: number; points: Array<{ datum: { x: string; stat: string; value: number }; series: string | number; index: number; y: number }> } | null} hover Fires when the pointer or keyboard focus moves to another group, and with `null` when it leaves.
   */

  /** @restProps {figure} */

  /**
   * Specify the rows: one for each observation.
   * @type {ReadonlyArray<T>}
   */
  export let data = [];

  /**
   * Specify how to read the group from a row: a key or a function.
   * Each group becomes a swarm.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let x;

  /**
   * Specify how to read the value from a row: a key or a function.
   * @type {import("../utils/accessor.js").Accessor<T, number | null | undefined>}
   */
  export let y;

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
   * Specify the orientation. `"horizontal"` lists the groups down the left.
   * @type {"vertical" | "horizontal"}
   */
  export let orientation = "vertical";

  /**
   * Specify the color.
   * @type {import("../utils/tokens.js").VizColor}
   */
  export let color = undefined;

  /**
   * Specify how values are written: `Intl.NumberFormat` options or a function.
   * @type {import("../utils/format-compact.js").NumberFormat}
   */
  export let yFormat = undefined;

  /**
   * Override the names of the statistics, used in the tooltip, the table,
   * and announcements.
   * @type {{ max?: string; q3?: string; median?: string; q1?: string; min?: string; count?: string }}
   */
  export let statLabels = {};

  /** Specify the gap around a swarm, as a fraction of the slot */
  export let padding = 0.2;

  /** Specify the radius of a dot, in pixels */
  export let radius = 3;

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

  /** Specify the title of the x (group) axis */
  export let xTitle = "";

  /** Specify the title of the y (value) axis */
  export let yTitle = "";

  /** Set to `true` while the data loads */
  export let loading = false;

  /** Specify the text shown in place of the plot when there is no data */
  export let emptyText = "No data";

  /**
   * Specify the locale.
   * @type {string}
   */
  export let locale = undefined;

  /**
   * Obtain a reference to the HTML element.
   * @bindable readonly
   * @type {null | HTMLElement}
   */
  export let ref = null;

  import Chart from "../Chart/Chart.svelte";
  import ChartAxis from "../Chart/ChartAxis.svelte";
  import ChartGrid from "../Chart/ChartGrid.svelte";
  import ChartSwarm from "../Chart/ChartSwarm.svelte";
  import ChartToolbar from "../Chart/ChartToolbar.svelte";
  import ChartTooltip from "../Chart/ChartTooltip.svelte";
  import ChartTooltipRow from "../Chart/ChartTooltipRow.svelte";
  import { groupBy, toAccessor } from "../utils/accessor.js";
  import { boxStats } from "../utils/quantiles.js";

  $: labels = {
    max: "Maximum",
    q3: "Upper quartile",
    median: "Median",
    q1: "Lower quartile",
    min: "Minimum",
    count: "Count",
    ...statLabels,
  };
  $: summary = summarize(data, x, y);
  // The five statistics go in as series, highest first, so the tooltip, the
  // table view, the CSV, and the y domain all get them with no extra work.
  $: rows = summary.flatMap((group) =>
    /** @type {const} */ (["max", "q3", "median", "q1", "min"]).map((stat) => ({
      x: group.x,
      stat: labels[stat],
      value:
        stat === "max"
          ? group.whiskerHigh
          : stat === "min"
            ? group.whiskerLow
            : group[stat],
    })),
  );
  $: counts = new Map(summary.map((group) => [group.x, group.count]));
  $: colors =
    color === undefined
      ? undefined
      : Object.fromEntries(
          [labels.max, labels.q3, labels.median, labels.q1, labels.min].map(
            (name) => [name, color],
          ),
        );

  /**
   * @param {ReadonlyArray<T>} list
   * @param {typeof x} groupAccessor
   * @param {typeof y} valueAccessor
   */
  function summarize(list, groupAccessor, valueAccessor) {
    const groupOf = toAccessor(groupAccessor);
    const readValue = toAccessor(valueAccessor);
    const groups = [];
    for (const [key, members] of groupBy(list, groupOf)) {
      const values = members.map((row, i) => readValue(row, i));
      const stats = boxStats(values);
      if (stats) groups.push({ x: String(key), values, ...stats });
    }
    return groups;
  }
</script>

<!-- A swarm shows every value, which forcing zero onto the axis would squash. -->
<Chart
  bind:view
  bind:ref
  {...$$restProps}
  {title}
  {description}
  {height}
  {width}
  {orientation}
  {colors}
  {yFormat}
  {loading}
  {emptyText}
  {locale}
  data={rows}
  x="x"
  y="value"
  series="stat"
  zero={false}
  on:select
  on:hover
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
  <ChartSwarm swarms={summary} {padding} {radius} />
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
            label={labels.count}
            value={String(counts.get(xLabel) ?? "")}
          />
        </ChartTooltip>
      </slot>
    {/if}
  </svelte:fragment>
</Chart>
