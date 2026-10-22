<svelte:options immutable />

<script>
  /** @restProps {div} */

  /**
   * Specify the variance: actual minus plan, or any signed difference.
   * @type {number | null}
   */
  export let value = undefined;

  /**
   * Specify the variance that fills a whole side. Give every indicator in
   * a table the same one so their bars compare. Defaults to the value's own
   * magnitude, which fills the bar.
   * @type {number}
   */
  export let max = undefined;

  /**
   * Specify which direction is good. `"down"` suits cost and latency.
   * @type {"up" | "down"}
   */
  export let positive = "up";

  /**
   * Specify how the variance is written: `Intl.NumberFormat` options or a
   * function. A sign is always added.
   * @type {import("../utils/format-compact.js").NumberFormat}
   */
  export let format = undefined;

  /** Set to `false` to hide the written variance */
  export let showValue = true;

  /**
   * Specify the accessible name, such as the metric. The variance is
   * appended to it. Leave empty to mark the graphic as decorative.
   */
  export let label = "";

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
   * @type {null | HTMLDivElement}
   */
  export let ref = null;

  import { formatDelta } from "../../utils/format-delta.js";

  $: amount =
    typeof value === "number" && Number.isFinite(value) ? value : null;
  $: bound =
    typeof max === "number" && Number.isFinite(max) && max > 0
      ? max
      : Math.abs(amount ?? 0);
  $: pct =
    amount === null || bound === 0
      ? 0
      : Math.min(100, (Math.abs(amount) / bound) * 100);
  $: text =
    amount === null
      ? "–"
      : ((typeof format === "function"
          ? formatDelta(amount, { format })
          : formatDelta(amount, {
              locale,
              compact: format === undefined,
              formatOptions: format,
            })) ?? "–");
  $: tone =
    amount === null || amount === 0
      ? "neutral"
      : amount > 0 === (positive === "up")
        ? "favorable"
        : "unfavorable";
</script>

<div
  bind:this={ref}
  class:bx--viz-variance={true}
  class:bx--viz-variance--sm={size === "sm"}
  class:bx--viz-variance--lg={size === "lg"}
  class:bx--viz-variance--favorable={tone === "favorable"}
  class:bx--viz-variance--unfavorable={tone === "unfavorable"}
  role={label ? "img" : undefined}
  aria-label={label ? `${label}, ${text}` : undefined}
  aria-hidden={label ? undefined : "true"}
  {...$$restProps}
>
  <!-- Two halves around the zero line. A bar grows from it toward its sign. -->
  <div class:bx--viz-variance__track={true}>
    <div class:bx--viz-variance__half={true}>
      {#if amount !== null && amount < 0}
        <div class:bx--viz-variance__bar={true} style:--bx-viz-pct={pct}></div>
      {/if}
    </div>
    <div
      class:bx--viz-variance__half={true}
      class:bx--viz-variance__half--positive={true}
    >
      {#if amount !== null && amount > 0}
        <div class:bx--viz-variance__bar={true} style:--bx-viz-pct={pct}></div>
      {/if}
    </div>
  </div>
  {#if showValue}
    <span class:bx--viz-variance__value={true}>{text}</span>
  {/if}
</div>
