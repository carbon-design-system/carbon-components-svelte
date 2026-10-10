<svelte:options immutable />

<script>
  /**
   * @template [T=any]
   */

  /**
   * @event {{ series: string; label: string; count: number; median: number; peak: number; datum: T } | null} hover Fires when the pointer or keyboard focus moves to another row, and with `null` when it leaves.
   * @event {{ series: string; label: string; count: number; median: number; peak: number; datum: T; originalEvent: Event }} select Fires when the focused row is activated by click, Enter, or Space.
   */

  /** @restProps {figure} */

  /**
   * Specify the rows, one per observation.
   * @type {ReadonlyArray<T>}
   */
  export let data = [];

  /**
   * Specify how to read an observation's value: a key or a function.
   * @type {import("../utils/accessor.js").Accessor<T, number | null | undefined>}
   */
  export let x;

  /**
   * Specify how to read an observation's series, one ridge each.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let series;

  /**
   * Specify how to read a series' label. Defaults to the series key.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let label = undefined;

  /**
   * Specify the row order: as given, or by median.
   * @type {"none" | "median"}
   */
  export let order = "none";

  /** Specify the title, shown as the caption and used as the accessible name */
  export let title = "";

  /** Specify the width, in pixels. It scales down with its container. */
  export let width = 640;

  /** Specify the height of a row, in pixels */
  export let rowHeight = 36;

  /** Specify how far a ridge may rise into the row above, as a share of the row */
  export let overlap = 0.8;

  /** Specify the room for the labels, in pixels */
  export let labelWidth = 96;

  /**
   * Specify the kernel bandwidth, in data units. Defaults to Silverman's
   * rule of thumb per series.
   * @type {number}
   */
  export let bandwidth = undefined;

  /**
   * Specify what colors a ridge: nothing, or its series.
   * @type {"none" | "series"}
   */
  export let colorBy = "none";

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
   * Specify how values are written: `Intl.NumberFormat` options or a function.
   * @type {import("../utils/format-compact.js").NumberFormat}
   */
  export let format = undefined;

  /** Specify the title of the value axis */
  export let xTitle = "";

  /**
   * Specify the selected series, as its key.
   * @type {string | null}
   */
  export let selected = null;

  /**
   * Override the column headers of the table for assistive technology.
   * @type {{ series?: string; count?: string; median?: string; peak?: string }}
   */
  export let headerLabels = {};

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
  import { buildRidgeline } from "./ridgeline-geometry.js";

  const dispatch = createEventDispatcher();
  const AXIS = 28;

  let active = -1;

  $: xOf = toAccessor(x);
  $: seriesOf = toAccessor(series);
  $: labelOf = label === undefined ? undefined : toAccessor(label);
  $: plotWidth = Math.max(width - labelWidth, 40);
  // Depends on the data and the options only, so hover never lays out again.
  $: ridge = buildRidgeline(data, {
    x: xOf,
    series: seriesOf,
    label: labelOf,
    order,
    width: plotWidth,
    rowHeight,
    overlap,
    bandwidth,
    colorBy,
    palette,
    colors,
  });
  $: total = ridge.height + AXIS + (xTitle ? 20 : 0);
  $: formatValue = resolveFormat(format, locale);
  $: headers = {
    series: "Series",
    count: "Count",
    median: "Median",
    peak: "Peak",
    ...headerLabels,
  };
  $: current = active >= 0 ? ridge.rows[active] : undefined;
  $: announcement = current ? describe(current) : "";

  /** @param {import("./ridgeline-geometry.js").RidgelineRow<T>} row */
  function describe(row) {
    if (row.count === 0) return `${row.label}: ${headers.count} 0`;
    return `${row.label}: ${headers.median} ${formatValue(row.median)}, ${headers.peak} ${formatValue(row.peak)}, ${headers.count} ${row.count}`;
  }

  /** @param {import("./ridgeline-geometry.js").RidgelineRow<T>} row */
  function detail(row) {
    return {
      series: row.key,
      label: row.label,
      count: row.count,
      median: row.median,
      peak: row.peak,
      datum: row.datum,
    };
  }

  /** @param {number} index */
  function setActive(index) {
    if (index === active) return;
    active = index;
    dispatch("hover", index >= 0 ? detail(ridge.rows[index]) : null);
  }

  /**
   * @param {number} index
   * @param {Event} originalEvent
   */
  function select(index, originalEvent) {
    setActive(index);
    const row = ridge.rows[index];
    selected = selected === row.key ? null : row.key;
    dispatch("select", { ...detail(row), originalEvent });
  }

  /** @param {KeyboardEvent} event */
  function onKeydown(event) {
    const last = ridge.rows.length - 1;
    if (last < 0) return;
    let next = active;
    switch (event.key) {
      case "ArrowDown":
      case "ArrowRight":
        next = Math.min(last, active + 1);
        break;
      case "ArrowUp":
      case "ArrowLeft":
        next = Math.max(0, active - 1);
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = last;
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
  class:bx--viz-ridgeline={true}
  class:bx--viz-ridgeline--emphasis={active >= 0}
  {...$$restProps}
>
  {#if title}
    <figcaption class:bx--viz-chart__title={true}>{title}</figcaption>
  {/if}
  <!-- A chart is one tab stop. Arrow keys walk the rows. -->
  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <svg
    class:bx--viz-ridgeline__svg={true}
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
      <g transform="translate({labelWidth} 0)">
        {#each ridge.ticks as tick (tick.value)}
          <line
            class:bx--viz-ridgeline__grid={true}
            x1={tick.x}
            x2={tick.x}
            y1={rowHeight * overlap}
            y2={ridge.height}
          />
          <text
            class:bx--viz-ridgeline__axis-label={true}
            x={tick.x}
            y={ridge.height + 8}
            dy="0.8em"
            text-anchor="middle"
          >
            {formatValue(tick.value)}
          </text>
        {/each}
        {#if xTitle}
          <text
            class:bx--viz-ridgeline__axis-title={true}
            x={plotWidth / 2}
            y={ridge.height + AXIS + 4}
            dy="0.8em"
            text-anchor="middle"
          >
            {xTitle}
          </text>
        {/if}
      </g>
      <!-- Later rows are drawn last, so each ridge sits in front of the
           one above it. -->
      {#each ridge.rows as row, i (row.key)}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-mouse-events-have-key-events -->
        <g
          class:bx--viz-ridgeline__row={true}
          class:bx--viz-ridgeline__row--active={i === active}
          class:bx--viz-ridgeline__row--selected={row.key === selected}
          style:--bx-viz-color={row.color}
          on:click={(event) => select(i, event)}
          on:mouseenter={() => setActive(i)}
          on:mouseleave={() => setActive(-1)}
        >
          <text
            class:bx--viz-ridgeline__label={true}
            x={labelWidth - 10}
            y={row.y}
            dy="-0.2em"
            text-anchor="end"
          >
            {row.label}
          </text>
          <g transform="translate({labelWidth} 0)">
            {#if row.area}
              <!-- An opaque coat first, so the ridge hides the one above
                   it and the overlap reads as depth. -->
              <path class:bx--viz-ridgeline__mask={true} d={row.area} />
              <path class:bx--viz-ridgeline__area={true} d={row.area} />
              <path class:bx--viz-ridgeline__line={true} d={row.line} />
            {/if}
            <line
              class:bx--viz-ridgeline__baseline={true}
              x1="0"
              x2={plotWidth}
              y1={row.y}
              y2={row.y}
            />
          </g>
          <title>{describe(row)}</title>
        </g>
      {/each}
    </g>
  </svg>
  <!-- Every series, for assistive technology. -->
  <table class:bx--visually-hidden={true}>
    {#if title}
      <caption>
        {title}
      </caption>
    {/if}
    <thead>
      <tr>
        <th scope="col">{headers.series}</th>
        <th scope="col">{headers.count}</th>
        <th scope="col">{headers.median}</th>
        <th scope="col">{headers.peak}</th>
      </tr>
    </thead>
    <tbody>
      {#each ridge.rows as row (row.key)}
        <tr>
          <th scope="row">{row.label}</th>
          <td>{row.count}</td>
          <td>{row.count ? formatValue(row.median) : ""}</td>
          <td>{row.count ? formatValue(row.peak) : ""}</td>
        </tr>
      {/each}
    </tbody>
  </table>
  <div class:bx--visually-hidden={true} aria-live="polite">{announcement}</div>
</figure>
