<svelte:options immutable />

<script>
  /**
   * @template T
   */

  /**
   * @event {{ x: number; points: Array<{ series: string; value: number | null }>; originalEvent: Event }} select Fires when a column is activated by click or keyboard. Requires `selectable`.
   * @event {{ x: number; points: Array<{ series: string; value: number | null }> } | null} hover Fires when the pointer or keyboard focus moves to another x, and with `null` when it leaves.
   */

  /** @restProps {figure} */

  /**
   * Specify the rows, one per series per x.
   * @type {ReadonlyArray<T>}
   */
  export let data = [];

  /**
   * Specify how to read a row's x: a `Date` or a number.
   * @type {import("../utils/accessor.js").Accessor<T, Date | number>}
   */
  export let x;

  /**
   * Specify how to read a row's value.
   * @type {import("../utils/accessor.js").Accessor<T, number | null | undefined>}
   */
  export let y;

  /**
   * Specify how to read a row's series, one row of the chart each.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let series = undefined;

  /** Specify the title, shown as the caption and used as the accessible name */
  export let title = "";

  /** Set to `true` to show a skeleton while the data is on its way */
  export let loading = false;

  /** Specify the text shown when there is no data */
  export let emptyText = "No data";

  /** Set to `true` to show the error state instead of the data */
  export let error = false;

  /** Specify the text shown in the error state */
  export let errorText = "Could not load this chart";

  /** Specify how many layers each series is cut into */
  export let bands = 3;

  /**
   * Specify the value that fills every layer. Defaults to the largest
   * magnitude in the data, rounded out.
   * @type {number}
   */
  export let max = undefined;

  /**
   * Specify the width in pixels, or `"auto"` to fill the container.
   * @type {number | "auto"}
   */
  export let width = "auto";

  // The width laid out at: the container's under `"auto"`, the nominal
  // 640 before it is measured.
  let measuredWidth = 0;
  $: layoutWidth = width === "auto" ? measuredWidth || 640 : width;

  /** Set to `true` to make columns selectable */
  export let selectable = false;

  /**
   * Specify the selected x value.
   * @type {number | null}
   */
  export let selected = null;

  /** Specify the height of one row, in pixels */
  export let rowHeight = 20;

  /**
   * Specify how many rows the loading and empty states reserve, so the chart
   * holds its height until the data arrives.
   */
  export let placeholderRows = 4;

  /** Specify the room for row labels, in pixels */
  export let labelSpace = 96;

  /**
   * Specify the hue of the ramp.
   * @type {import("../utils/tokens.js").VizSequentialHue}
   */
  export let hue = "blue";

  /**
   * Specify the hue of values below zero.
   * @type {import("../utils/tokens.js").VizSequentialHue}
   */
  export let negativeHue = "purple";

  /**
   * Specify how values are written: `Intl.NumberFormat` options or a function.
   * @type {import("../utils/format-compact.js").NumberFormat}
   */
  export let format = undefined;

  /**
   * Share hover with every chart that has the same id.
   * @type {string}
   */
  export let syncId = undefined;

  /** Set to `true` to place time ticks on UTC boundaries */
  export let utc = false;

  /**
   * Override the column headers of the table for assistive technology.
   * @type {{ series?: string; latest?: string; min?: string; max?: string }}
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

  import { createEventDispatcher, onMount } from "svelte";
  import { rafThrottle } from "../../utils/raf-throttle.js";
  import ChartTooltipRow from "../Chart/ChartTooltipRow.svelte";
  import { joinSync } from "../Chart/sync.js";
  import { toAccessor } from "../utils/accessor.js";
  import { resolveFormat } from "../utils/format-compact.js";
  import { bisectNearest } from "../utils/nearest-point.js";
  import { nextId } from "../utils/next-id.js";
  import { observeResize } from "../utils/resize-pool.js";
  import { createTooltipTiming } from "../utils/tooltip-timing.js";
  import { buildHorizon } from "./horizon-geometry.js";

  const dispatch = createEventDispatcher();
  const tooltipTiming = createTooltipTiming(150, {
    onUnpin: () => setActive(-1),
    onHide: () => setActive(-1),
  });
  const { shown: tooltipShown, pinned: tooltipPinned } = tooltipTiming;
  const AXIS = 20;
  const clipId = nextId("bx-viz-horizon");

  /** @type {SVGSVGElement | null} */
  let svg = null;
  /** Index into the distinct xs, or -1. */
  let active = -1;
  // Whether the chart that drives a synced hover shows its tooltip.
  let syncShown = false;
  let tooltipVisible = false;
  tooltipTiming.shown.subscribe((value) => {
    tooltipVisible = value;
    if (value && active >= 0 && !syncShown) {
      sync?.publish({ kind: "hover", x: horizon.xs[active], shown: true });
    }
  });
  /** @type {ReturnType<typeof joinSync> | null} */
  let sync = null;
  let mounted = false;

  $: xOf = toAccessor(x);
  $: yOf = toAccessor(y);
  $: seriesOf = series === undefined ? undefined : toAccessor(series);
  $: plot = { x0: labelSpace, x1: layoutWidth - 8 };
  // Depends on the data and the shape only, so hover never rebuilds it.
  $: horizon = buildHorizon(data, {
    x: xOf,
    y: yOf,
    series: seriesOf,
    bands,
    max,
    plot,
    rowHeight,
    hue,
    negativeHue,
    locale,
    utc,
  });
  $: height = horizon.series.length * rowHeight + AXIS;
  $: formatValue = resolveFormat(format, locale);
  $: headers = {
    series: "Series",
    latest: "Latest",
    min: "Lowest",
    max: "Highest",
    ...headerLabels,
  };
  $: at = active >= 0 ? horizon.xs[active] : undefined;
  $: points =
    at === undefined
      ? []
      : horizon.series.map((entry) => {
          const i = entry.xs.indexOf(at);
          return {
            series: entry.key,
            value: i >= 0 && Number.isFinite(entry.ys[i]) ? entry.ys[i] : null,
          };
        });
  $: announcement =
    at === undefined
      ? ""
      : `${horizon.xLabel(at)}: ${points
          .map((point) => `${point.series} ${write(point.value)}`)
          .join(", ")}`;
  $: joinOrLeave(syncId, mounted);

  /** @param {number | null} value */
  function write(value) {
    return value === null ? "–" : formatValue(value);
  }

  /**
   * @param {number} index
   * @param {boolean} [fromSync]
   */
  function setActive(index, fromSync = false) {
    if (index === active) return;
    active = index;
    if (!fromSync) syncShown = false;
    const value = index >= 0 ? horizon.xs[index] : null;
    if (!fromSync)
      sync?.publish({ kind: "hover", x: value, shown: tooltipVisible });
    dispatch(
      "hover",
      value === null ? null : { x: value, points: pointsAt(value) },
    );
  }

  /**
   * @param {string | undefined} id
   * @param {boolean} ready
   */
  function joinOrLeave(id, ready) {
    sync?.leave();
    sync =
      ready && id
        ? joinSync(id, (message) => {
            if (message.kind !== "hover") return;
            // The tooltip keeps the source's timing: it waits while the
            // source's waits and shows when the source's has.
            syncShown = message.shown;
            setActive(
              message.x === null ? -1 : bisectNearest(horizon.xs, message.x),
              true,
            );
          })
        : null;
  }

  const onPointerMove = rafThrottle((/** @type {PointerEvent} */ event) => {
    if ($tooltipPinned) return;
    tooltipTiming.enter();
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0) return;
    const px = ((event.clientX - rect.left) / rect.width) * layoutWidth;
    setActive(bisectNearest(horizon.xs, horizon.x.invert(px)));
  });

  /** @param {KeyboardEvent} event */
  function onKeydown(event) {
    const last = horizon.xs.length - 1;
    if (last < 0) return;
    let next = active;
    switch (event.key) {
      case "ArrowRight":
        next = Math.min(last, active + 1);
        break;
      case "ArrowLeft":
        next = Math.max(0, active - 1);
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = last;
        break;
      case "Escape":
        tooltipTiming.unpin();
        setActive(-1);
        return;
      case "Enter":
      case " ":
        select(event);
        event.preventDefault();
        return;
      default:
        return;
    }
    event.preventDefault();
    setActive(next);
  }

  /** @param {Event} originalEvent */
  function select(originalEvent) {
    if (!selectable || active < 0) return;
    const x = horizon.xs[active];
    selected = selected === x ? null : x;
    dispatch("select", { x, points: pointsAt(x), originalEvent });
  }

  /** @param {number} value */
  function pointsAt(value) {
    return horizon.series.map((entry) => {
      const i = entry.xs.indexOf(value);
      return {
        series: entry.key,
        value: i >= 0 && Number.isFinite(entry.ys[i]) ? entry.ys[i] : null,
      };
    });
  }

  onMount(() => {
    mounted = true;
    return () => {
      onPointerMove.cancel();
      sync?.leave();
    };
  });
  $: tooltipTiming.settle(at, syncShown ? "sync" : undefined);

  onMount(() => {
    if (width !== "auto" || !ref) return;
    return observeResize(ref, (measured) => {
      const rounded = Math.round(measured);
      if (rounded > 0) measuredWidth = rounded;
    });
  });
  $: empty = !loading && !error && data.length === 0;
  $: placeholderHeight = placeholderRows * rowHeight + AXIS;
</script>

<figure
  bind:this={ref}
  class:bx--viz-horizon={true}
  class:bx--viz-chart--loading={loading}
  class:bx--viz-chart--empty={empty}
  class:bx--viz-chart--error={error}
  aria-busy={loading ? "true" : undefined}
  {...$$restProps}
>
  {#if title}
    <figcaption class:bx--viz-chart__title={true}>{title}</figcaption>
  {/if}
  <div class:bx--viz-horizon__plot={true} style:max-width="{layoutWidth}px">
    <!-- A chart is one tab stop. Arrow keys move along x. -->
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <svg
      bind:this={svg}
      class:bx--viz-horizon__svg={true}
      viewBox="0 0 {layoutWidth} {height}"
      role="application"
      aria-roledescription="chart"
      aria-label={title || undefined}
      tabindex="0"
      on:pointermove={onPointerMove}
      on:pointerleave={tooltipTiming.leave}
      on:click={() => tooltipTiming.togglePin()}
      on:click={select}
      on:keydown={onKeydown}
      use:tooltipTiming.track
      on:blur={() => $tooltipPinned || setActive(-1)}
    >
      <defs>
        <clipPath id={clipId}>
          <rect
            x={plot.x0}
            y="0"
            width={plot.x1 - plot.x0}
            height={rowHeight}
          />
        </clipPath>
      </defs>
      <g aria-hidden="true">
        {#each horizon.series as entry (entry.key)}
          <g
            class:bx--viz-horizon__row={true}
            transform="translate(0 {entry.index * rowHeight})"
          >
            <rect
              class:bx--viz-horizon__track={true}
              x={plot.x0}
              y="0"
              width={plot.x1 - plot.x0}
              height={rowHeight}
            />
            <g clip-path="url(#{clipId})">
              {#each entry.bands as band (band.level)}
                <path
                  class:bx--viz-horizon__band={true}
                  d={band.d}
                  style:--bx-viz-color={band.color}
                />
              {/each}
            </g>
            <text
              class:bx--viz-horizon__label={true}
              x={plot.x0 - 8}
              y={rowHeight / 2}
              dy="0.32em"
              text-anchor="end"
            >
              {entry.key}
            </text>
          </g>
        {/each}
        {#each horizon.ticks as tick (tick.value)}
          <text
            class:bx--viz-horizon__tick={true}
            x={tick.px}
            y={height - 4}
            text-anchor="middle"
          >
            {tick.label}
          </text>
        {/each}
        {#if selected !== null && horizon.xs.includes(selected)}
          <line
            class:bx--viz-horizon__ruler={true}
            class:bx--viz-horizon__ruler--selected={true}
            x1={horizon.x.map(selected)}
            x2={horizon.x.map(selected)}
            y1="0"
            y2={height - AXIS}
          />
        {/if}
        {#if at !== undefined}
          <line
            class:bx--viz-horizon__ruler={true}
            x1={horizon.x.map(at)}
            x2={horizon.x.map(at)}
            y1="0"
            y2={height - AXIS}
          />
        {/if}
      </g>
    </svg>
    {#if at !== undefined && $tooltipShown}
      <div
        class:bx--viz-chart-tooltip={true}
        class:bx--viz-chart-tooltip--flipped={horizon.x.map(at) >
          layoutWidth / 2}
        aria-hidden="true"
        style:left="{(horizon.x.map(at) / layoutWidth) * 100}%"
        style:top="0"
      >
        <div class:bx--viz-chart-tooltip__title={true}>
          {horizon.xLabel(at)}
        </div>
        {#each points as point (point.series)}
          <ChartTooltipRow label={point.series} value={write(point.value)} />
        {/each}
      </div>
    {/if}
  </div>
  <!-- A summary of every series, for assistive technology: the bands are
       for the eye, and every sample would be too many to read. -->
  <table class:bx--visually-hidden={true}>
    {#if title}
      <caption>
        {title}
      </caption>
    {/if}
    <thead>
      <tr>
        <th scope="col">{headers.series}</th>
        <th scope="col">{headers.latest}</th>
        <th scope="col">{headers.min}</th>
        <th scope="col">{headers.max}</th>
      </tr>
    </thead>
    <tbody>
      {#each horizon.series as entry (entry.key)}
        <tr>
          <th scope="row">{entry.key}</th>
          <td>{write(Number.isFinite(entry.last) ? entry.last : null)}</td>
          <td>{write(Number.isFinite(entry.min) ? entry.min : null)}</td>
          <td>{write(Number.isFinite(entry.max) ? entry.max : null)}</td>
        </tr>
      {/each}
    </tbody>
  </table>
  <div class:bx--visually-hidden={true} aria-live="polite">{announcement}</div>
  {#if loading}
    <div
      class:bx--viz-chart__state={true}
      style:block-size="{placeholderHeight}px"
      aria-hidden="true"
    >
      <div
        class:bx--viz-chart__skeleton={true}
        class:bx--skeleton__placeholder={true}
      ></div>
    </div>
  {:else if error}
    <div
      class:bx--viz-chart__state={true}
      style:block-size="{placeholderHeight}px"
    >
      <div class:bx--viz-chart__error={true}>
        <slot name="error">{errorText}</slot>
      </div>
    </div>
  {:else if empty}
    <div
      class:bx--viz-chart__state={true}
      style:block-size="{placeholderHeight}px"
    >
      <div class:bx--viz-chart__empty={true}>
        <slot name="empty">{emptyText}</slot>
      </div>
    </div>
  {/if}
</figure>
