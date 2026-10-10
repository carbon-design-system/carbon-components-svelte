<svelte:options immutable />

<script>
  /** @restProps {div} */

  /** Specify how many steps are done. A fraction fills part of a step. */
  export let value = 0;

  /** Specify how many steps there are, one segment each */
  export let max = 5;

  /**
   * Specify the status, which colors the done segments. Leave unset for
   * the interactive color.
   * @type {"success" | "warning" | "error" | "info" | "neutral" | undefined}
   */
  export let status = undefined;

  /**
   * Specify the accessible name, such as the task. The progress is
   * appended to it. Leave empty to mark the graphic as decorative.
   */
  export let label = "";

  /** Set to `true` to write the progress next to the segments */
  export let showValue = false;

  /**
   * Specify the size.
   * @type {"sm" | "md" | "lg"}
   */
  export let size = "md";

  /**
   * Override the word between the counts: `4 of 8`.
   * @type {{ of?: string }}
   */
  export let translations = {};

  /**
   * Obtain a reference to the HTML element.
   * @bindable readonly
   * @type {null | HTMLDivElement}
   */
  export let ref = null;

  $: count = Math.max(1, Math.floor(max));
  $: done = Number.isFinite(value) ? Math.min(Math.max(value, 0), count) : 0;
  $: words = { of: "of", ...translations };
  $: text = `${formatCount(done)} ${words.of} ${count}`;
  $: name = [label, text].filter(Boolean).join(": ");
  // How full each segment is: whole ones, then the fraction, then none.
  $: fills = Array.from({ length: count }, (_, i) =>
    Math.min(Math.max(done - i, 0), 1),
  );

  /** @param {number} n */
  function formatCount(n) {
    return Number.isInteger(n) ? String(n) : n.toFixed(1);
  }
</script>

<div
  bind:this={ref}
  class:bx--viz-segments={true}
  class:bx--viz-segments--sm={size === "sm"}
  class:bx--viz-segments--lg={size === "lg"}
  class="bx--viz-segments--{status ?? "default"}"
  role={label ? "progressbar" : undefined}
  aria-label={label ? name : undefined}
  aria-valuemin={label ? 0 : undefined}
  aria-valuemax={label ? count : undefined}
  aria-valuenow={label ? done : undefined}
  aria-valuetext={label ? text : undefined}
  aria-hidden={label ? undefined : "true"}
  {...$$restProps}
>
  <span class:bx--viz-segments__track={true}>
    {#each fills as fill, i (i)}
      <span
        class:bx--viz-segments__segment={true}
        class:bx--viz-segments__segment--done={fill >= 1}
        class:bx--viz-segments__segment--partial={fill > 0 && fill < 1}
        style:--bx-viz-pct={fill > 0 && fill < 1 ? `${fill * 100}%` : undefined}
      ></span>
    {/each}
  </span>
  {#if showValue}
    <span class:bx--viz-segments__value={true}>{text}</span>
  {/if}
</div>
