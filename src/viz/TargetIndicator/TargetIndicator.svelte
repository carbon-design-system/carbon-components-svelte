<svelte:options immutable />

<script>
  /** @restProps {div} */

  /**
   * Specify the value so far.
   * @type {number | null}
   */
  export let value = undefined;

  /** Specify the target, which is the end of the track */
  export let target = 100;

  /**
   * Specify where the value should be by now, drawn as a tick. Leave unset
   * to show only the target.
   * @type {number | null}
   */
  export let expected = undefined;

  /** Specify the start of the track */
  export let min = 0;

  /**
   * Specify the accessible name, such as the metric. The attainment and
   * the pace are appended to it. Leave empty to mark the graphic as
   * decorative.
   */
  export let label = "";

  /** Set to `true` to write the attainment next to the track */
  export let showValue = false;

  /**
   * Specify how values are written: `Intl.NumberFormat` options or a
   * function.
   * @type {import("../utils/format-compact.js").NumberFormat}
   */
  export let format = undefined;

  /**
   * Specify the size.
   * @type {"sm" | "md" | "lg"}
   */
  export let size = "md";

  /**
   * Override the words used for the pace.
   * @type {{ of?: string; ahead?: string; behind?: string; onPace?: string; met?: string }}
   */
  export let translations = {};

  /**
   * Specify the locale.
   * @type {string}
   */
  export let locale = undefined;

  /**
   * Obtain a reference to the HTML element.
   * @bindable readonly
   * @type {null | HTMLDivElement}
   */
  export let ref = null;

  import { formatPercent, resolveFormat } from "../utils/format-compact.js";

  $: words = {
    of: "of",
    ahead: "ahead of pace",
    behind: "behind pace",
    onPace: "on pace",
    met: "target met",
    ...translations,
  };
  $: amount =
    typeof value === "number" && Number.isFinite(value) ? value : null;
  $: goal = Number.isFinite(target) ? target : min;
  // The track runs to the target, or on to the value once it passes it.
  $: end = Math.max(goal, amount ?? goal);
  $: span = end - min;
  $: pctOf = (/** @type {number} */ at) =>
    span > 0 ? Math.min(Math.max(((at - min) / span) * 100, 0), 100) : 0;
  $: valuePct = amount === null ? 0 : pctOf(amount);
  $: targetPct = pctOf(goal);
  $: expectedPct =
    typeof expected === "number" && Number.isFinite(expected)
      ? pctOf(expected)
      : null;
  $: attainment =
    goal - min > 0 && amount !== null ? (amount - min) / (goal - min) : null;
  $: formatValue = resolveFormat(format, locale);
  $: pace =
    amount === null
      ? "none"
      : amount >= goal
        ? "met"
        : expectedPct === null
          ? "none"
          : amount > /** @type {number} */ (expected)
            ? "ahead"
            : amount < /** @type {number} */ (expected)
              ? "behind"
              : "onPace";
  $: text =
    amount === null
      ? "–"
      : `${formatValue(amount)} ${words.of} ${formatValue(goal)}`;
  $: name = [
    label,
    [
      text,
      attainment === null
        ? ""
        : formatPercent(attainment, { locale, digits: 0 }),
      pace === "none" ? "" : words[pace],
    ]
      .filter(Boolean)
      .join(", "),
  ]
    .filter(Boolean)
    .join(": ");
</script>

<div
  bind:this={ref}
  class:bx--viz-target={true}
  class:bx--viz-target--sm={size === "sm"}
  class:bx--viz-target--lg={size === "lg"}
  class="bx--viz-target--{pace}"
  role={label ? "img" : undefined}
  aria-label={label ? name : undefined}
  aria-hidden={label ? undefined : "true"}
  {...$$restProps}
>
  <!-- Every layer shares one grid cell, so the graphic mirrors in RTL. -->
  <span class:bx--viz-target__track={true}>
    <span
      class:bx--viz-target__measure={true}
      style:--bx-viz-pct={valuePct}
    ></span>
    {#if expectedPct !== null}
      <span
        class:bx--viz-target__expected={true}
        style:--bx-viz-pct={expectedPct}
      ></span>
    {/if}
    <span
      class:bx--viz-target__goal={true}
      style:--bx-viz-pct={targetPct}
    ></span>
  </span>
  {#if showValue}
    <span class:bx--viz-target__value={true}>{text}</span>
  {/if}
</div>
