<script>
  /**
   * Specify the badge count.
   * Omit or set to `0` to render an empty dot.
   * A numeric count greater than `999` displays as "999+".
   * Pass a string to override the displayed value (e.g. `"1.2k"`).
   * @type {number | string}
   */
  export let count = undefined;

  /**
   * Obtain a reference to the HTML element.
   * @bindable readonly
   */
  export let ref = null;

  $: hasCount =
    (typeof count === "number" && count > 0) ||
    (typeof count === "string" && count.length > 0);
  $: countLabel =
    typeof count === "string"
      ? count
      : typeof count === "number" && count > 999
        ? "999+"
        : count;
</script>

<div
  bind:this={ref}
  {...$$restProps}
  class:bx--badge-indicator={true}
  class:bx--badge-indicator--count={hasCount}
>
  {#if hasCount}
    {countLabel}
  {/if}
</div>
