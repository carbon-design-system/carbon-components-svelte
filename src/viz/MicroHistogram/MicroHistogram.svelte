<svelte:options immutable />

<script>
  /** @restProps {span} */

  /**
   * Specify the raw values to count into bins.
   * Ignored when `bins` is a list of bins.
   * @type {ReadonlyArray<number | null | undefined>}
   */
  export let values = [];

  /**
   * Specify a target bin count, a rule that derives one, or bins counted
   * elsewhere.
   * @type {number | "sturges" | "freedman-diaconis" | ReadonlyArray<import("../utils/bin.js").Bin>}
   */
  export let bins = "sturges";

  /**
   * Specify the range to bin over. Defaults to the extent of the values.
   * @type {readonly [number, number]}
   */
  export let domain = undefined;

  /**
   * Specify a value to mark, such as the current reading.
   * Drawn as a tick, and the bin that holds it is emphasized.
   * @type {number | null}
   */
  export let marker = undefined;

  /**
   * Specify the accessible name. The range and the marker are appended to it.
   * Leave empty to mark the graphic as decorative.
   */
  export let label = "";

  /**
   * Specify how values are written in the accessible name:
   * `Intl.NumberFormat` options or a function.
   * @type {import("../utils/format-compact.js").NumberFormat}
   */
  export let format = undefined;

  /**
   * Specify the color.
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
   * @type {{ range?: string; marker?: string }}
   */
  export let translations = {};

  /**
   * Obtain a reference to the HTML element.
   * @bindable readonly
   * @type {null | HTMLSpanElement}
   */
  export let ref = null;

  import { bin } from "../utils/bin.js";
  import { resolveFormat } from "../utils/format-compact.js";
  import { getHistogramGeometry } from "../utils/histogram.js";
  import { VIZ_SEMANTIC_COLORS, vizColor } from "../utils/tokens.js";

  $: counted =
    typeof bins === "number" || typeof bins === "string"
      ? bin(values, { bins, domain })
      : bins;
  $: geometry = getHistogramGeometry(counted, marker);
  $: formatValue = resolveFormat(format, locale);
  $: words = { range: "range", marker: "marker", ...translations };
  $: name = [
    label,
    [
      geometry.bars.length > 0
        ? `${words.range} ${formatValue(geometry.domain[0])}–${formatValue(geometry.domain[1])}`
        : "",
      geometry.markerPct === null
        ? ""
        : `${words.marker} ${formatValue(Number(marker))}`,
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

<span
  bind:this={ref}
  class:bx--viz-micro-histogram={true}
  class:bx--viz-micro-histogram--sm={size === "sm"}
  class:bx--viz-micro-histogram--lg={size === "lg"}
  class:bx--viz-micro-histogram--marked={geometry.markerPct !== null}
  role={label ? "img" : undefined}
  aria-label={label ? name : undefined}
  aria-hidden={label ? undefined : "true"}
  style:--bx-viz-color={inlineColor}
  {...$$restProps}
>
  <span class:bx--viz-micro-histogram__bars={true}>
    {#each geometry.bars as bar (bar.index)}
      <span
        class:bx--viz-micro-histogram__bar={true}
        class:bx--viz-micro-histogram__bar--marked={bar.marked}
        class:bx--viz-micro-histogram__bar--empty={bar.pct === 0}
        style:--bx-viz-pct={bar.pct}
      ></span>
    {/each}
  </span>
  {#if geometry.markerPct !== null}
    <span
      class:bx--viz-micro-histogram__marker={true}
      style:--bx-viz-pct={geometry.markerPct}
    ></span>
  {/if}
</span>
