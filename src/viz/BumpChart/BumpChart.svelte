<svelte:options immutable />

<script>
  /**
   * @template [T=any]
   */

  /**
   * @event {{ series: string; label: string; start: number | null; end: number | null; change: number; points: Array<{ period: string; rank: number; value: number | undefined; datum: T }> } | null} hover Fires when the pointer or keyboard focus moves to another line, and with `null` when it leaves.
   * @event {{ series: string; label: string; start: number | null; end: number | null; change: number; points: Array<{ period: string; rank: number; value: number | undefined; datum: T }>; originalEvent: Event }} select Fires when the focused line is activated by click, Enter, or Space.
   */

  /** @restProps {figure} */

  /**
   * Specify the rows: one per series and period.
   * @type {ReadonlyArray<T>}
   */
  export let data = [];

  /**
   * Specify how to read a row's period: a key or a function.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let x;

  /**
   * Specify how to read a row's rank, one the best. Leave out to rank by
   * `y` instead.
   * @type {import("../utils/accessor.js").Accessor<T, number | null | undefined>}
   */
  export let rank = undefined;

  /**
   * Specify how to read a row's value, ranked largest first within each
   * period when there is no `rank`.
   * @type {import("../utils/accessor.js").Accessor<T, number | null | undefined>}
   */
  export let y = undefined;

  /**
   * Specify how to read a row's series, which names each line.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let series;

  /**
   * Specify how to read a series' label. Defaults to the series key.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let label = undefined;

  /**
   * Specify the periods in order. Defaults to the order first seen.
   * @type {ReadonlyArray<string | number>}
   */
  export let periods = undefined;

  /** Specify the title, shown as the caption and used as the accessible name */
  export let title = "";

  /**
   * Specify a fixed color per series.
   * @type {Record<string, import("../utils/tokens.js").VizColor>}
   */
  export let colors = {};

  /**
   * Specify which of Carbon's prescribed color groups to use (1-based).
   */
  export let palette = 1;

  /**
   * Specify how values are written in the tooltip and the table:
   * `Intl.NumberFormat` options or a function.
   * @type {import("../utils/format-compact.js").NumberFormat}
   */
  export let format = undefined;

  /** Specify the width, in pixels. It scales down with its container. */
  export let width = 560;

  /** Specify the height of a rank row, in pixels */
  export let rowHeight = 32;

  /** Specify the room for the labels on each side, in pixels */
  export let labelWidth = 96;

  /**
   * Specify the selected series, as its key.
   * @type {string | null}
   */
  export let selected = null;

  /**
   * Override the words used for assistive technology.
   * @type {{ series?: string; rank?: string; up?: string; down?: string; same?: string }}
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

  import { createEventDispatcher } from "svelte";
  import { toAccessor } from "../utils/accessor.js";
  import { resolveFormat } from "../utils/format-compact.js";
  import { buildBump } from "./bump-geometry.js";

  const dispatch = createEventDispatcher();
  const HEADER = 24;
  const PAD = 6;

  let active = -1;

  $: xOf = toAccessor(x);
  $: rankOf = rank === undefined ? undefined : toAccessor(rank);
  $: yOf = y === undefined ? undefined : toAccessor(y);
  $: seriesOf = toAccessor(series);
  $: labelOf = label === undefined ? undefined : toAccessor(label);
  $: rowCount = countRanks(data, rankOf, yOf, seriesOf, xOf);
  $: height = rowCount * rowHeight;
  // Depends on the data and the options only, so hover never lays out again.
  $: bump = buildBump(data, {
    x: xOf,
    rank: rankOf,
    y: yOf,
    series: seriesOf,
    label: labelOf,
    periods,
    width,
    height,
    labelWidth,
    palette,
    colors,
  });
  $: total = height + HEADER + PAD * 2;
  $: formatValue = resolveFormat(format, locale);
  $: text = {
    series: "Series",
    rank: "rank",
    up: "up",
    down: "down",
    same: "unchanged",
    ...words,
  };
  $: current = active >= 0 ? bump.lines[active] : undefined;
  $: announcement = current ? describe(current) : "";

  /**
   * How many rank rows the plot needs: the largest rank given, or the
   * most series in any one period.
   * @param {ReadonlyArray<T>} rows
   * @param {((row: T, index: number) => unknown) | undefined} rankOf
   * @param {((row: T, index: number) => unknown) | undefined} yOf
   * @param {(row: T, index: number) => unknown} seriesOf
   * @param {(row: T, index: number) => unknown} xOf
   */
  function countRanks(rows, rankOf, yOf, seriesOf, xOf) {
    let most = 1;
    if (rankOf) {
      rows.forEach((row, i) => {
        const value = Number(rankOf(row, i));
        if (Number.isFinite(value)) most = Math.max(most, value);
      });
      return most;
    }
    /** @type {Map<string, Set<string>>} */
    const perPeriod = new Map();
    rows.forEach((row, i) => {
      if (yOf && !Number.isFinite(Number(yOf(row, i)))) return;
      const period = String(xOf(row, i));
      let set = perPeriod.get(period);
      if (!set) {
        set = new Set();
        perPeriod.set(period, set);
      }
      set.add(String(seriesOf(row, i)));
      most = Math.max(most, set.size);
    });
    return most;
  }

  /** @param {import("./bump-geometry.js").BumpLine<T>} line */
  function describe(line) {
    const first = line.points[0];
    const last = line.points[line.points.length - 1];
    if (!first || !last) return line.label;
    const moved =
      line.change > 0
        ? `${text.up} ${line.change}`
        : line.change < 0
          ? `${text.down} ${-line.change}`
          : text.same;
    return `${line.label}: ${text.rank} ${first.rank} ${first.period}, ${text.rank} ${last.rank} ${last.period}, ${moved}`;
  }

  /** @param {import("./bump-geometry.js").BumpLine<T>} line */
  function detail(line) {
    return {
      series: line.key,
      label: line.label,
      start: line.start,
      end: line.end,
      change: line.change,
      points: line.points.map((point) => ({
        period: point.period,
        rank: point.rank,
        value: point.value,
        datum: point.datum,
      })),
    };
  }

  /** @param {number} index */
  function setActive(index) {
    if (index === active) return;
    active = index;
    dispatch("hover", index >= 0 ? detail(bump.lines[index]) : null);
  }

  /**
   * @param {number} index
   * @param {Event} originalEvent
   */
  function select(index, originalEvent) {
    setActive(index);
    const line = bump.lines[index];
    selected = selected === line.key ? null : line.key;
    dispatch("select", { ...detail(line), originalEvent });
  }

  /**
   * Down and Up walk the lines by their final rank, Enter selects.
   * @param {KeyboardEvent} event
   */
  function onKeydown(event) {
    const lines = bump.lines;
    if (lines.length === 0) return;
    const order = lines
      .map((line, i) => ({ i, y: line.rightY }))
      .sort((a, b) => a.y - b.y)
      .map((entry) => entry.i);
    const at = order.indexOf(active);
    let next = active;
    switch (event.key) {
      case "ArrowDown":
      case "ArrowRight":
        next = order[Math.min(order.length - 1, at + 1)];
        break;
      case "ArrowUp":
      case "ArrowLeft":
        next = order[Math.max(0, at - 1)];
        break;
      case "Home":
        next = order[0];
        break;
      case "End":
        next = order[order.length - 1];
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (active >= 0) select(active, event);
        return;
      case "Escape":
        setActive(-1);
        return;
      default:
        return;
    }
    event.preventDefault();
    setActive(next);
  }
</script>

<figure
  bind:this={ref}
  class:bx--viz-bump={true}
  class:bx--viz-bump--emphasis={active >= 0}
  {...$$restProps}
>
  {#if title}
    <figcaption class:bx--viz-chart__title={true}>{title}</figcaption>
  {/if}
  <!-- A chart is one tab stop. Arrow keys walk the lines by final rank. -->
  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <svg
    class:bx--viz-bump__svg={true}
    viewBox="0 0 {width} {total}"
    style:max-width="{width}px"
    role="application"
    aria-roledescription="chart"
    aria-label={title || undefined}
    tabindex="0"
    on:keydown={onKeydown}
    on:blur={() => setActive(-1)}
  >
    <g aria-hidden="true">
      {#each bump.periods as period (period.key)}
        <text
          class:bx--viz-bump__period={true}
          x={period.x}
          y={HEADER / 2}
          dy="0.32em"
          text-anchor="middle"
        >
          {period.key}
        </text>
      {/each}
      <g transform="translate(0 {HEADER + PAD})">
        {#each bump.ranks as row (row.rank)}
          <line
            class:bx--viz-bump__row={true}
            x1={bump.x0}
            x2={bump.x1}
            y1={row.y}
            y2={row.y}
          />
        {/each}
        {#each bump.lines as line, i (line.key)}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-mouse-events-have-key-events -->
          <g
            class:bx--viz-bump__series={true}
            class:bx--viz-bump__series--active={i === active}
            class:bx--viz-bump__series--selected={line.key === selected}
            style:--bx-viz-color={line.color}
            on:click={(event) => select(i, event)}
            on:mouseenter={() => setActive(i)}
            on:mouseleave={() => setActive(-1)}
          >
            <!-- A wide, invisible line keeps the thin one easy to hover. -->
            <path class:bx--viz-bump__hit={true} d={line.d} />
            <path class:bx--viz-bump__line={true} d={line.d} />
            {#each line.points as point (point.period)}
              <circle
                class:bx--viz-bump__dot={true}
                cx={point.x}
                cy={point.y}
                r="9"
              />
              <text
                class:bx--viz-bump__rank={true}
                x={point.x}
                y={point.y}
                dy="0.32em"
                text-anchor="middle"
              >
                {point.rank}
              </text>
            {/each}
            {#if line.points.length > 0}
              <text
                class:bx--viz-bump__label={true}
                x={bump.x0 - 14}
                y={line.leftY}
                dy="0.32em"
                text-anchor="end"
              >
                {line.label}
              </text>
              <text
                class:bx--viz-bump__label={true}
                x={bump.x1 + 14}
                y={line.rightY}
                dy="0.32em"
              >
                {line.label}
              </text>
            {/if}
            <title>{describe(line)}</title>
          </g>
        {/each}
      </g>
    </g>
  </svg>
  <!-- Every rank, for assistive technology. -->
  <table class:bx--visually-hidden={true}>
    {#if title}
      <caption>
        {title}
      </caption>
    {/if}
    <thead>
      <tr>
        <th scope="col">{text.series}</th>
        {#each bump.periods as period (period.key)}
          <th scope="col">{period.key}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each bump.lines as line (line.key)}
        <tr>
          <th scope="row">{line.label}</th>
          {#each bump.periods as period, at (period.key)}
            {@const point = line.points.find((entry) => entry.at === at)}
            <td>
              {point
                ? point.value === undefined
                  ? point.rank
                  : `${point.rank} (${formatValue(point.value)})`
                : ""}
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
  <div class:bx--visually-hidden={true} aria-live="polite">{announcement}</div>
</figure>
