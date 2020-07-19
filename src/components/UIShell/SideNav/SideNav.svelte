<script>
  export let ariaLabel = undefined;
  export let isOpen = undefined;
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
