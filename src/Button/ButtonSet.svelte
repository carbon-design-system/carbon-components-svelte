<script>
  /**
   * @restProps {div}
   */

  /** Set to `true` to stack the buttons vertically */
  export let stacked = false;

  /**
   * Obtain a reference to the HTML element.
   * @bindable readonly
   */
  export let ref = null;
</script>

<div
  bind:this={ref}
  class:bx--btn-set={true}
  class:bx--btn-set--stacked={stacked}
  {...$$restProps}
>
  <slot />
</div>
