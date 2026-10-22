<svelte:options immutable />

<script>
  /**
   * @template T
   */

  /**
   * @event {{ axis: string; points: Array<{ series: string; value: number }> } | null} hover Fires when the pointer or keyboard focus moves to another spoke, and with `null` when it leaves.
   * @event {{ series: string; hidden: boolean }} legend:toggle Fires when a series is shown or hidden.
   */

  /** @restProps {figure} */

  /**
   * Specify the rows, in long format: one for each series on each spoke.
   * @type {ReadonlyArray<T>}
   */
  export let data = [];

  /**
   * Specify how to read the spoke from a row: a key or a function.
   * Spokes keep first-seen order, clockwise from 12 o'clock.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let axis;

  /**
   * Specify how to read the value from a row: a key or a function.
   * Every spoke shares one scale, so the values must share a unit.
   * @type {import("../utils/accessor.js").Accessor<T, number>}
   */
  export let value;

  /**
   * Specify how to read the series from a row: a key or a function.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let series = undefined;

  /** Specify the title, shown as the caption and used as the accessible name */
  export let title = "";

  /** Specify the radius of the plot, in pixels */
  export let radius = 120;

  /**
   * Specify the end of the radial scale.
   * Defaults to the largest value, rounded out.
   * @type {number}
   */
  export let max = undefined;

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
   * Specify a fixed color per series key.
   * @type {Record<string, import("../utils/tokens.js").VizColor>}
   */
  export let colors = {};

  /**
   * Specify the hidden series keys.
   * @type {ReadonlyArray<string>}
   */
  export let hidden = [];

  /** Set to `false` to hide the legend */
  export let legend = true;

  /** Specify the accessible name of the legend */
  export let legendLabel = "Series";

  /** Specify the header of the spoke column in the table for assistive technology */
  export let axisHeader = "Axis";

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
  import ChartTooltipRow from "../Chart/ChartTooltipRow.svelte";
  import { toAccessor } from "../utils/accessor.js";
  import { resolveFormat } from "../utils/format-compact.js";
  import { buildRadar, nearestSpoke } from "./radar-geometry.js";

  const dispatch = createEventDispatcher();
  /** Room for a spoke label on either side, and above and below. */
  const LABEL_X = 104;
  const LABEL_Y = 40;
  // Clear of the scale's top tick, which sits on the first spoke.
  const LABEL_OFFSET = 22;

  /** @type {SVGSVGElement | null} */
  let svg = null;
  let active = -1;

  $: width = (radius + LABEL_X) * 2;
  $: height = (radius + LABEL_Y) * 2;
  $: axisOf = toAccessor(axis);
  $: valueOf = toAccessor(value);
  $: seriesOf =
    series === undefined ? () => title || "Value" : toAccessor(series);
  // Depends on the data and the shape only, so hover never rebuilds it.
  $: radar = buildRadar(data, {
    axis: axisOf,
    value: valueOf,
    series: seriesOf,
    radius,
    cx: width / 2,
    cy: height / 2,
    max,
    hidden,
    palette,
    colors,
    labelOffset: LABEL_OFFSET,
  });
  $: formatValue = resolveFormat(format, locale);
  $: visible = radar.series.filter((entry) => !entry.hidden);
  $: spoke = radar.axes[active];
  $: announcement = spoke
    ? `${spoke.key}: ${visible
        .map((entry) => `${entry.key} ${formatValue(entry.values[active])}`)
        .join(", ")}`
    : "";

  /** @param {number} index */
  function setActive(index) {
    if (index === active) return;
    active = index;
    const at = radar.axes[index];
    dispatch(
      "hover",
      at
        ? {
            axis: at.key,
            points: visible.map((entry) => ({
              series: entry.key,
              value: entry.values[index],
            })),
          }
        : null,
    );
  }

  /** @param {PointerEvent} event */
  function onPointerMove(event) {
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0) return;
    const x = ((event.clientX - rect.left) / rect.width) * width;
    const y = ((event.clientY - rect.top) / rect.height) * height;
    setActive(nearestSpoke(x, y, width / 2, height / 2, radar.axes.length));
  }

  /** @param {KeyboardEvent} event */
  function onKeydown(event) {
    const count = radar.axes.length;
    if (count === 0) return;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      setActive((active + 1) % count);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      setActive((Math.max(active, 0) - 1 + count) % count);
    } else if (event.key === "Home") {
      setActive(0);
    } else if (event.key === "End") {
      setActive(count - 1);
    } else if (event.key === "Escape") {
      setActive(-1);
      return;
    } else {
      return;
    }
    event.preventDefault();
  }

  /** @param {string} key */
  function toggle(key) {
    const isHidden = hidden.includes(key);
    // Hiding the last visible series would leave an empty chart.
    if (!isHidden && visible.length <= 1) return;
    hidden = isHidden ? hidden.filter((k) => k !== key) : [...hidden, key];
    dispatch("legend:toggle", { series: key, hidden: !isHidden });
  }
</script>

<figure bind:this={ref} class:bx--viz-radar={true} {...$$restProps}>
  {#if title}
    <figcaption class:bx--viz-chart__title={true}>{title}</figcaption>
  {/if}
  <div class:bx--viz-radar__plot={true} style:max-width="{width}px">
    <!-- A chart is one tab stop. Arrow keys move between spokes. -->
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <svg
      bind:this={svg}
      class:bx--viz-radar__svg={true}
      viewBox="0 0 {width} {height}"
      role="application"
      aria-roledescription="chart"
      aria-label={title || undefined}
      tabindex="0"
      on:pointermove={onPointerMove}
      on:pointerleave={() => setActive(-1)}
      on:keydown={onKeydown}
      on:blur={() => setActive(-1)}
    >
      <g aria-hidden="true">
        {#each radar.rings as ring (ring.value)}
          <polygon class:bx--viz-radar__ring={true} points={ring.points} />
        {/each}
        {#each radar.axes as spokeAxis (spokeAxis.key)}
          <line
            class:bx--viz-radar__spoke={true}
            class:bx--viz-radar__spoke--active={spokeAxis.index === active}
            x1={width / 2}
            y1={height / 2}
            x2={spokeAxis.x}
            y2={spokeAxis.y}
          />
          <text
            class:bx--viz-radar__label={true}
            class:bx--viz-radar__label--active={spokeAxis.index === active}
            x={spokeAxis.labelX}
            y={spokeAxis.labelY}
            dy="0.32em"
            text-anchor={spokeAxis.anchor}
          >
            {spokeAxis.key}
          </text>
        {/each}
        {#each radar.rings as ring (ring.value)}
          <text
            class:bx--viz-radar__tick={true}
            x={width / 2 + 4}
            y={ring.labelY}
            dy="-0.2em"
          >
            {formatValue(ring.value)}
          </text>
        {/each}
        {#each visible as entry (entry.key)}
          <polygon
            class:bx--viz-radar__area={true}
            points={entry.points}
            style:--bx-viz-color={entry.color}
          />
          {#if active >= 0 && entry.vertices[active]}
            <circle
              class:bx--viz-radar__point={true}
              cx={entry.vertices[active].x}
              cy={entry.vertices[active].y}
              r="4"
              style:--bx-viz-color={entry.color}
            />
          {/if}
        {/each}
      </g>
    </svg>
    {#if spoke}
      <div
        class:bx--viz-chart-tooltip={true}
        class:bx--viz-chart-tooltip--flipped={spoke.x > width / 2}
        aria-hidden="true"
        style:left="{(spoke.x / width) * 100}%"
        style:top="{(spoke.y / height) * 100}%"
      >
        <div class:bx--viz-chart-tooltip__title={true}>{spoke.key}</div>
        {#each visible as entry (entry.key)}
          <ChartTooltipRow
            color={entry.color}
            label={entry.key}
            value={formatValue(entry.values[active])}
          />
        {/each}
      </div>
    {/if}
  </div>
  <!-- Every value, for assistive technology: a polygon says nothing to it. -->
  <table class:bx--visually-hidden={true}>
    {#if title}
      <caption>
        {title}
      </caption>
    {/if}
    <thead>
      <tr>
        <th scope="col">{axisHeader}</th>
        {#each visible as entry (entry.key)}
          <th scope="col">{entry.key}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each radar.axes as spokeAxis (spokeAxis.key)}
        <tr>
          <th scope="row">{spokeAxis.key}</th>
          {#each visible as entry (entry.key)}
            <td>{formatValue(entry.values[spokeAxis.index])}</td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
  <div class:bx--visually-hidden={true} aria-live="polite">{announcement}</div>
  {#if legend && radar.series.length > 1}
    <div class:bx--viz-legend={true} role="group" aria-label={legendLabel}>
      {#each radar.series as entry (entry.key)}
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
