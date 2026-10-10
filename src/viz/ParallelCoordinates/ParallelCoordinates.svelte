<svelte:options immutable />

<script>
  /**
   * @template T
   */

  /**
   * The line type is written inline: a typedef cannot carry the generic
   * into the generated declarations.
   * @event {{ index: number; label: string; series: string; values: number[]; datum: T } | null} hover Fires when the pointer or keyboard focus moves to another row, and with `null` when it leaves.
   * @event {{ line: { index: number; label: string; series: string; values: number[]; datum: T }; originalEvent: Event }} select Fires when the focused row is activated by click, Enter, or Space.
   * @event {{ brushes: Record<string, [number, number]>; data: T[] }} brush Fires when a brush changes, with every brush and the rows that pass them all.
   * @event {{ series: string; hidden: boolean }} legend:toggle Fires when a series is shown or hidden.
   */

  /** @restProps {figure} */

  /**
   * Specify the rows, one line each, with a field per dimension.
   * @type {ReadonlyArray<T>}
   */
  export let data = [];

  /**
   * Specify the dimensions, one axis each: field names, or objects with a
   * `key`, a `label`, and a fixed `domain`.
   * @type {ReadonlyArray<string | { key: string; label?: string; domain?: readonly [number, number] }>}
   */
  export let dimensions = [];

  /**
   * Specify how to read a row's series, which sets its color: a key or a
   * function.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let series = undefined;

  /**
   * Specify how to read a row's label, shown when it is hovered.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let label = undefined;

  /** Specify the title, shown as the caption and used as the accessible name */
  export let title = "";

  /** Specify the width the chart is drawn at. It scales to its container. */
  export let width = 640;

  /** Specify the height the chart is drawn at */
  export let height = 320;

  /**
   * Specify how values are written: `Intl.NumberFormat` options or a function.
   * @type {import("../utils/format-compact.js").NumberFormat}
   */
  export let format = undefined;

  /**
   * Specify which of Carbon's prescribed color groups to use (1-based).
   */
  export let palette = 1;

  /**
   * Specify a fixed color per series.
   * @type {Record<string, import("../utils/tokens.js").VizColor>}
   */
  export let colors = {};

  /**
   * Specify the hidden series.
   * @type {ReadonlyArray<string>}
   */
  export let hidden = [];

  /**
   * Specify the brushes: a value range per dimension key. Rows outside any
   * range fade. Drag along an axis to set one, double click it to clear it.
   * @type {Record<string, readonly [number, number]>}
   */
  export let brushes = {};

  /** Set to `false` to forbid brushing */
  export let brush = true;

  /** Set to `false` to hide the legend, which lists the series */
  export let legend = true;

  /** Specify the accessible name of the legend */
  export let legendLabel = "Series";

  /** Specify the header of the row column for assistive technology */
  export let rowHeader = "Row";

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
  import { rafThrottle } from "../../utils/raf-throttle.js";
  import ChartTooltipRow from "../Chart/ChartTooltipRow.svelte";
  import { toAccessor } from "../utils/accessor.js";
  import { resolveFormat } from "../utils/format-compact.js";
  import {
    buildParallel,
    nearestLine,
    passesBrushes,
  } from "./parallel-geometry.js";

  const dispatch = createEventDispatcher();
  const MARGIN = { top: 36, right: 40, bottom: 24, left: 40 };
  const HIT = 24;

  /** @type {SVGSVGElement | null} */
  let svg = null;
  let active = -1;
  /** @type {{ index: number; key: string; from: number } | null} */
  let drag = null;

  $: plot = {
    x0: MARGIN.left,
    x1: width - MARGIN.right,
    y0: MARGIN.top,
    y1: height - MARGIN.bottom,
  };
  $: seriesOf = series === undefined ? undefined : toAccessor(series);
  $: labelOf = label === undefined ? undefined : toAccessor(label);
  // Depends on the data and the shape only, so hover and brushing never
  // rebuild it.
  $: built = buildParallel(data, {
    dimensions,
    series: seriesOf,
    label: labelOf,
    hidden,
    palette,
    colors,
    plot,
  });
  $: ranges = rangesOf(brushes);
  $: lines = built.lines.map((line) => ({
    ...line,
    kept: passesBrushes(line.values, ranges),
  }));
  $: formatValue = resolveFormat(format, locale);
  $: visible = lines.filter((line) => !line.hidden);
  $: current = active >= 0 ? lines[active] : undefined;
  $: announcement = current
    ? `${current.label}: ${built.axes
        .map((axis) => `${axis.label} ${write(current.values[axis.index])}`)
        .join(", ")}`
    : "";

  /**
   * The brushes as index ranges over the axes. Computed on demand as well
   * as reactively, since an event fires before the reactive value catches up.
   * @param {Record<string, readonly [number, number]>} map
   */
  function rangesOf(map) {
    return built.axes
      .filter((axis) => map[axis.key] !== undefined)
      .map((axis) => ({
        index: axis.index,
        key: axis.key,
        range: map[axis.key],
      }));
  }

  /** @param {number} value */
  function write(value) {
    return Number.isFinite(value) ? formatValue(value) : "–";
  }

  /** @param {(typeof lines)[number]} line */
  function detail(line) {
    return {
      index: line.index,
      label: line.label,
      series: line.series,
      values: line.values,
      datum: line.datum,
    };
  }

  /** @param {number} index */
  function setActive(index) {
    if (index === active) return;
    active = index;
    dispatch("hover", index >= 0 ? detail(lines[index]) : null);
  }

  /** @param {Event} originalEvent */
  function selectActive(originalEvent) {
    if (current) dispatch("select", { line: detail(current), originalEvent });
  }

  /** @param {PointerEvent} event */
  function toChart(event) {
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    return {
      x: ((event.clientX - rect.left) / rect.width) * width,
      y: ((event.clientY - rect.top) / rect.height) * height,
    };
  }

  const onPointerMove = rafThrottle((/** @type {PointerEvent} */ event) => {
    const at = toChart(event);
    if (!at) return;
    if (drag) {
      const axis = built.axes[drag.index];
      const to = axis.scale.invert(Math.min(Math.max(at.y, plot.y0), plot.y1));
      setBrush(drag.key, [drag.from, to]);
      return;
    }
    setActive(nearestLine(lines, built.axes, at.x, at.y));
  });

  /**
   * @param {PointerEvent} event
   * @param {(typeof built.axes)[number]} axis
   */
  function onAxisDown(event, axis) {
    if (!brush || event.button !== 0) return;
    const at = toChart(event);
    if (!at) return;
    const target = /** @type {Element} */ (event.currentTarget);
    target.setPointerCapture?.(event.pointerId);
    const from = axis.scale.invert(Math.min(Math.max(at.y, plot.y0), plot.y1));
    drag = { index: axis.index, key: axis.key, from };
    setActive(-1);
    event.preventDefault();
  }

  function onPointerUp() {
    if (!drag) return;
    const range = brushes[drag.key];
    // A click without a drag clears nothing and brushes nothing.
    if (range && range[0] === range[1]) clearBrush(drag.key);
    drag = null;
  }

  /**
   * @param {string} key
   * @param {[number, number]} range
   */
  function setBrush(key, range) {
    const low = Math.min(range[0], range[1]);
    const high = Math.max(range[0], range[1]);
    brushes = { ...brushes, [key]: [low, high] };
    announceBrush();
  }

  /** @param {string} key */
  function clearBrush(key) {
    if (brushes[key] === undefined) return;
    const { [key]: gone, ...rest } = brushes;
    brushes = rest;
    announceBrush();
  }

  function announceBrush() {
    const kept = rangesOf(brushes);
    dispatch("brush", {
      brushes,
      data: built.lines
        .filter((line) => passesBrushes(line.values, kept))
        .map((line) => line.datum),
    });
  }

  /** @param {KeyboardEvent} event */
  function onKeydown(event) {
    const order = visible.map((line) => line.index);
    const last = order.length - 1;
    if (last < 0) return;
    const at = order.indexOf(active);
    let next = at;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        next = Math.min(last, at + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        next = Math.max(0, at - 1);
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
        selectActive(event);
        return;
      case "Escape":
        setActive(-1);
        return;
      default:
        return;
    }
    event.preventDefault();
    setActive(order[next]);
  }

  /** @param {string} key */
  function toggle(key) {
    const isHidden = hidden.includes(key);
    const shown = built.series.filter((entry) => !entry.hidden);
    // Hiding the last visible series would leave an empty chart.
    if (!isHidden && shown.length <= 1) return;
    hidden = isHidden ? hidden.filter((k) => k !== key) : [...hidden, key];
    dispatch("legend:toggle", { series: key, hidden: !isHidden });
  }

  onMount(() => () => onPointerMove.cancel());
</script>

<figure
  bind:this={ref}
  class:bx--viz-parallel={true}
  class:bx--viz-parallel--brushing={drag !== null}
  class:bx--viz-parallel--emphasis={active >= 0}
  {...$$restProps}
>
  {#if title}
    <figcaption class:bx--viz-chart__title={true}>{title}</figcaption>
  {/if}
  <div class:bx--viz-parallel__plot={true} style:max-width="{width}px">
    <!-- A chart is one tab stop. Arrow keys move between rows. -->
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <svg
      bind:this={svg}
      class:bx--viz-parallel__svg={true}
      viewBox="0 0 {width} {height}"
      role="application"
      aria-roledescription="chart"
      aria-label={title || undefined}
      tabindex="0"
      on:pointermove={onPointerMove}
      on:pointerup={onPointerUp}
      on:pointercancel={onPointerUp}
      on:pointerleave={() => setActive(-1)}
      on:click={selectActive}
      on:keydown={onKeydown}
      on:blur={() => setActive(-1)}
    >
      <g aria-hidden="true">
        {#each visible as line (line.id)}
          <path
            class:bx--viz-parallel__line={true}
            class:bx--viz-parallel__line--faded={!line.kept}
            class:bx--viz-parallel__line--active={line.index === active}
            d={line.d}
            style:--bx-viz-color={line.color}
          />
        {/each}
        {#each built.axes as axis (axis.key)}
          <g class:bx--viz-parallel__axis={true}>
            <line
              class:bx--viz-parallel__axis-line={true}
              x1={axis.x}
              x2={axis.x}
              y1={plot.y0}
              y2={plot.y1}
            />
            {#each axis.ticks as tick (tick.value)}
              <line
                class:bx--viz-parallel__tick={true}
                x1={axis.x - 4}
                x2={axis.x}
                y1={tick.y}
                y2={tick.y}
              />
              <text
                class:bx--viz-parallel__tick-label={true}
                x={axis.x - 6}
                y={tick.y}
                dy="0.32em"
                text-anchor="end"
              >
                {formatValue(tick.value)}
              </text>
            {/each}
            <text
              class:bx--viz-parallel__label={true}
              x={axis.x}
              y={plot.y0 - 14}
              text-anchor="middle"
            >
              {axis.label}
            </text>
            {#if brushes[axis.key]}
              <rect
                class:bx--viz-parallel__brush={true}
                x={axis.x - 6}
                width="12"
                y={Math.min(
                  axis.scale.map(brushes[axis.key][0]),
                  axis.scale.map(brushes[axis.key][1]),
                )}
                height={Math.abs(
                  axis.scale.map(brushes[axis.key][1]) -
                    axis.scale.map(brushes[axis.key][0]),
                )}
              />
            {/if}
            {#if brush}
              <!-- A wide, invisible strip along the axis to drag on. -->
              <!-- svelte-ignore a11y-no-static-element-interactions -->
              <rect
                class:bx--viz-parallel__hit={true}
                x={axis.x - HIT / 2}
                width={HIT}
                y={plot.y0}
                height={plot.y1 - plot.y0}
                on:pointerdown={(event) => onAxisDown(event, axis)}
                on:dblclick={() => clearBrush(axis.key)}
              />
            {/if}
          </g>
        {/each}
      </g>
    </svg>
    {#if current}
      <div
        class:bx--viz-chart-tooltip={true}
        class:bx--viz-chart-tooltip--flipped={true}
        aria-hidden="true"
        style:left="{((plot.x1 + MARGIN.right / 2) / width) * 100}%"
        style:top="{(plot.y0 / height) * 100}%"
      >
        <div class:bx--viz-chart-tooltip__title={true}>{current.label}</div>
        {#each built.axes as axis (axis.key)}
          <ChartTooltipRow
            color={axis.index === 0 ? current.color : ""}
            label={axis.label}
            value={write(current.values[axis.index])}
          />
        {/each}
      </div>
    {/if}
  </div>
  <!-- Every value, for assistive technology: a tangle of lines says nothing to it. -->
  <table class:bx--visually-hidden={true}>
    {#if title}
      <caption>
        {title}
      </caption>
    {/if}
    <thead>
      <tr>
        <th scope="col">{rowHeader}</th>
        {#each built.axes as axis (axis.key)}
          <th scope="col">{axis.label}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each visible as line (line.id)}
        <tr>
          <th scope="row">{line.label}</th>
          {#each built.axes as axis (axis.key)}
            <td>{write(line.values[axis.index])}</td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
  <div class:bx--visually-hidden={true} aria-live="polite">{announcement}</div>
  {#if legend && built.series.length > 1}
    <div class:bx--viz-legend={true} role="group" aria-label={legendLabel}>
      {#each built.series as entry (entry.key)}
        <button
          type="button"
          class:bx--viz-legend__item={true}
          class:bx--viz-legend__item--hidden={entry.hidden}
          aria-pressed={!entry.hidden}
          style:--bx-viz-color={entry.color}
          on:click={() => toggle(entry.key)}
        >
          <span class:bx--viz-legend__swatch={true}></span>
          {entry.key}
        </button>
      {/each}
    </div>
  {/if}
</figure>
