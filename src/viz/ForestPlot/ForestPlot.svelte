<svelte:options immutable />

<script>
  /**
   * @template [T=any]
   */

  /**
   * @event {{ label: string; estimate: number; lo: number; hi: number; weight: number | undefined; clear: boolean; datum: T; index: number } | null} hover Fires when the pointer or keyboard focus moves to another row, and with `null` when it leaves.
   * @event {{ label: string; estimate: number; lo: number; hi: number; weight: number | undefined; clear: boolean; datum: T; index: number; originalEvent: Event }} select Fires when the focused row is activated by click, Enter, or Space.
   */

  /** @restProps {figure} */

  /**
   * Specify the rows, one per study, experiment, or segment.
   * @type {ReadonlyArray<T>}
   */
  export let data = [];

  /**
   * Specify how to read a row's label: a key or a function.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let label;

  /**
   * Specify how to read a row's point estimate.
   * @type {import("../utils/accessor.js").Accessor<T, number | null | undefined>}
   */
  export let estimate;

  /**
   * Specify how to read the low end of a row's interval.
   * @type {import("../utils/accessor.js").Accessor<T, number | null | undefined>}
   */
  export let lo;

  /**
   * Specify how to read the high end of a row's interval.
   * @type {import("../utils/accessor.js").Accessor<T, number | null | undefined>}
   */
  export let hi;

  /**
   * Specify how to read a row's weight, which sizes its marker.
   * @type {import("../utils/accessor.js").Accessor<T, number | null | undefined>}
   */
  export let weight = undefined;

  /**
   * Specify the pooled estimate, drawn as a diamond in a row of its own.
   * @type {{ estimate: number; lo: number; hi: number; label?: string } | null}
   */
  export let overall = null;

  /**
   * Specify the value of no effect, drawn as a line: 1 for a ratio, 0 for
   * a difference.
   * @type {number}
   */
  export let nullValue = undefined;

  /**
   * Specify the scale. A ratio reads best on a log scale, where doubling
   * and halving are the same distance.
   * @type {"linear" | "log"}
   */
  export let scale = "linear";

  /** Specify the title, shown as the caption and used as the accessible name */
  export let title = "";

  /**
   * Specify how values are written: `Intl.NumberFormat` options or a function.
   * @type {import("../utils/format-compact.js").NumberFormat}
   */
  export let format = undefined;

  /** Specify the width, in pixels. It scales down with its container. */
  export let width = 640;

  /** Specify the height of a row, in pixels */
  export let rowHeight = 32;

  /** Specify the room for the labels, in pixels */
  export let labelWidth = 128;

  /** Specify the room for the written values, in pixels. Set `0` to hide them. */
  export let valueWidth = 144;

  /**
   * Specify the selected row, as its label.
   * @type {string | null}
   */
  export let selected = null;

  /**
   * Override the words used for assistive technology.
   * @type {{ row?: string; estimate?: string; interval?: string; weight?: string; clear?: string; crosses?: string }}
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
  import { buildForest } from "./forest-geometry.js";

  const dispatch = createEventDispatcher();
  const AXIS = 24;
  const PAD = 8;

  let active = -1;

  $: labelOf = toAccessor(label);
  $: estimateOf = toAccessor(estimate);
  $: loOf = toAccessor(lo);
  $: hiOf = toAccessor(hi);
  $: weightOf = weight === undefined ? undefined : toAccessor(weight);
  $: plotWidth = Math.max(width - labelWidth - valueWidth - PAD * 2, 40);
  // Depends on the data and the options only, so hover never lays out again.
  $: forest = buildForest(data, {
    label: labelOf,
    estimate: estimateOf,
    lo: loOf,
    hi: hiOf,
    weight: weightOf,
    overall,
    nullValue,
    scale,
    plotWidth,
    rowHeight,
  });
  $: total = forest.height + AXIS;
  $: formatValue = resolveFormat(format, locale);
  $: text = {
    row: "Row",
    estimate: "Estimate",
    interval: "Interval",
    weight: "Weight",
    clear: "clear of the null",
    crosses: "crosses the null",
    ...words,
  };
  $: current = active >= 0 ? forest.rows[active] : undefined;
  $: announcement = current ? describe(current) : "";

  /**
   * @param {{ label: string; estimate: number; lo: number; hi: number; clear: boolean }} row
   */
  function describe(row) {
    const parts = [
      `${row.label}: ${formatValue(row.estimate)} (${formatValue(row.lo)}, ${formatValue(row.hi)})`,
    ];
    if (nullValue !== undefined)
      parts.push(row.clear ? text.clear : text.crosses);
    return parts.join(", ");
  }

  /** @param {import("./forest-geometry.js").ForestRow<T>} row */
  function detail(row) {
    return {
      label: row.label,
      estimate: row.estimate,
      lo: row.lo,
      hi: row.hi,
      weight: Number.isFinite(row.weight) ? row.weight : undefined,
      clear: row.clear,
      datum: row.row,
      index: row.index,
    };
  }

  /** @param {number} index */
  function setActive(index) {
    if (index === active) return;
    active = index;
    dispatch("hover", index >= 0 ? detail(forest.rows[index]) : null);
  }

  /**
   * @param {number} index
   * @param {Event} originalEvent
   */
  function select(index, originalEvent) {
    setActive(index);
    const row = forest.rows[index];
    selected = selected === row.label ? null : row.label;
    dispatch("select", { ...detail(row), originalEvent });
  }

  /** @param {KeyboardEvent} event */
  function onKeydown(event) {
    const last = forest.rows.length - 1;
    if (last < 0) return;
    let next = active;
    switch (event.key) {
      case "ArrowDown":
        next = Math.min(last, active + 1);
        break;
      case "ArrowUp":
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
  class:bx--viz-forest={true}
  class:bx--viz-forest--emphasis={active >= 0}
  {...$$restProps}
>
  {#if title}
    <figcaption class:bx--viz-chart__title={true}>{title}</figcaption>
  {/if}
  <!-- A chart is one tab stop. Arrow keys walk the rows. -->
  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <svg
    class:bx--viz-forest__svg={true}
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
      <g transform="translate({labelWidth + PAD} 0)">
        {#if forest.nullX !== null}
          <line
            class:bx--viz-forest__null={true}
            x1={forest.nullX}
            x2={forest.nullX}
            y1="0"
            y2={forest.height}
          />
        {/if}
        {#each forest.ticks as tick (tick.value)}
          <line
            class:bx--viz-forest__tick={true}
            x1={tick.x}
            x2={tick.x}
            y1={forest.height}
            y2={forest.height + 4}
          />
          <text
            class:bx--viz-forest__axis-label={true}
            x={tick.x}
            y={forest.height + 8}
            dy="0.8em"
            text-anchor="middle"
          >
            {formatValue(tick.value)}
          </text>
        {/each}
      </g>
      {#each forest.rows as row, i (row.label)}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-mouse-events-have-key-events -->
        <g
          class:bx--viz-forest__row={true}
          class:bx--viz-forest__row--clear={row.clear}
          class:bx--viz-forest__row--active={i === active}
          class:bx--viz-forest__row--selected={row.label === selected}
          on:click={(event) => select(i, event)}
          on:mouseenter={() => setActive(i)}
          on:mouseleave={() => setActive(-1)}
        >
          <rect
            class:bx--viz-forest__band={true}
            x="0"
            y={row.y - rowHeight / 2}
            {width}
            height={rowHeight}
          />
          <text
            class:bx--viz-forest__label={true}
            x={labelWidth}
            y={row.y}
            dy="0.32em"
            text-anchor="end"
          >
            {row.label}
          </text>
          <g transform="translate({labelWidth + PAD} 0)">
            <line
              class:bx--viz-forest__whisker={true}
              x1={row.x0}
              x2={row.x1}
              y1={row.y}
              y2={row.y}
            />
            <line
              class:bx--viz-forest__cap={true}
              x1={row.x0}
              x2={row.x0}
              y1={row.y - 4}
              y2={row.y + 4}
            />
            <line
              class:bx--viz-forest__cap={true}
              x1={row.x1}
              x2={row.x1}
              y1={row.y - 4}
              y2={row.y + 4}
            />
            <rect
              class:bx--viz-forest__marker={true}
              x={row.x - row.size / 2}
              y={row.y - row.size / 2}
              width={row.size}
              height={row.size}
            />
          </g>
          {#if valueWidth > 0}
            <text
              class:bx--viz-forest__value={true}
              x={width - valueWidth + PAD}
              y={row.y}
              dy="0.32em"
            >
              {formatValue(row.estimate)}
              ({formatValue(row.lo)},
              {formatValue(
                row.hi,
              )})
            </text>
          {/if}
          <title>{describe(row)}</title>
        </g>
      {/each}
      {#if forest.overall}
        <g class:bx--viz-forest__overall={true}>
          <line
            class:bx--viz-forest__rule={true}
            x1="0"
            x2={width}
            y1={forest.overall.y - rowHeight / 2}
            y2={forest.overall.y - rowHeight / 2}
          />
          <text
            class:bx--viz-forest__label={true}
            class:bx--viz-forest__label--overall={true}
            x={labelWidth}
            y={forest.overall.y}
            dy="0.32em"
            text-anchor="end"
          >
            {forest.overall.label}
          </text>
          <path
            class:bx--viz-forest__diamond={true}
            class:bx--viz-forest__diamond--clear={forest.overall.clear}
            transform="translate({labelWidth + PAD} 0)"
            d={forest.overall.d}
          />
          {#if valueWidth > 0}
            <text
              class:bx--viz-forest__value={true}
              class:bx--viz-forest__value--overall={true}
              x={width - valueWidth + PAD}
              y={forest.overall.y}
              dy="0.32em"
            >
              {formatValue(forest.overall.estimate)}
              ({formatValue(
                forest.overall.lo,
              )}, {formatValue(forest.overall.hi)})
            </text>
          {/if}
          <title>{describe(forest.overall)}</title>
        </g>
      {/if}
    </g>
  </svg>
  <!-- Every row, for assistive technology. -->
  <table class:bx--visually-hidden={true}>
    {#if title}
      <caption>
        {title}
      </caption>
    {/if}
    <thead>
      <tr>
        <th scope="col">{text.row}</th>
        <th scope="col">{text.estimate}</th>
        <th scope="col">{text.interval}</th>
        {#if weightOf}
          <th scope="col">{text.weight}</th>
        {/if}
      </tr>
    </thead>
    <tbody>
      {#each forest.rows as row (row.label)}
        <tr>
          <th scope="row">{row.label}</th>
          <td>{formatValue(row.estimate)}</td>
          <td>{formatValue(row.lo)} to {formatValue(row.hi)}</td>
          {#if weightOf}
            <td>
              {Number.isFinite(row.weight) ? formatValue(row.weight) : ""}
            </td>
          {/if}
        </tr>
      {/each}
      {#if forest.overall}
        <tr>
          <th scope="row">{forest.overall.label}</th>
          <td>{formatValue(forest.overall.estimate)}</td>
          <td>
            {formatValue(forest.overall.lo)}
            to
            {formatValue(
              forest.overall.hi,
            )}
          </td>
          {#if weightOf}
            <td></td>
          {/if}
        </tr>
      {/if}
    </tbody>
  </table>
  <div class:bx--visually-hidden={true} aria-live="polite">{announcement}</div>
</figure>
