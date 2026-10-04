<script>
  /**
   * Set to `true` to add a divider between the header
   * navigation items and the side nav items.
   */
  export let hasDivider = false;
</script>

<!-- Holds the same items as `HeaderNav`'s menubar, so it shares its role. -->
<ul
  role="menubar"
  aria-orientation="vertical"
  class:bx--side-nav__header-navigation={true}
  class:bx--side-nav__header-divider={hasDivider}
  {...$$restProps}
>
  <slot />
</ul>
