<svelte:options immutable />

<script>
  /** @restProps {div} */

  /** Specify the start of the range */
  export let min = 0;

  /** Specify the end of the range */
  export let max = 100;

  /**
   * Specify the value, drawn as a dot.
   * @type {number | null}
   */
  export let value = undefined;

  /**
   * Specify the first quartile, the median, and the third quartile, drawn as
   * a box with a tick.
   * @type {ReadonlyArray<number>}
   */
  export let quartiles = undefined;

  /**
   * Specify the accessible name. The value and the range are appended to it.
   * Leave empty to mark the graphic as decorative.
   */
  export let label = "";

  /** Set to `true` to write the ends of the range beside the track */
  export let showRange = false;

  /**
   * Specify how values are written: `Intl.NumberFormat` options or a function.
   * @type {import("../utils/format-compact.js").NumberFormat}
   */
  export let format = undefined;

  /**
   * Specify the color of the dot.
   * @type {import("../utils/tokens.js").VizColor}
   */
  export let color = "interactive";

  /**
   * Specify the size.
   * @type {"sm" | "md" | "lg"}
   */
  export let size = "md";

  /**
   * Specify the locale.
   * @type {string}
   */
  export let locale = undefined;

  /**
   * Override the words used in the accessible name.
   * @type {{ range?: string; median?: string }}
   */
  export let translations = {};

  /**
   * Obtain a reference to the HTML element.
   * @bindable readonly
   * @type {null | HTMLDivElement}
   */
  export let ref = null;

  import { resolveFormat } from "../utils/format-compact.js";
  import { getRangeGeometry } from "../utils/range.js";
  import { VIZ_SEMANTIC_COLORS, vizColor } from "../utils/tokens.js";

  $: geometry = getRangeGeometry({ min, max, value, quartiles });
  $: formatValue = resolveFormat(format, locale);
  $: words = { range: "range", median: "median", ...translations };
  $: name = [
    label,
    [
      geometry.valuePct === null ? "" : formatValue(Number(value)),
      `${words.range} ${formatValue(min)}–${formatValue(max)}`,
      geometry.box && quartiles
        ? `${words.median} ${formatValue([...quartiles].sort((a, b) => a - b)[1])}`
        : "",
    ]
      .filter(Boolean)
      .join(", "),
  ]
    .filter(Boolean)
    .join(": ");
  $: inlineColor =
    color === "interactive"
      ? undefined
      : VIZ_SEMANTIC_COLORS.includes(color)
        ? `var(--cds-viz-${color})`
        : vizColor(color);
</script>

<div
  bind:this={ref}
  class:bx--viz-range={true}
  class:bx--viz-range--sm={size === "sm"}
  class:bx--viz-range--lg={size === "lg"}
  role={label ? "img" : undefined}
  aria-label={label ? name : undefined}
  aria-hidden={label ? undefined : "true"}
  style:--bx-viz-color={inlineColor}
  {...$$restProps}
>
  {#if showRange}
    <span class:bx--viz-range__end={true}>{formatValue(min)}</span>
  {/if}
  <span class:bx--viz-range__track={true}>
    <span class:bx--viz-range__whisker={true}></span>
    {#if geometry.box}
      <span
        class:bx--viz-range__box={true}
        style:--bx-viz-start={geometry.box.startPct}
        style:--bx-viz-pct={geometry.box.widthPct}
      ></span>
      <span
        class:bx--viz-range__median={true}
        style:--bx-viz-pct={geometry.box.medianPct}
      ></span>
    {/if}
    {#if geometry.valuePct !== null}
      <span
        class:bx--viz-range__value={true}
        class:bx--viz-range__value--outside={geometry.outside !== null}
        style:--bx-viz-pct={geometry.valuePct}
      ></span>
    {/if}
  </span>
  {#if showRange}
    <span class:bx--viz-range__end={true}>{formatValue(max)}</span>
  {/if}
</div>
