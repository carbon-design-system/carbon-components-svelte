<svelte:options immutable />

<script>
  /** @restProps {span} */

  /**
   * Specify the change. A missing or non-finite value renders a dash.
   * @type {number | null | undefined}
   */
  export let value = undefined;

  /**
   * Specify how to format the value.
   * `"percent"` treats it as a ratio, so `0.123` reads `+12.3%`.
   * Pass `Intl.NumberFormat` options or a function for anything else.
   * A sign is always added to non-zero values.
   * @type {"number" | "percent" | Intl.NumberFormatOptions | ((value: number) => string)}
   */
  export let format = "number";

  /**
   * Specify which direction is good.
   * Set to `"down"` for metrics where lower is better, such as churn or latency.
   * Only the color changes. The arrow always follows the sign.
   * @type {"up" | "down"}
   */
  export let positive = "up";

  /**
   * Treat an absolute change at or below this value as no change.
   */
  export let threshold = 0;

  /**
   * Specify the maximum number of fraction digits.
   * Defaults to `1`, or to the format's own default when `format` is an
   * options object, so a currency keeps its two decimals.
   * @type {number}
   */
  export let fractionDigits = undefined;

  /** Set to `false` to write large numbers in full instead of compact notation */
  export let compact = true;

  /** Specify trailing context, such as "vs last week" */
  export let label = "";

  /**
   * Set to `true` to hide the arrow.
   * The sign stays, so the direction never rests on color alone.
   */
  export let hideIcon = false;

  /**
   * Specify the size.
   * @type {"sm" | "md" | "lg"}
   */
  export let size = "md";

  /**
   * Override the text announced to assistive technology.
   * Defaults to "Increased by", "Decreased by", or "No change", followed by the value.
   * @type {string}
   */
  export let description = undefined;

  /**
   * Specify the locale.
   * @type {string}
   */
  export let locale = undefined;

  /**
   * Obtain a reference to the HTML element.
   * @bindable readonly
   * @type {null | HTMLSpanElement}
   */
  export let ref = null;

  import ArrowDown from "../../icons/ArrowDown.svelte";
  import ArrowUp from "../../icons/ArrowUp.svelte";
  import Subtract from "../../icons/Subtract.svelte";
  import { formatDelta } from "../../utils/format-delta.js";

  const DASH = "–";
  const ICONS = { up: ArrowUp, down: ArrowDown, flat: Subtract };
  const ICON_SIZES = { sm: 12, md: 16, lg: 20 };

  function formatValue(num) {
    if (typeof format === "function") return formatDelta(num, { format });
    if (format && typeof format === "object") {
      return formatDelta(num, {
        locale,
        digits: fractionDigits,
        compact,
        formatOptions: format,
      });
    }
    const shared = { locale, digits: fractionDigits ?? 1, compact };
    if (format === "percent") {
      return formatDelta(num, { ...shared, percent: "ratio" });
    }
    return formatDelta(num, shared);
  }

  $: missing = typeof value !== "number" || !Number.isFinite(value);
  $: direction =
    missing || Math.abs(value) <= threshold
      ? "flat"
      : value > 0
        ? "up"
        : "down";
  $: tone =
    direction === "flat"
      ? "neutral"
      : direction === positive
        ? "success"
        : "error";
  $: formatted = missing ? DASH : formatValue(value);
  $: magnitude = missing ? "" : formatValue(Math.abs(value)).replace(/^\+/, "");
  $: announcement =
    description ??
    (missing
      ? "No change data"
      : direction === "flat"
        ? "No change"
        : `${direction === "up" ? "Increased" : "Decreased"} by ${magnitude}`);
</script>

<span
  bind:this={ref}
  class:bx--viz-delta={true}
  class:bx--viz-delta--sm={size === "sm"}
  class:bx--viz-delta--lg={size === "lg"}
  class:bx--viz-delta--success={tone === "success"}
  class:bx--viz-delta--error={tone === "error"}
  class:bx--viz-delta--neutral={tone === "neutral"}
  {...$$restProps}
>
  {#if !hideIcon && !missing}
    <svelte:component
      this={ICONS[direction]}
      size={ICON_SIZES[size] ?? 16}
      class="bx--viz-delta__icon"
    />
  {/if}
  <span class:bx--viz-delta__value={true} aria-hidden="true">{formatted}</span>
  <span class:bx--visually-hidden={true}>{announcement}</span>
  {#if label}
    <span class:bx--viz-delta__label={true}>{label}</span>
  {/if}
</span>
