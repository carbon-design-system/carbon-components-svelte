<script>
  /** @restProps {figure} */

  /**
   * Text label rendered above the value.
   * @type {string}
   */
  export let labelText;

  /**
   * The primary value to display (the "numerator" of a fraction).
   * @type {number}
   */
  export let value = undefined;

  /**
   * The number to render after the slash (the "denominator" of a fraction).
   * Hidden if it's the same as `value` or if `percentage` is `true`; see `forceShowTotal`.
   * @type {number}
   */
  export let total = undefined;

  /**
   * Set to `true` to append a percent sign (%) after `value` and hide `total`.
   */
  export let percentage = false;

  /**
   * Set to `true` to show `total` even when the default visibility rule would hide it.
   */
  export let forceShowTotal = false;

  /** Specify the number of fraction digits used when formatting `value` and `total`. */
  export let fractionDigits = 1;

  /** Set to `true` to render the full number instead of an abbreviated one (e.g. `1,000` instead of `1K`). */
  export let fullNumber = false;

  /**
   * Render a trend indicator next to the value.
   * @type {"up" | "down"}
   */
  export let trend = undefined;

  /**
   * Override the trend indicator's color. Defaults to `"success"` for `trend="up"` and
   * `"error"` for `trend="down"` — set this when the direction's meaning is reversed for
   * the metric (e.g. a falling error rate, or a rising failure count).
   * @type {"success" | "error"}
   */
  export let trendColor = undefined;

  /**
   * Specify the size of the big number.
   * @type {"default" | "lg" | "xl"}
   */
  export let size = "default";

  /** Specify the tooltip text. When set, an information icon renders next to `labelText`. */
  export let tooltipDescription = "";

  /**
   * Determines how `value` and `total` are formatted. Defaults to the runtime locale.
   * @type {string}
   */
  export let locale = undefined;

  /** Set to `true` to render the loading skeleton in place of the value. */
  export let loading = false;

  import ArrowDown from "../icons/ArrowDown.svelte";
  import ArrowUp from "../icons/ArrowUp.svelte";
  import Tooltip from "../Tooltip/Tooltip.svelte";
  import BigNumberSkeleton from "./BigNumberSkeleton.svelte";

  const DASH = "–";

  function formatNumber(num, digits, doTruncate) {
    if (typeof num !== "number" || Number.isNaN(num)) return undefined;
    const options = { maximumFractionDigits: digits };
    if (doTruncate) {
      options.notation = "compact";
      options.compactDisplay = "short";
    }
    return new Intl.NumberFormat(locale, options).format(num);
  }

  function getIconSize(currentSize) {
    if (currentSize === "xl") return 24;
    if (currentSize === "lg") return 20;
    return 16;
  }

  $: hasTotal = typeof total === "number";
  $: formattedValue = formatNumber(value, fractionDigits, !fullNumber);
  $: formattedTotal = hasTotal
    ? formatNumber(total, fractionDigits, !fullNumber)
    : undefined;
  $: showDenominator =
    hasTotal &&
    (forceShowTotal ||
      (!percentage && total > value && formattedValue !== formattedTotal));
  $: displayValue = `${formattedValue ?? DASH}${percentage ? "%" : ""}`;
  $: resolvedTrendColor = trendColor ?? (trend === "up" ? "success" : "error");
</script>

{#if loading}
  <BigNumberSkeleton {size} {...$$restProps} />
{:else}
  <figure
    class:bx--big-number={true}
    class:bx--big-number--lg={size === "lg"}
    class:bx--big-number--xl={size === "xl"}
    {...$$restProps}
  >
    <figcaption class:bx--big-number__label={true}>
      <span class:bx--big-number__label-text={true}>
        <slot name="labelChildren">{labelText}</slot>
      </span>
      {#if tooltipDescription}
        <Tooltip
          class="bx--big-number__tooltip"
          iconDescription={tooltipDescription}
          align="center"
          direction="top"
        >
          {tooltipDescription}
        </Tooltip>
      {/if}
    </figcaption>
    <div class:bx--big-number__value-row={true} role="math">
      <span class:bx--big-number__value={true}>{displayValue}</span>
      {#if trend === "up"}
        <ArrowUp
          size={getIconSize(size)}
          class="bx--big-number__trend-icon bx--big-number__trend-icon--{resolvedTrendColor}"
          aria-hidden="true"
        />
      {:else if trend === "down"}
        <ArrowDown
          size={getIconSize(size)}
          class="bx--big-number__trend-icon bx--big-number__trend-icon--{resolvedTrendColor}"
          aria-hidden="true"
        />
      {/if}
      {#if showDenominator}
        <span class:bx--big-number__denominator={true}>/ {formattedTotal}</span>
      {/if}
    </div>
  </figure>
{/if}
