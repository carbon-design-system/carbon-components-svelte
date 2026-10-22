<svelte:options immutable />

<script>
  /**
   * @slot {{ formattedValue: string }} value
   * @slot {{}} chart
   * @slot {{}} footer
   */

  /** @restProps {div | a} */

  /** Specify the name of the metric */
  export let label = "";

  /**
   * Specify the value. A missing or non-finite value renders a dash.
   * @type {number | null | undefined}
   */
  export let value = undefined;

  /**
   * Specify how the value is written: `Intl.NumberFormat` options or a
   * function. Defaults to compact notation.
   * @type {import("../utils/format-compact.js").NumberFormat}
   */
  export let format = undefined;

  /**
   * Specify the change against a baseline. Leave unset for no delta.
   * @type {number | null | undefined}
   */
  export let delta = undefined;

  /**
   * Specify how the delta is written.
   * @type {"number" | "percent" | Intl.NumberFormatOptions | ((value: number) => string)}
   */
  export let deltaFormat = "percent";

  /** Specify what the delta is against, such as "vs last month" */
  export let deltaLabel = "";

  /**
   * Specify which direction is good.
   * Set to `"down"` for metrics where lower is better, such as churn.
   * @type {"up" | "down"}
   */
  export let positive = "up";

  /**
   * Specify a link. The whole card becomes one.
   * @type {string}
   */
  export let href = undefined;

  /** Set to `true` while the value loads */
  export let loading = false;

  /**
   * Specify the locale.
   * @type {string}
   */
  export let locale = undefined;

  import SkeletonText from "../../SkeletonText/SkeletonText.svelte";
  import ClickableTile from "../../Tile/ClickableTile.svelte";
  import Tile from "../../Tile/Tile.svelte";
  import DeltaIndicator from "../DeltaIndicator/DeltaIndicator.svelte";
  import { resolveFormat } from "../utils/format-compact.js";

  $: formatValue = resolveFormat(format, locale);
  $: formattedValue =
    typeof value === "number" && Number.isFinite(value)
      ? formatValue(value)
      : "–";
  $: hasDelta = delta !== undefined && !loading;
</script>

<svelte:component
  this={href ? ClickableTile : Tile}
  {href}
  class="bx--viz-kpi"
  aria-busy={loading ? "true" : undefined}
  {...$$restProps}
>
  <div class:bx--viz-kpi__label={true}>{label}</div>
  {#if loading}
    <div class:bx--viz-kpi__skeleton={true}>
      <SkeletonText heading width="60%" />
    </div>
  {:else}
    <div class:bx--viz-kpi__row={true}>
      <span class:bx--viz-kpi__value={true}>
        <slot name="value" {formattedValue}>{formattedValue}</slot>
      </span>
      {#if hasDelta}
        <DeltaIndicator
          value={delta}
          format={deltaFormat}
          label={deltaLabel}
          {positive}
          {locale}
        />
      {/if}
    </div>
  {/if}
  {#if $$slots.chart}
    <!-- The value and the delta already say it, so the picture is decorative. -->
    <div class:bx--viz-kpi__chart={true} aria-hidden="true">
      <slot name="chart" />
    </div>
  {/if}
  {#if $$slots.footer}
    <div class:bx--viz-kpi__footer={true}>
      <slot name="footer" />
    </div>
  {/if}
</svelte:component>
