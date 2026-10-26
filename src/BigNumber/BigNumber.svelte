<script context="module">
  /** @param {"default" | "lg" | "xl"} currentSize */
  function getIconSize(currentSize) {
    if (currentSize === "xl") return 24;
    if (currentSize === "lg") return 20;
    return 16;
  }
</script>

<script>
  /**
   * @restProps {figure}
   * @slot {{}}
   * @slot {{}} action - An inline action after the value, such as an icon-only `Button` or a `Link`.
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
   * Set to `true` to format `value` as a percentage and hide `total`.
   * `value` is the number of percent (`12` renders "12%"), never abbreviated.
   * The percent sign takes the locale's place and spacing ("%12" in Turkish,
   * "12 %" in French).
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

  /**
   * Set to `true` to format `delta` as a percentage instead of a plain number.
   * `delta` is the number of percent, as for `percentage`.
   */
  export let deltaPercentage = false;

  /** Trailing context rendered after the formatted `delta`, such as "vs last week". */
  export let deltaLabel = "";

  import Tooltip from "../Tooltip/Tooltip.svelte";
  import ArrowDown from "../icons/ArrowDown.svelte";
  import ArrowUp from "../icons/ArrowUp.svelte";
  import Subtract from "../icons/Subtract.svelte";
  import { formatDelta } from "../utils/format-delta.js";
  import { getNumberFormatter } from "../utils/intl-formatter-cache.js";
  import { localeDirection } from "../utils/locale-direction.js";
  import BigNumberSkeleton from "./BigNumberSkeleton.svelte";

  const DASH = "–";

  /**
   * Format `num` as text runs. A run with `mark` set is the percent sign,
   * with any space the locale puts beside it; it takes the total's type.
   * @param {number} num
   * @param {number} digits
   * @param {boolean} doTruncate
   * @param {boolean} [percent]
   * @returns {{ text: string; mark: boolean }[] | undefined}
   */
  function formatRuns(num, digits, doTruncate, percent = false) {
    if (typeof num !== "number" || Number.isNaN(num)) return undefined;
    if (format) {
      const text = format(num);
      return percent
        ? [
            { text, mark: false },
            { text: "%", mark: true },
          ]
        : [{ text, mark: false }];
    }
    /** @type {Intl.NumberFormatOptions} */
    const options = { maximumFractionDigits: digits };
    if (percent) {
      // The "percent" unit takes `num` as given, where `style: "percent"`
      // would need `num / 100` and can print float noise. A percentage is
      // never abbreviated: ICU's compact percent patterns move the sign in
      // Turkish ("%+4" for "+%4") and drop French's no-break space.
      options.style = "unit";
      options.unit = "percent";
    } else if (doTruncate) {
      options.notation = "compact";
      options.compactDisplay = "short";
    }
    Object.assign(options, formatOptions);
    const parts = getNumberFormatter(locale, options).formatToParts(num);
    const sign = (part) =>
      percent && (part?.type === "unit" || part?.type === "percentSign");
    /** @type {{ text: string; mark: boolean }[]} */
    const runs = [];
    parts.forEach((part, index) => {
      const mark =
        sign(part) ||
        ((sign(parts[index - 1]) || sign(parts[index + 1])) &&
          part.type === "literal" &&
          !part.value.trim());
      const last = runs[runs.length - 1];
      if (last?.mark === mark) last.text += part.value;
      else runs.push({ text: part.value, mark });
    });
    return runs;
  }

  /** @param {{ text: string }[] | undefined} runs */
  function joinRuns(runs) {
    return runs?.map((run) => run.text).join("");
  }

  $: hasTotal = typeof total === "number";
  $: valueRuns = formatRuns(value, fractionDigits, !fullNumber, percentage);
  $: formattedValue = joinRuns(valueRuns);
  $: fullValue = joinRuns(formatRuns(value, fractionDigits, false, percentage));
  $: formattedTotal = hasTotal
    ? joinRuns(formatRuns(total, fractionDigits, !fullNumber))
    : undefined;
  $: showDenominator =
    hasTotal &&
    (forceShowTotal || (!percentage && formattedValue !== formattedTotal));
  const TREND_ICONS = { up: ArrowUp, down: ArrowDown, flat: Subtract };
  $: TrendIcon = TREND_ICONS[trend];
  $: resolvedTrendColor =
    trendColor ?? { up: "success", down: "error", flat: "neutral" }[trend];
  $: resolvedTrendDescription =
    trendDescription ??
    { up: "Trending up", down: "Trending down", flat: "No change" }[trend];
  $: formattedDelta = formatDelta(delta, {
    locale,
    digits: fractionDigits,
    compact: !fullNumber,
    percent: deltaPercentage ? "literal" : undefined,
    formatOptions,
    format,
  });
  $: deltaColor = trend ? resolvedTrendColor : "neutral";
  // Each number sits in a `<bdi>` in its locale's direction. Without one, an
  // RTL page moves the sign of "+12%" to the far side ("12%+"). A custom
  // `format` has no known locale, so its text sets its own direction.
  /** @type {"auto" | "ltr" | "rtl"} */
  $: numberDir = format ? "auto" : localeDirection(locale);
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
      <!-- Whitespace between these nodes renders as text -->
      <!-- prettier-ignore -->
      <span
        class:bx--big-number__value={true}
        title={formattedValue === fullValue ? undefined : fullValue}
        ><bdi dir={numberDir}
          >{#if valueRuns}{#each valueRuns as run, index (index)}{#if run.mark}<span
                  class:bx--big-number__percentage-mark={true}>{run.text}</span
                >{:else}{run.text}{/if}{/each}{:else}{DASH}{/if}</bdi
        ></span
      >
      {#if TrendIcon}
        <svelte:component
          this={TrendIcon}
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
          <bdi dir={numberDir}>{formattedTotal}</bdi>
        </span>
      {/if}
      {#if $$slots.action}
        <span class:bx--big-number__action={true}><slot name="action" /></span>
      {/if}
    </div>
    {#if typeof delta === "number"}
      <div class:bx--big-number__delta={true}>
        <span
          class:bx--big-number__delta-value={true}
          class:bx--big-number__delta-value--success={deltaColor === "success"}
          class:bx--big-number__delta-value--error={deltaColor === "error"}
          class:bx--big-number__delta-value--neutral={deltaColor === "neutral"}
          ><bdi dir={numberDir}>{formattedDelta}</bdi></span
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
