<script>
  /**
   * Group a set of `ProfileMenuItem` components in the default slot.
   * @restProps {div}
   */

  /**
   * Obtain a reference to the HTML element.
   * @bindable readonly
   * @type {null | HTMLDivElement}
   */
  export let ref = null;
</script>

<div bind:this={ref} class:bx--profile-menu__list={true} {...$$restProps}>
  <slot />
</div>
