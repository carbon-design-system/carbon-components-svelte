<svelte:options immutable />

<script>
  /**
   * @template {string | number} [Id=string]
   */

  /** @restProps {span} */

  /**
   * Specify the stages, in order.
   * @type {ReadonlyArray<import("../utils/funnel.js").FunnelStage<Id>>}
   */
  export let stages = [];

  /**
   * Specify the accessible name. The overall conversion is appended to it.
   * Leave empty to mark the funnel as decorative.
   */
  export let label = "";

  /**
   * Specify the variant.
   * `"steps"` draws one segment per stage, stepping down in height.
   * `"completion"` reduces the funnel to one bar filled to the overall conversion.
   * @type {"steps" | "completion"}
   */
  export let variant = "steps";

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

  /** Set to `true` to hide the percentage next to the `"completion"` bar */
  export let hideValue = false;

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
  import { getFunnelStats } from "../utils/funnel.js";
  import { VIZ_SEMANTIC_COLORS, vizColor } from "../utils/tokens.js";

  $: funnel = getFunnelStats(stages);
  $: overall =
    funnel.overallRate === null
      ? ""
      : formatPercent(funnel.overallRate, { locale, digits: 1 });
  $: name = [label, overall ? `Overall conversion ${overall}` : ""]
    .filter(Boolean)
    .join(". ");
  $: inlineColor =
    color === "interactive"
      ? undefined
      : VIZ_SEMANTIC_COLORS.includes(color)
        ? `var(--cds-viz-${color})`
        : vizColor(color);
</script>

<span
  bind:this={ref}
  class:bx--viz-micro-funnel={true}
  class:bx--viz-micro-funnel--sm={size === "sm"}
  class:bx--viz-micro-funnel--lg={size === "lg"}
  class:bx--viz-micro-funnel--completion={variant === "completion"}
  role={label ? "img" : undefined}
  aria-label={label ? name : undefined}
  aria-hidden={label ? undefined : "true"}
  style:--bx-viz-color={inlineColor}
  {...$$restProps}
>
  {#if variant === "completion"}
    <span
      class:bx--viz-micro-funnel__track={true}
      style:--bx-viz-pct={(funnel.overallRate ?? 0) * 100}
    >
      <span class:bx--viz-micro-funnel__fill={true}></span>
    </span>
    {#if !hideValue && overall}
      <span class:bx--viz-micro-funnel__value={true}>{overall}</span>
    {/if}
  {:else}
    {#each funnel.rows as row (row.stage.id)}
      <span
        class:bx--viz-micro-funnel__step={true}
        style:--bx-viz-pct={row.stats.pct}
      ></span>
    {/each}
  {/if}
</span>
