<svelte:options immutable />

<script>
  /** @restProps {span} */

  /**
   * Specify one value for each cell, in order. A missing value is drawn
   * hatched.
   * @type {ReadonlyArray<number | null | undefined>}
   */
  export let values = [];

  /**
   * Specify the hue of the sequential ramp.
   * @type {import("../utils/tokens.js").VizSequentialHue}
   */
  export let hue = "blue";

  /**
   * Specify the value mapped to the low end of the ramp.
   * Defaults to the smallest value.
   * @type {number}
   */
  export let min = undefined;

  /**
   * Specify the value mapped to the high end of the ramp.
   * Defaults to the largest value.
   * @type {number}
   */
  export let max = undefined;

  /**
   * Specify the accessible name. The range and the peak are appended to it.
   * Leave empty to mark the graphic as decorative.
   */
  export let label = "";

  /**
   * Specify a name for each cell, such as the hour. Used in the accessible
   * name to say where the peak is.
   * @type {ReadonlyArray<string>}
   */
  export let cellLabels = undefined;

  /**
   * Specify how values are written in the accessible name:
   * `Intl.NumberFormat` options or a function.
   * @type {import("../utils/format-compact.js").NumberFormat}
   */
  export let format = undefined;

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
   * @type {{ range?: string; peak?: string }}
   */
  export let translations = {};

  /**
   * Obtain a reference to the HTML element.
   * @bindable readonly
   * @type {null | HTMLSpanElement}
   */
  export let ref = null;

  import { sequentialColor } from "../utils/color-scale.js";
  import { resolveFormat } from "../utils/format-compact.js";

  $: strip = build(values, min, max, hue);
  $: formatValue = resolveFormat(format, locale);
  $: words = { range: "range", peak: "peak", ...translations };
  $: name = [
    label,
    strip.peakIndex < 0
      ? ""
      : [
          `${words.range} ${formatValue(strip.low)}–${formatValue(strip.high)}`,
          cellLabels?.[strip.peakIndex]
            ? `${words.peak} ${cellLabels[strip.peakIndex]}`
            : "",
        ]
          .filter(Boolean)
          .join(", "),
  ]
    .filter(Boolean)
    .join(": ");

  /**
   * @param {ReadonlyArray<number | null | undefined>} list
   * @param {number | undefined} lo
   * @param {number | undefined} hi
   * @param {import("../utils/tokens.js").VizSequentialHue} ramp
   */
  function build(list, lo, hi, ramp) {
    let low = Number.POSITIVE_INFINITY;
    let high = Number.NEGATIVE_INFINITY;
    let peakIndex = -1;
    for (let i = 0; i < list.length; i++) {
      const v = list[i];
      if (typeof v !== "number" || !Number.isFinite(v)) continue;
      if (v < low) low = v;
      if (v > high) {
        high = v;
        peakIndex = i;
      }
    }
    const from = lo ?? low;
    const to = hi ?? high;
    const span = to - from;

    const cells = list.map((v, index) => {
      if (typeof v !== "number" || !Number.isFinite(v)) {
        return { index, color: undefined };
      }
      const t = span > 0 ? Math.min(Math.max((v - from) / span, 0), 1) : 1;
      // Step 01 matches the background, so the ramp starts at step 02.
      return { index, color: sequentialColor(t, ramp, { minStep: 2 }) };
    });
    return { cells, low, high, peakIndex };
  }
</script>

<span
  bind:this={ref}
  class:bx--viz-heat-strip={true}
  class:bx--viz-heat-strip--sm={size === "sm"}
  class:bx--viz-heat-strip--lg={size === "lg"}
  role={label ? "img" : undefined}
  aria-label={label ? name : undefined}
  aria-hidden={label ? undefined : "true"}
  {...$$restProps}
>
  {#each strip.cells as cell (cell.index)}
    <span
      class:bx--viz-heat-strip__cell={true}
      class:bx--viz-heat-strip__cell--missing={cell.color === undefined}
      style:--bx-viz-color={cell.color}
    ></span>
  {/each}
</span>
