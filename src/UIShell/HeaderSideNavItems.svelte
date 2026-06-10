<script>
  /**
   * Set to `true` to add a divider between the header
   * navigation items and the side nav items.
   */
  export let hasDivider = false;
</script>

<ul
  class:bx--side-nav__header-navigation={true}
  class:bx--side-nav__header-divider={hasDivider}
  {...$$restProps}
>
  <slot />
</ul>
