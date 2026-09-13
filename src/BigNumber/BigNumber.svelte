<script context="module">
  import { BoundedFifoCache } from "../utils/boundedFifoCache.js";

  const formatterCache = new BoundedFifoCache(32);

  function getFormatter(formatterLocale, options) {
    const key = `${formatterLocale ?? ""}|${JSON.stringify(options)}`;
    let formatter = formatterCache.get(key);
    if (!formatter) {
      formatter = new Intl.NumberFormat(formatterLocale, options);
      formatterCache.set(key, formatter);
    }
    return formatter;
  }
</script>

<script>
  /**
   * @restProps {figure}
   * @slot {{}}
   */

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
   * Hidden when it formats identically to `value`, or when `percentage` is `true`;
   * see `forceShowTotal`.
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
   * @type {"up" | "down" | "flat"}
   */
  export let trend = undefined;

  /**
   * Override the trend indicator's color. Defaults to `"success"` for `trend="up"`,
   * `"error"` for `trend="down"`, and `"neutral"` for `trend="flat"` — set this when
   * the direction's meaning is reversed for the metric (e.g. a falling error rate,
   * or a rising failure count).
   * @type {"success" | "error" | "neutral"}
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

  /**
   * Additional options merged into the `Intl.NumberFormat` options used to format
   * `value` and `total`. Consumer keys take precedence over the component's defaults.
   * @type {Intl.NumberFormatOptions}
   * @example
   * `{ style: "currency", currency: "USD" }`
   * @example
   * `{ style: "unit", unit: "millisecond" }`
   */
  export let formatOptions = undefined;

  /**
   * Provide a custom formatter for `value` and `total`, replacing Intl formatting
   * entirely. Non-number inputs still render the dash.
   * @type {(value: number) => string}
   */
  export let format = undefined;

  /**
   * Override the text announced to assistive technology for the trend indicator.
   * Defaults to "Trending up", "Trending down", or "No change" based on `trend`.
   * @type {string}
   */
  export let trendDescription = undefined;

  /**
   * The signed change in `value` since the last period.
   * @type {number}
   */
  export let delta = undefined;

  /** Set to `true` to format `delta` as a percentage instead of a plain number. */
  export let deltaPercentage = false;

  /** Trailing context rendered after the formatted `delta`, such as "vs last week". */
  export let deltaLabel = "";

  import ArrowDown from "../icons/ArrowDown.svelte";
  import ArrowUp from "../icons/ArrowUp.svelte";
  import Subtract from "../icons/Subtract.svelte";
  import Tooltip from "../Tooltip/Tooltip.svelte";
  import BigNumberSkeleton from "./BigNumberSkeleton.svelte";

  const DASH = "–";

  function formatNumber(num, digits, doTruncate) {
    if (typeof num !== "number" || Number.isNaN(num)) return undefined;
    if (format) return format(num);
    const options = { maximumFractionDigits: digits };
    if (doTruncate) {
      options.notation = "compact";
      options.compactDisplay = "short";
    }
    Object.assign(options, formatOptions);
    return getFormatter(locale, options).format(num);
  }

  function getIconSize(currentSize) {
    if (currentSize === "xl") return 24;
    if (currentSize === "lg") return 20;
    return 16;
  }

  function formatDelta(num, digits, doTruncate) {
    if (typeof num !== "number" || Number.isNaN(num)) return undefined;
    if (format) {
      const formatted = format(num);
      return num > 0 ? `+${formatted}` : formatted;
    }
    const options = {
      signDisplay: "exceptZero",
      maximumFractionDigits: digits,
    };
    if (doTruncate) {
      options.notation = "compact";
      options.compactDisplay = "short";
    }
    if (deltaPercentage) return `${getFormatter(locale, options).format(num)}%`;
    Object.assign(options, formatOptions);
    return getFormatter(locale, options).format(num);
  }

  $: hasTotal = typeof total === "number";
  $: formattedValue = formatNumber(value, fractionDigits, !fullNumber);
  $: fullValue = formatNumber(value, fractionDigits, false);
  $: formattedTotal = hasTotal
    ? formatNumber(total, fractionDigits, !fullNumber)
    : undefined;
  $: showDenominator =
    hasTotal &&
    (forceShowTotal || (!percentage && formattedValue !== formattedTotal));
  $: displayValue = `${formattedValue ?? DASH}${percentage ? "%" : ""}`;
  $: resolvedTrendColor =
    trendColor ?? { up: "success", down: "error", flat: "neutral" }[trend];
  $: resolvedTrendDescription =
    trendDescription ??
    { up: "Trending up", down: "Trending down", flat: "No change" }[trend];
  $: formattedDelta = formatDelta(delta, fractionDigits, !fullNumber);
  $: deltaColor = trend ? resolvedTrendColor : "neutral";
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
    <div class:bx--big-number__value-row={true}>
      <span
        class:bx--big-number__value={true}
        title={formattedValue === fullValue ? undefined : fullValue}
        >{displayValue}</span
      >
      {#if trend === "up"}
        <ArrowUp
          size={getIconSize(size)}
          class="bx--big-number__trend-icon bx--big-number__trend-icon--{resolvedTrendColor}"
          aria-hidden="true"
        />
        <span class:bx--visually-hidden={true}>{resolvedTrendDescription}</span>
      {:else if trend === "down"}
        <ArrowDown
          size={getIconSize(size)}
          class="bx--big-number__trend-icon bx--big-number__trend-icon--{resolvedTrendColor}"
          aria-hidden="true"
        />
        <span class:bx--visually-hidden={true}>{resolvedTrendDescription}</span>
      {:else if trend === "flat"}
        <Subtract
          size={getIconSize(size)}
          class="bx--big-number__trend-icon bx--big-number__trend-icon--{resolvedTrendColor}"
          aria-hidden="true"
        />
        <span class:bx--visually-hidden={true}>{resolvedTrendDescription}</span>
      {/if}
      {#if showDenominator}
        <!-- "of" is only meaningful to screen readers; sighted users read the slash. -->
        <span class:bx--big-number__denominator={true}>
          <span class:bx--visually-hidden={true}>of</span>
          <span aria-hidden="true">/</span>
          {formattedTotal}
        </span>
      {/if}
    </div>
    {#if typeof delta === "number"}
      <div class:bx--big-number__delta={true}>
        <span
          class:bx--big-number__delta-value={true}
          class:bx--big-number__delta-value--success={deltaColor === "success"}
          class:bx--big-number__delta-value--error={deltaColor === "error"}
          class:bx--big-number__delta-value--neutral={deltaColor === "neutral"}
          >{formattedDelta}</span
        >
        {#if deltaLabel}
          <span class:bx--big-number__delta-label={true}>{deltaLabel}</span>
        {/if}
      </div>
    {/if}
    {#if $$slots.default}
      <div class:bx--big-number__footer={true}>
        <slot />
      </div>
    {/if}
  </figure>
{/if}
