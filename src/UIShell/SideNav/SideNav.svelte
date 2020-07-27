<script>
  /**
   * Specify the ARIA label for the nav
   * @type {string} [ariaLabel]
   */
  export let ariaLabel = undefined;

  /**
   * Set to `true` to toggle the expanded state
   * @type {boolean} [isOpen=false]
   */
  export let isOpen = false;
</script>

<nav
  aria-label={ariaLabel}
  class:bx--side-nav__navigation={true}
  class:bx--side-nav={true}
  class:bx--side-nav--ux={true}
  class:bx--side-nav--expanded={isOpen}
  {...$$restProps}>
  <slot />
</nav>
