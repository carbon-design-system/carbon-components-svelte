<svelte:options immutable />

<script>
  /** @restProps {span} */

  /** Specify the part */
  export let value = 0;

  /** Specify the whole */
  export let total = 100;

  /**
   * Specify the accessible name. The share is appended to it.
   * Leave empty to mark the graphic as decorative.
   */
  export let label = "";

  /** Specify the text written after the percentage. Set to `""` for none. */
  export let suffix = "of total";

  /** Set to `true` to hide the percentage and the suffix */
  export let hideValue = false;

  /** Specify the maximum number of fraction digits */
  export let fractionDigits = 0;

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
   * Obtain a reference to the HTML element.
   * @bindable readonly
   * @type {null | HTMLSpanElement}
   */
  export let ref = null;

  import { formatPercent } from "../utils/format-compact.js";
  import { VIZ_SEMANTIC_COLORS, vizColor } from "../utils/tokens.js";

  $: share =
    Number.isFinite(value) && Number.isFinite(total) && total > 0
      ? Math.min(Math.max(value / total, 0), 1)
      : null;
  $: text =
    share === null
      ? ""
      : [formatPercent(share, { locale, digits: fractionDigits }), suffix]
          .filter(Boolean)
          .join(" ");
  $: name = [label, text].filter(Boolean).join(": ");
  $: inlineColor =
    color === "interactive"
      ? undefined
      : VIZ_SEMANTIC_COLORS.includes(color)
        ? `var(--cds-viz-${color})`
        : vizColor(color);
</script>

<span
  bind:this={ref}
  class:bx--viz-share={true}
  class:bx--viz-share--sm={size === "sm"}
  class:bx--viz-share--lg={size === "lg"}
  role={label ? "img" : undefined}
  aria-label={label ? name : undefined}
  aria-hidden={label ? undefined : "true"}
  style:--bx-viz-color={inlineColor}
  {...$$restProps}
>
  <span
    class:bx--viz-share__track={true}
    style:--bx-viz-pct={(share ?? 0) * 100}
  >
    <span
      class:bx--viz-share__fill={true}
      class:bx--viz-share__fill--empty={!share}
    ></span>
  </span>
  {#if !hideValue && text}
    <span class:bx--viz-share__value={true}>{text}</span>
  {/if}
</span>
