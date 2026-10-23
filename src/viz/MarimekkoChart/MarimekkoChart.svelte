<svelte:options immutable />

<script>
  /**
   * @template [T=any]
   */

  /**
   * @event {{ x: string; series: string; value: number; share: number; columnShare: number; datum: T; index: number } | null} hover Fires when the pointer or keyboard focus moves to another cell, and with `null` when it leaves.
   * @event {{ x: string; series: string; value: number; share: number; columnShare: number; datum: T; index: number; originalEvent: Event }} select Fires when the focused cell is activated by click, Enter, or Space.
   */

  /** @restProps {figure} */

  /**
   * Specify the rows: one per category and series.
   * @type {ReadonlyArray<T>}
   */
  export let data = [];

  /**
   * Specify how to read a row's category, one column each: a key or a
   * function.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let x;

  /**
   * Specify how to read a row's value, which sets the cell's share of its
   * column.
   * @type {import("../utils/accessor.js").Accessor<T, number | null | undefined>}
   */
  export let y;

  /**
   * Specify how to read a row's series, one band each.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let series;

  /**
   * Specify how to read a column's size, which sets its width. Defaults
   * to the column's total, so the widths follow the values.
   * @type {import("../utils/accessor.js").Accessor<T, number | null | undefined>}
   */
  export let xValue = undefined;

  /**
   * Specify how to read a column's label. Defaults to its category.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let label = undefined;

  /**
   * Specify the column order: as given, or widest first.
   * @type {"none" | "value"}
   */
  export let sort = "none";

  /** Specify the title, shown as the caption and used as the accessible name */
  export let title = "";

  /** Set to `true` to show a skeleton while the data is on its way */
  export let loading = false;

  /**
   * Specify how column sizes are written: `Intl.NumberFormat` options or
   * a function. Shares are always written as percentages.
   * @type {import("../utils/format-compact.js").NumberFormat}
   */
  export let format = undefined;

  /**
   * Specify a fixed color per series.
   * @type {Record<string, import("../utils/tokens.js").VizColor>}
   */
  export let colors = {};

  /**
   * Specify which of Carbon's prescribed color groups to use (1-based).
   */
  export let palette = 1;

  /** Set to `false` to hide the legend */
  export let legend = true;

  /**
   * Specify the hidden group keys. Bind it: the legend toggles them. The
   * last visible group cannot be hidden.
   * @type {ReadonlyArray<string | number>}
   */
  export let hidden = [];

  /** Specify the accessible name of the legend */
  export let legendLabel = "Groups";

  /**
   * Specify which cells are labeled: those with room, or none.
   * @type {"auto" | "none"}
   */
  export let labels = "auto";

  /**
   * Specify the width in pixels, or `"auto"` to fill the container.
   * @type {number | "auto"}
   */
  export let width = "auto";

  // The width laid out at: the container's under `"auto"`, the nominal
  // 640 before it is measured.
  let measuredWidth = 0;
  $: layoutWidth = width === "auto" ? measuredWidth || 640 : width;

  /** Specify the height of the plot, in pixels */
  export let height = 320;

  /**
   * Specify the selected cell.
   * @type {{ x: string; series: string } | null}
   */
  export let selected = null;

  /**
   * Override the words used for assistive technology.
   * @type {{ series?: string; of?: string; ofAll?: string }}
   */
  export let words = {};

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

  import { createEventDispatcher, onMount } from "svelte";
  import ChartTooltipRow from "../Chart/ChartTooltipRow.svelte";
  import { toAccessor } from "../utils/accessor.js";
  import { formatPercent, resolveFormat } from "../utils/format-compact.js";
  import {
    colorGroups,
    dropGroups,
    listGroups,
    nextHidden,
  } from "../utils/group-legend.js";
  import { observeResize } from "../utils/resize-pool.js";
  import { createTooltipTiming } from "../utils/tooltip-timing.js";
  import { buildMarimekko } from "./marimekko-geometry.js";

  const dispatch = createEventDispatcher();
  const tooltipTiming = createTooltipTiming(150, {
    onUnpin: () => setActive(-1, -1),
  });
  const { shown: tooltipShown, pinned: tooltipPinned } = tooltipTiming;
  const HEADER = 28;

  /** @type {{ column: number; cell: number }} */
  let active = { column: -1, cell: -1 };

  $: xOf = toAccessor(x);
  $: yOf = toAccessor(y);
  $: seriesOf = toAccessor(series);
  $: groupKeysAll = listGroups(data, seriesOf);
  $: groupColorMap = colorGroups(groupKeysAll, palette, colors);
  $: hiddenSet = new Set(hidden.map(String));
  $: visibleRows = dropGroups(data, seriesOf, hiddenSet);
  $: xValueOf = xValue === undefined ? undefined : toAccessor(xValue);
  $: labelOf = label === undefined ? undefined : toAccessor(label);
  // Depends on the data and the options only, so hover never lays out again.
  $: m = buildMarimekko(visibleRows, {
    x: xOf,
    y: yOf,
    series: seriesOf,
    xValue: xValueOf,
    label: labelOf,
    sort,
    width: layoutWidth,
    height,
    palette,
    colors: groupColorMap,
  });
  $: total = height + HEADER;
  $: formatValue = resolveFormat(format, locale);
  $: text = { series: "Series", of: "of", ofAll: "of all", ...words };
  $: selectedKey = selected ? `${selected.x}\u0000${selected.series}` : null;
  $: current =
    active.column >= 0
      ? m.columns[active.column]?.cells[active.cell]
      : undefined;
  $: announcement = current ? describe(current) : "";

  /** @param {number} ratio */
  function pct(ratio) {
    return formatPercent(ratio, { locale, digits: 0 });
  }

  /** @param {import("./marimekko-geometry.js").MarimekkoCell<T>} cell */
  function columnOf(cell) {
    return /** @type {import("./marimekko-geometry.js").MarimekkoColumn<T>} */ (
      m.columns.find((column) => column.key === cell.column)
    );
  }

  /** @param {import("./marimekko-geometry.js").MarimekkoCell<T>} cell */
  function describe(cell) {
    const column = columnOf(cell);
    return `${cell.key}, ${column.label}: ${pct(cell.share)} ${text.of} ${column.label}, ${column.label} ${pct(column.share)} ${text.ofAll}`;
  }

  /** @param {import("./marimekko-geometry.js").MarimekkoCell<T>} cell */
  function detail(cell) {
    return {
      x: cell.column,
      series: cell.key,
      value: cell.value,
      share: cell.share,
      columnShare: columnOf(cell).share,
      datum: cell.datum,
      index: cell.index,
    };
  }

  /**
   * @param {number} column
   * @param {number} cell
   */
  function setActive(column, cell) {
    if (column === active.column && cell === active.cell) return;
    active = { column, cell };
    const hit = column >= 0 ? m.columns[column]?.cells[cell] : undefined;
    dispatch("hover", hit ? detail(hit) : null);
  }

  /**
   * @param {number} column
   * @param {number} cell
   * @param {Event} originalEvent
   */
  function select(column, cell, originalEvent) {
    setActive(column, cell);
    const hit = m.columns[column].cells[cell];
    const key = `${hit.column}\u0000${hit.key}`;
    selected = selectedKey === key ? null : { x: hit.column, series: hit.key };
    dispatch("select", { ...detail(hit), originalEvent });
  }

  /**
   * Left and Right move between columns, keeping the series when it is
   * there; Up and Down move within a column. Enter selects.
   * @param {KeyboardEvent} event
   */
  function onKeydown(event) {
    const columns = m.columns;
    if (columns.length === 0) return;
    let column = active.column;
    let cell = active.cell;
    const inColumn = (/** @type {number} */ c) =>
      Math.max(columns[c].cells.length - 1, 0);
    switch (event.key) {
      case "ArrowRight":
      case "ArrowLeft": {
        if (column < 0) {
          column = 0;
          cell = 0;
          break;
        }
        const step = event.key === "ArrowRight" ? 1 : -1;
        const next = Math.min(Math.max(column + step, 0), columns.length - 1);
        const key = columns[column].cells[cell]?.key;
        const same = columns[next].cells.findIndex(
          (entry) => entry.key === key,
        );
        column = next;
        cell = same >= 0 ? same : Math.min(cell, inColumn(next));
        break;
      }
      case "ArrowDown":
        if (column < 0) column = 0;
        cell = Math.min(cell + 1, inColumn(column));
        break;
      case "ArrowUp":
        if (column < 0) column = 0;
        cell = Math.max(cell - 1, 0);
        break;
      case "Home":
        column = 0;
        cell = 0;
        break;
      case "End":
        column = columns.length - 1;
        cell = inColumn(column);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (column >= 0) select(column, cell, event);
        return;
      case "Escape":
        tooltipTiming.unpin();
        setActive(-1, -1);
        return;
      default:
        return;
    }
    event.preventDefault();
    setActive(column, cell);
  }

  /**
   * Which labels fit a cell: the series name needs some width, the share
   * some height under it.
   * @param {import("./marimekko-geometry.js").MarimekkoCell<T>} cell
   */
  function room(cell) {
    const w = cell.x1 - cell.x0;
    const h = cell.y1 - cell.y0;
    const name = labels === "auto" && h >= 20 && w >= cell.key.length * 7 + 12;
    return { name, share: name && h >= 38 && w >= 40 };
  }
  $: tooltipTiming.settle(current);

  onMount(() => {
    if (width !== "auto" || !ref) return;
    return observeResize(ref, (measured) => {
      const rounded = Math.round(measured);
      if (rounded > 0) measuredWidth = rounded;
    });
  });

  /** @param {string} key */
  function toggleGroup(key) {
    const next = nextHidden(hidden, key, groupKeysAll.length);
    if (!next) return;
    hidden = next;
    dispatch("legend:toggle", { series: key, hidden: !hiddenSet.has(key) });
  }
  $: empty = !loading && data.length === 0;
</script>

<figure
  class:bx--viz-chart--loading={loading}
  class:bx--viz-chart--empty={empty}
  aria-busy={loading ? "true" : undefined}
  bind:this={ref}
  class:bx--viz-marimekko={true}
  class:bx--viz-marimekko--emphasis={active.column >= 0}
  {...$$restProps}
>
  {#if title}
    <figcaption class:bx--viz-chart__title={true}>{title}</figcaption>
  {/if}
  <div class:bx--viz-marimekko__plot={true} style:max-width="{layoutWidth}px">
    <!-- A chart is one tab stop. Arrow keys move between cells. -->
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <svg
      class:bx--viz-marimekko__svg={true}
      viewBox="0 0 {layoutWidth} {total}"
      role="application"
      aria-roledescription="chart"
      aria-label={title || undefined}
      tabindex="0"
      on:keydown={onKeydown}
      use:tooltipTiming.track
      on:pointerleave={() => $tooltipPinned || setActive(-1, -1)}
      on:click={() => tooltipTiming.togglePin()}
      on:blur={() => $tooltipPinned || setActive(-1, -1)}
    >
      <g aria-hidden="true">
        {#each m.columns as column, c (column.key)}
          <text
            class:bx--viz-marimekko__column-label={true}
            x={(column.x0 + column.x1) / 2}
            y={HEADER / 2}
            dy="0.32em"
            text-anchor="middle"
          >
            {#if column.x1 - column.x0 >= column.label.length * 7 + 40}
              {`${column.label} `}
              <tspan class:bx--viz-marimekko__column-share={true}>
                {pct(column.share)}
              </tspan>
            {:else if column.x1 - column.x0 >= 36}
              {pct(column.share)}
            {/if}
          </text>
          <g transform="translate(0 {HEADER})">
            {#each column.cells as cell, i (cell.key)}
              <!-- svelte-ignore a11y-click-events-have-key-events -->
              <!-- svelte-ignore a11y-mouse-events-have-key-events -->
              <!-- svelte-ignore a11y-no-static-element-interactions -->
              <g
                class:bx--viz-marimekko__cell={true}
                class:bx--viz-marimekko__cell--active={c === active.column &&
                  i === active.cell}
                class:bx--viz-marimekko__cell--selected={selectedKey ===
                  `${cell.column}\u0000${cell.key}`}
                style:--bx-viz-color={cell.color}
                on:click={(event) => select(c, i, event)}
                on:mouseenter={() => $tooltipPinned || setActive(c, i)}
              >
                <rect
                  class:bx--viz-marimekko__box={true}
                  x={cell.x0}
                  y={cell.y0}
                  width={Math.max(cell.x1 - cell.x0, 0)}
                  height={Math.max(cell.y1 - cell.y0, 0)}
                />
                {#if room(cell).name}
                  <text
                    class:bx--viz-marimekko__label={true}
                    x={cell.x0 + 6}
                    y={cell.y0 +
                      (room(cell).share ? 8 : (cell.y1 - cell.y0) / 2)}
                    dy="0.32em"
                  >
                    {cell.key}
                  </text>
                {/if}
                {#if room(cell).share}
                  <text
                    class:bx--viz-marimekko__label={true}
                    class:bx--viz-marimekko__label--share={true}
                    x={cell.x0 + 6}
                    y={cell.y0 + 24}
                    dy="0.32em"
                  >
                    {pct(cell.share)}
                  </text>
                {/if}
                <title>{describe(cell)}</title>
              </g>
            {/each}
          </g>
        {/each}
      </g>
    </svg>
    {#if current && $tooltipShown}
      {@const cx = (current.x0 + current.x1) / 2}
      {@const cy = HEADER + (current.y0 + current.y1) / 2}
      <div
        class:bx--viz-chart-tooltip={true}
        class:bx--viz-chart-tooltip--flipped={cx > layoutWidth / 2}
        aria-hidden="true"
        style:left="{(cx / layoutWidth) * 100}%"
        style:top="{(cy / total) * 100}%"
      >
        <ChartTooltipRow
          color={current.color}
          label="{current.key}, {columnOf(current).label}"
          value="{pct(current.share)} ({formatValue(current.value)})"
        />
      </div>
    {/if}
  </div>
  {#if legend && m.series.length > 0}
    <ul class:bx--viz-treemap__legend={true} aria-hidden="true">
      {#each m.series as entry (entry.key)}
        <li
          class:bx--viz-treemap__legend-item={true}
          style:--bx-viz-color={entry.color}
        >
          <span class:bx--viz-legend__swatch={true}></span>
          {key}
        </button>
      {/each}
    </ul>
  {/if}
  <!-- Every cell, for assistive technology: a series per row, a column
       per category with its share of the whole in the header. -->
  <table class:bx--visually-hidden={true}>
    {#if title}
      <caption>
        {title}
      </caption>
    {/if}
    <thead>
      <tr>
        <th scope="col">{text.series}</th>
        {#each m.columns as column (column.key)}
          <th scope="col">{column.label} ({pct(column.share)})</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each m.series as entry (entry.key)}
        <tr>
          <th scope="row">{entry.key}</th>
          {#each m.columns as column (column.key)}
            {@const cell = column.cells.find((c) => c.key === entry.key)}
            <td>{cell ? pct(cell.share) : ""}</td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
  <div class:bx--visually-hidden={true} aria-live="polite">{announcement}</div>
</figure>
