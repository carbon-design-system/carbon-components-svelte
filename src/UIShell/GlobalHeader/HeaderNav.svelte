<script>
  /**
   * Specify the ARIA label for the nav
   * @type {string}
   */
  export let ariaLabel = undefined;
</script>

<nav aria-label="{ariaLabel}" class:bx--header__nav="{true}" {...$$restProps}>
  <ul
    role="menubar"
    aria-label="{ariaLabel}"
    class:bx--header__menu-bar="{true}"
  >
    <slot />
  </ul>
</nav>
