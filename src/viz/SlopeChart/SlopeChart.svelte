<svelte:options immutable />

<script>
  /**
   * @template [T=any]
   */

  /**
   * @event {{ series: string; label: string; from: number; to: number; change: number; direction: "up" | "down" | "flat"; fromDatum: T; toDatum: T } | null} hover Fires when the pointer or keyboard focus moves to another line, and with `null` when it leaves.
   * @event {{ series: string; label: string; from: number; to: number; change: number; direction: "up" | "down" | "flat"; fromDatum: T; toDatum: T; originalEvent: Event }} select Fires when the focused line is activated by click, Enter, or Space.
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
   * Specify how to read a row's value.
   * @type {import("../utils/accessor.js").Accessor<T, number | null | undefined>}
   */
  export let y;

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
   * Specify the two periods to compare, in order. Defaults to the first
   * two in the data.
   * @type {ReadonlyArray<string | number>}
   */
  export let periods = undefined;

  /** Specify the title, shown as the caption and used as the accessible name */
  export let title = "";

  /**
   * Specify what colors a line: whether it went up or down, its series,
   * or nothing.
   * @type {"direction" | "series" | "none"}
   */
  export let colorBy = "direction";

  /**
   * Specify which direction is good. `"down"` suits cost and latency.
   * @type {"up" | "down"}
   */
  export let positive = "up";

  /**
   * Specify a fixed color per series. Applies with `colorBy="series"`.
   * @type {Record<string, import("../utils/tokens.js").VizColor>}
   */
  export let colors = {};

  /**
   * Specify which of Carbon's prescribed color groups to use (1-based).
   */
  export let palette = 1;

  /** Set to `true` to force the scale to include zero */
  export let zero = false;

  /**
   * Specify how values are written: `Intl.NumberFormat` options or a function.
   * @type {import("../utils/format-compact.js").NumberFormat}
   */
  export let format = undefined;

  /** Specify the width, in pixels. It scales down with its container. */
  export let width = 480;

  /** Specify the height of the plot, in pixels */
  export let height = 240;

  /** Specify the room for the labels on each side, in pixels */
  export let labelWidth = 128;

  /**
   * Specify the selected series, as its key.
   * @type {string | null}
   */
  export let selected = null;

  /**
   * Override the column headers of the table for assistive technology.
   * @type {{ series?: string; change?: string }}
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
  import { buildSlope } from "./slope-geometry.js";

  const dispatch = createEventDispatcher();
  const HEADER = 24;
  const PAD = 6;

  let active = -1;

  $: xOf = toAccessor(x);
  $: yOf = toAccessor(y);
  $: seriesOf = toAccessor(series);
  $: labelOf = label === undefined ? undefined : toAccessor(label);
  // Depends on the data and the options only, so hover never lays out again.
  $: slope = buildSlope(data, {
    x: xOf,
    y: yOf,
    series: seriesOf,
    label: labelOf,
    periods,
    width,
    height,
    labelWidth,
    zero,
    palette,
    colors,
  });
  $: total = height + HEADER + PAD * 2;
  $: formatValue = resolveFormat(format, locale);
  $: headers = { series: "Series", change: "Change", ...headerLabels };
  // Which way is good is a prop, so the tone is derived, not called in
  // the markup.
  $: tones = slope.lines.map((line) => tone(line.direction, positive));
  $: current = active >= 0 ? slope.lines[active] : undefined;
  $: announcement = current
    ? `${current.label}: ${formatValue(current.from)} ${slope.periods[0]}, ${formatValue(current.to)} ${slope.periods[1]}, ${formatChange(current.change)}`
    : "";

  /** @param {number} change */
  function formatChange(change) {
    return `${change > 0 ? "+" : ""}${formatValue(change)}`;
  }

  /**
   * The good and bad of a direction, given which way is good.
   * @param {"up" | "down" | "flat"} direction
   * @param {"up" | "down"} good
   */
  function tone(direction, good) {
    if (direction === "flat") return "flat";
    return (direction === "up") === (good === "up") ? "good" : "bad";
  }

  /** @param {import("./slope-geometry.js").SlopeLine<T>} line */
  function detail(line) {
    return {
      series: line.key,
      label: line.label,
      from: line.from,
      to: line.to,
      change: line.change,
      direction: line.direction,
      fromDatum: line.fromDatum,
      toDatum: line.toDatum,
    };
  }

  /** @param {number} index */
  function setActive(index) {
    if (index === active) return;
    active = index;
    dispatch("hover", index >= 0 ? detail(slope.lines[index]) : null);
  }

  /**
   * @param {number} index
   * @param {Event} originalEvent
   */
  function select(index, originalEvent) {
    setActive(index);
    const line = slope.lines[index];
    selected = selected === line.key ? null : line.key;
    dispatch("select", { ...detail(line), originalEvent });
  }

  /**
   * Down and Up walk the lines from the top of the first column, Enter
   * selects.
   * @param {KeyboardEvent} event
   */
  function onKeydown(event) {
    const lines = slope.lines;
    if (lines.length === 0) return;
    // Reading order is top to bottom on the left.
    const order = lines
      .map((line, i) => ({ i, y: line.leftY }))
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
  class:bx--viz-slope={true}
  class:bx--viz-slope--emphasis={active >= 0}
  {...$$restProps}
>
  {#if title}
    <figcaption class:bx--viz-chart__title={true}>{title}</figcaption>
  {/if}
  <!-- A chart is one tab stop. Arrow keys walk the lines top to bottom. -->
  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <svg
    class:bx--viz-slope__svg={true}
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
      <text
        class:bx--viz-slope__period={true}
        x={slope.x0}
        y={HEADER / 2}
        dy="0.32em"
        text-anchor="middle"
      >
        {slope.periods[0]}
      </text>
      <text
        class:bx--viz-slope__period={true}
        x={slope.x1}
        y={HEADER / 2}
        dy="0.32em"
        text-anchor="middle"
      >
        {slope.periods[1]}
      </text>
      <g transform="translate(0 {HEADER + PAD})">
        <line
          class:bx--viz-slope__column={true}
          x1={slope.x0}
          x2={slope.x0}
          y1="0"
          y2={height}
        />
        <line
          class:bx--viz-slope__column={true}
          x1={slope.x1}
          x2={slope.x1}
          y1="0"
          y2={height}
        />
        {#each slope.lines as line, i (line.key)}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-mouse-events-have-key-events -->
          <g
            class:bx--viz-slope__series={true}
            class="bx--viz-slope__series--{colorBy === "direction"
              ? tones[i]
              : colorBy}"
            class:bx--viz-slope__series--active={i === active}
            class:bx--viz-slope__series--selected={line.key === selected}
            style:--bx-viz-color={colorBy === "series" ? line.color : undefined}
            on:click={(event) => select(i, event)}
            on:mouseenter={() => setActive(i)}
            on:mouseleave={() => setActive(-1)}
          >
            <!-- A wide, invisible line keeps the thin one easy to hover. -->
            <line
              class:bx--viz-slope__hit={true}
              x1={slope.x0}
              y1={line.y1}
              x2={slope.x1}
              y2={line.y2}
            />
            <line
              class:bx--viz-slope__line={true}
              x1={slope.x0}
              y1={line.y1}
              x2={slope.x1}
              y2={line.y2}
            />
            <circle
              class:bx--viz-slope__dot={true}
              cx={slope.x0}
              cy={line.y1}
              r="3.5"
            />
            <circle
              class:bx--viz-slope__dot={true}
              cx={slope.x1}
              cy={line.y2}
              r="3.5"
            />
            <text
              class:bx--viz-slope__label={true}
              x={slope.x0 - 10}
              y={line.leftY}
              dy="0.32em"
              text-anchor="end"
            >
              {`${line.label} `}
              <tspan class:bx--viz-slope__value={true}>
                {formatValue(line.from)}
              </tspan>
            </text>
            <text
              class:bx--viz-slope__label={true}
              x={slope.x1 + 10}
              y={line.rightY}
              dy="0.32em"
            >
              <tspan class:bx--viz-slope__value={true}>
                {`${formatValue(line.to)} `}
              </tspan>
              {line.label}
            </text>
            <title>
              {line.label}: {formatValue(line.from)} to
              {formatValue(line.to)}, {formatChange(line.change)}
            </title>
          </g>
        {/each}
      </g>
    </g>
  </svg>
  <!-- Every line, for assistive technology. -->
  <table class:bx--visually-hidden={true}>
    {#if title}
      <caption>
        {title}
      </caption>
    {/if}
    <thead>
      <tr>
        <th scope="col">{headers.series}</th>
        <th scope="col">{slope.periods[0]}</th>
        <th scope="col">{slope.periods[1]}</th>
        <th scope="col">{headers.change}</th>
      </tr>
    </thead>
    <tbody>
      {#each slope.lines as line (line.key)}
        <tr>
          <th scope="row">{line.label}</th>
          <td>{formatValue(line.from)}</td>
          <td>{formatValue(line.to)}</td>
          <td>{formatChange(line.change)}</td>
        </tr>
      {/each}
    </tbody>
  </table>
  <div class:bx--visually-hidden={true} aria-live="polite">{announcement}</div>
</figure>
