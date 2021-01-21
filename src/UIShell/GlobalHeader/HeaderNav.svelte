<script>
  /**
   * Specify the ARIA label for the nav
   * @deprecated use "aria-label" instead
   * @type {string}
   */
  export let ariaLabel = undefined;

  $: props = {
    "aria-label": ariaLabel || $$props["aria-label"],
    "aria-labelledby": $$props["aria-labelledby"],
  };
</script>

<nav {...props} class:bx--header__nav="{true}" {...$$restProps}>
  <ul {...props} class:bx--header__menu-bar="{true}">
    <slot />
  </ul>
</nav>
