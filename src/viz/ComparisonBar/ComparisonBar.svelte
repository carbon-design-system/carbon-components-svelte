<svelte:options immutable />

<script>
  /** @restProps {div} */

  /** Specify the current value */
  export let value = 0;

  /**
   * Specify the value to compare against.
   * @type {number | null}
   */
  export let previous = undefined;

  /** Specify the label of the current row */
  export let valueLabel = "Current";

  /** Specify the label of the comparison row */
  export let previousLabel = "Previous";

  /**
   * Specify the accessible name, used as the table caption.
   * Leave empty to mark the graphic as decorative.
   */
  export let label = "";

  /** Set to `true` to show the relative change next to the bars */
  export let showDelta = false;

  /**
   * Specify which direction is good. Passed to the delta.
   * @type {"up" | "down"}
   */
  export let positive = "up";

  /**
   * Specify how values are written: `Intl.NumberFormat` options or a function.
   * @type {import("../utils/format-compact.js").NumberFormat}
   */
  export let format = undefined;

  /**
   * Specify the color of the current bar. The comparison bar is always neutral.
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
   * Override the visually hidden column headers.
   * @type {{ period?: string; value?: string }}
   */
  export let headerLabels = {};

  /**
   * Obtain a reference to the HTML element.
   * @bindable readonly
   * @type {null | HTMLDivElement}
   */
  export let ref = null;

  import DeltaIndicator from "../DeltaIndicator/DeltaIndicator.svelte";
  import { resolveFormat } from "../utils/format-compact.js";
  import { VIZ_SEMANTIC_COLORS, vizColor } from "../utils/tokens.js";

  /** @param {number | null | undefined} v */
  function clean(v) {
    return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : 0;
  }

  $: formatValue = resolveFormat(format, locale);
  $: hasPrevious = typeof previous === "number" && Number.isFinite(previous);
  $: max = Math.max(clean(value), clean(previous));
  $: valuePct = max > 0 ? (clean(value) / max) * 100 : 0;
  $: previousPct = max > 0 ? (clean(previous) / max) * 100 : 0;
  $: change =
    hasPrevious && previous !== 0 && Number.isFinite(value)
      ? (value - Number(previous)) / Math.abs(Number(previous))
      : null;
  $: headers = { period: "Period", value: "Value", ...headerLabels };
  $: inlineColor =
    color === "interactive"
      ? undefined
      : VIZ_SEMANTIC_COLORS.includes(color)
        ? `var(--cds-viz-${color})`
        : vizColor(color);
</script>

<div
  bind:this={ref}
  class:bx--viz-comparison-bar={true}
  class:bx--viz-comparison-bar--sm={size === "sm"}
  class:bx--viz-comparison-bar--lg={size === "lg"}
  aria-hidden={label ? undefined : "true"}
  style:--bx-viz-color={inlineColor}
  {...$$restProps}
>
  <table class:bx--viz-comparison-bar__table={true}>
    {#if label}
      <caption class:bx--visually-hidden={true}>
        {label}
      </caption>
    {/if}
    <thead class:bx--visually-hidden={true}>
      <tr>
        <th scope="col">{headers.period}</th>
        <td></td>
        <th scope="col">{headers.value}</th>
      </tr>
    </thead>
    <tbody>
      <tr style:--bx-viz-pct={valuePct}>
        <th scope="row" class:bx--viz-comparison-bar__label={true}>
          {valueLabel}
        </th>
        <td class:bx--viz-comparison-bar__track-cell={true} aria-hidden="true">
          <div class:bx--viz-comparison-bar__bar={true}></div>
        </td>
        <td class:bx--viz-comparison-bar__value={true}>
          {Number.isFinite(value) ? formatValue(value) : "–"}
        </td>
      </tr>
      <tr
        class:bx--viz-comparison-bar__row--previous={true}
        class:bx--viz-comparison-bar__row--empty={!hasPrevious}
        style:--bx-viz-pct={previousPct}
      >
        <th scope="row" class:bx--viz-comparison-bar__label={true}>
          {previousLabel}
        </th>
        <td class:bx--viz-comparison-bar__track-cell={true} aria-hidden="true">
          <div class:bx--viz-comparison-bar__bar={true}></div>
        </td>
        <td class:bx--viz-comparison-bar__value={true}>
          {hasPrevious ? formatValue(Number(previous)) : "–"}
        </td>
      </tr>
    </tbody>
  </table>
  {#if showDelta}
    <DeltaIndicator
      value={change}
      format="percent"
      {positive}
      {size}
      {locale}
    />
  {/if}
</div>
